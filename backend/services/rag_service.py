"""
RAG (Retrieval Augmented Generation) Service for document processing and search
"""
import os
import json
import hashlib
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import pickle
import re
from collections import Counter
import math
from functools import lru_cache
import time

# Document processing with Docling
from docling.document_converter import DocumentConverter
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
import PyPDF2
import docx
from bs4 import BeautifulSoup
import markdown

logger = logging.getLogger(__name__)

class TextChunker:
    """Advanced text chunking with overlap and smart splitting"""
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 256, overlap: int = 50) -> List[Dict[str, Any]]:
        """
        Split text into smaller chunks with overlap for better retrieval
        Default chunk_size reduced to 256 words for more granular retrieval
        """
        chunks = []
        sentences = TextChunker._split_sentences(text)
        
        current_chunk = []
        current_size = 0
        chunk_id = 0
        
        for i, sentence in enumerate(sentences):
            sentence_size = len(sentence.split())
            
            # If adding this sentence exceeds chunk size, save current chunk
            if current_size + sentence_size > chunk_size and current_chunk:
                chunk_text = ' '.join(current_chunk)
                
                # Extract keywords for this chunk
                keywords = TextChunker._extract_keywords(chunk_text)
                
                chunks.append({
                    'id': chunk_id,
                    'text': chunk_text,
                    'start_sentence': i - len(current_chunk),
                    'end_sentence': i - 1,
                    'word_count': current_size,
                    'keywords': keywords  # Add keywords for search
                })
                
                # Create overlap by keeping last few sentences
                overlap_sentences = TextChunker._calculate_overlap(current_chunk, overlap)
                current_chunk = overlap_sentences
                current_size = sum(len(s.split()) for s in overlap_sentences)
                chunk_id += 1
            
            current_chunk.append(sentence)
            current_size += sentence_size
        
        # Add the last chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            keywords = TextChunker._extract_keywords(chunk_text)
            
            chunks.append({
                'id': chunk_id,
                'text': chunk_text,
                'start_sentence': len(sentences) - len(current_chunk),
                'end_sentence': len(sentences) - 1,
                'word_count': current_size,
                'keywords': keywords
            })
        
        return chunks
    
    @staticmethod
    def _split_sentences(text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting - can be improved with NLTK
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    @staticmethod
    def _extract_keywords(text: str, top_n: int = 10) -> List[str]:
        """
        Extract keywords from text using simple TF-IDF-like approach
        Returns top_n most relevant keywords
        """
        # Tokenize and clean
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Remove common stop words
        stop_words = {
            'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
            'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
            'it', 'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has',
            'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'can', 'shall', 'i', 'you', 'he', 'she', 'we',
            'they', 'what', 'when', 'where', 'who', 'how', 'not', 'no', 'yes'
        }
        
        # Filter words
        filtered_words = [
            w for w in words 
            if w not in stop_words and len(w) > 2  # Remove short words
        ]
        
        # Count word frequencies
        word_freq = Counter(filtered_words)
        
        # Get top keywords
        keywords = [word for word, count in word_freq.most_common(top_n)]
        
        return keywords
    
    @staticmethod
    def _calculate_overlap(sentences: List[str], overlap_size: int) -> List[str]:
        """Calculate overlap sentences based on word count"""
        if not sentences or overlap_size <= 0:
            return []
        
        overlap_sentences = []
        word_count = 0
        
        for sentence in reversed(sentences):
            sentence_words = len(sentence.split())
            if word_count + sentence_words <= overlap_size:
                overlap_sentences.insert(0, sentence)
                word_count += sentence_words
            else:
                break
        
        return overlap_sentences


class SimpleEmbedder:
    """Simple text embedding using TF-IDF and word vectors"""
    
    def __init__(self):
        self.vocabulary = {}
        self.idf_values = {}
        self.dimension = 768  # Standard embedding dimension
        
    def fit(self, documents: List[str]):
        """Build vocabulary and calculate IDF values"""
        # Build vocabulary
        all_words = []
        doc_word_counts = []
        
        for doc in documents:
            words = self._tokenize(doc)
            word_counts = Counter(words)
            doc_word_counts.append(word_counts)
            all_words.extend(set(words))
        
        # Create vocabulary index
        unique_words = list(set(all_words))
        self.vocabulary = {word: idx for idx, word in enumerate(unique_words)}
        
        # Calculate IDF values
        num_docs = len(documents)
        for word in self.vocabulary:
            doc_count = sum(1 for doc_counts in doc_word_counts if word in doc_counts)
            self.idf_values[word] = math.log((num_docs + 1) / (doc_count + 1)) + 1
    
    def embed(self, text: str) -> np.ndarray:
        """Create embedding for text"""
        words = self._tokenize(text)
        word_counts = Counter(words)
        
        # Create TF-IDF vector
        vector = np.zeros(self.dimension)
        
        for word, count in word_counts.items():
            if word in self.vocabulary:
                # TF-IDF score
                tf = count / len(words)
                idf = self.idf_values.get(word, 1.0)
                score = tf * idf
                
                # Hash word to get position in vector
                hash_val = int(hashlib.md5(word.encode()).hexdigest(), 16)
                position = hash_val % self.dimension
                vector[position] += score
        
        # Normalize vector
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        
        return vector
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        text = text.lower()
        words = re.findall(r'\b\w+\b', text)
        return words


class VectorStore:
    """Simple in-memory vector store with hybrid search and caching"""
    
    def __init__(self, embedding_dim: int = 768, enable_cache: bool = True, cache_size: int = 100):
        self.embedding_dim = embedding_dim
        self.vectors = []
        self.metadata = []
        self.text_index = {}  # For keyword search
        self.embedder = SimpleEmbedder()
        
        # Performance optimizations
        self.enable_cache = enable_cache
        self.cache_size = cache_size
        self._query_cache = {}  # Cache for query results
        self._last_query_time = {}  # Track query times for timeout
        
    def add_documents(self, texts: List[str], metadatas: List[Dict[str, Any]] = None):
        """Add documents to the vector store"""
        if metadatas is None:
            metadatas = [{}] * len(texts)
        
        # Fit embedder on all texts
        self.embedder.fit(texts)
        
        for text, metadata in zip(texts, metadatas):
            # Create embedding
            embedding = self.embedder.embed(text)
            
            # Store vector and metadata
            doc_id = len(self.vectors)
            self.vectors.append(embedding)
            
            # Store metadata with text
            metadata['text'] = text
            metadata['doc_id'] = doc_id
            self.metadata.append(metadata)
            
            # Build text index for keyword search
            words = self.embedder._tokenize(text)
            for word in set(words):
                if word not in self.text_index:
                    self.text_index[word] = []
                self.text_index[word].append(doc_id)
        
        # Clear cache when new documents are added
        self._query_cache.clear()
    
    def search(self, query: str, k: int = 5, mode: str = 'hybrid', min_score: float = 0.0, timeout: float = None) -> List[Tuple[Dict, float]]:
        """
        Search for similar documents with caching and timeout
        mode: 'vector', 'keyword', or 'hybrid'
        min_score: Minimum relevance score to include in results
        timeout: Maximum time in seconds for search operation
        """
        start_time = time.time()
        
        # Check cache
        cache_key = f"{query}_{k}_{mode}_{min_score}"
        if self.enable_cache and cache_key in self._query_cache:
            logger.debug(f"Cache hit for query: {query[:50]}...")
            return self._query_cache[cache_key]
        
        # Perform search based on mode
        try:
            if mode == 'vector':
                results = self._vector_search(query, k, timeout)
            elif mode == 'keyword':
                results = self._keyword_search(query, k, timeout)
            else:  # hybrid
                results = self._hybrid_search(query, k, timeout)
            
            # Filter by minimum score
            if min_score > 0:
                results = [(metadata, score) for metadata, score in results if score >= min_score]
            
            # Cache results (with size limit)
            if self.enable_cache:
                if len(self._query_cache) >= self.cache_size:
                    # Remove oldest entry (simple FIFO)
                    oldest_key = next(iter(self._query_cache))
                    del self._query_cache[oldest_key]
                self._query_cache[cache_key] = results
            
            query_time = time.time() - start_time
            logger.debug(f"RAG search completed in {query_time:.3f}s, found {len(results)} results")
            
            return results
            
        except TimeoutError as e:
            logger.error(f"RAG search timeout after {timeout}s: {e}")
            return []
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            return []
    
    def _check_timeout(self, start_time: float, timeout: float):
        """Check if operation has exceeded timeout"""
        if timeout and (time.time() - start_time) > timeout:
            raise TimeoutError(f"Operation exceeded timeout of {timeout}s")
    
    def _vector_search(self, query: str, k: int, timeout: float = None) -> List[Tuple[Dict, float]]:
        """Vector similarity search with timeout protection"""
        start_time = time.time()
        
        if not self.vectors:
            return []
        
        query_embedding = self.embedder.embed(query)
        self._check_timeout(start_time, timeout)
        
        # Calculate cosine similarities
        similarities = []
        for i, vec in enumerate(self.vectors):
            if i % 100 == 0:  # Check timeout periodically
                self._check_timeout(start_time, timeout)
            similarity = np.dot(query_embedding, vec)
            similarities.append((i, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top k results
        results = []
        for doc_id, score in similarities[:k]:
            results.append((self.metadata[doc_id], score))
        
        return results
    
    def _keyword_search(self, query: str, k: int, timeout: float = None) -> List[Tuple[Dict, float]]:
        """Keyword-based search with enhanced keyword matching and timeout"""
        start_time = time.time()
        
        query_words = set(self.embedder._tokenize(query))
        self._check_timeout(start_time, timeout)
        
        # Score documents based on keyword matches
        doc_scores = Counter()
        for word in query_words:
            if word in self.text_index:
                for doc_id in self.text_index[word]:
                    doc_scores[doc_id] += 1
        
        self._check_timeout(start_time, timeout)
        
        # Boost scores for documents with matching metadata keywords
        for doc_id, metadata in enumerate(self.metadata):
            if 'keywords' in metadata:
                doc_keywords = set(metadata['keywords'])
                keyword_matches = len(query_words & doc_keywords)
                if keyword_matches > 0:
                    # Boost score for keyword matches
                    doc_scores[doc_id] += keyword_matches * 2
        
        # Normalize scores
        max_score = max(doc_scores.values()) if doc_scores else 1
        
        # Get top k results
        top_docs = doc_scores.most_common(k)
        results = []
        for doc_id, count in top_docs:
            score = count / max_score
            results.append((self.metadata[doc_id], score))
        
        return results
    
    def _hybrid_search(self, query: str, k: int, timeout: float = None) -> List[Tuple[Dict, float]]:
        """Combine vector and keyword search with timeout"""
        start_time = time.time()
        
        # Get results from both methods (get more to ensure good final results)
        remaining_time = timeout - (time.time() - start_time) if timeout else None
        vector_results = self._vector_search(query, k * 2, remaining_time)
        
        self._check_timeout(start_time, timeout)
        
        remaining_time = timeout - (time.time() - start_time) if timeout else None
        keyword_results = self._keyword_search(query, k * 2, remaining_time)
        
        # Combine scores
        combined_scores = {}
        
        # Add vector search results (70% weight)
        for metadata, score in vector_results:
            doc_id = metadata['doc_id']
            combined_scores[doc_id] = {
                'metadata': metadata,
                'vector_score': score,
                'keyword_score': 0,
                'combined_score': score * 0.7
            }
        
        # Add keyword search results (30% weight)
        for metadata, score in keyword_results:
            doc_id = metadata['doc_id']
            if doc_id in combined_scores:
                combined_scores[doc_id]['keyword_score'] = score
                combined_scores[doc_id]['combined_score'] += score * 0.3
            else:
                combined_scores[doc_id] = {
                    'metadata': metadata,
                    'vector_score': 0,
                    'keyword_score': score,
                    'combined_score': score * 0.3
                }
        
        # Sort by combined score
        sorted_results = sorted(
            combined_scores.values(),
            key=lambda x: x['combined_score'],
            reverse=True
        )
        
        # Return top k results
        results = []
        for item in sorted_results[:k]:
            results.append((item['metadata'], item['combined_score']))
        
        return results
    
    def save(self, filepath: str):
        """Save vector store to disk"""
        data = {
            'vectors': self.vectors,
            'metadata': self.metadata,
            'text_index': self.text_index,
            'embedder': self.embedder
        }
        with open(filepath, 'wb') as f:
            pickle.dump(data, f)
    
    def load(self, filepath: str):
        """Load vector store from disk"""
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        self.vectors = data['vectors']
        self.metadata = data['metadata']
        self.text_index = data['text_index']
        self.embedder = data['embedder']


class DocumentProcessor:
    """Process various document formats using Docling for better extraction"""
    
    def __init__(self):
        """Initialize Docling document converter"""
        # Configure Docling pipeline for PDF processing
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = True  # Enable OCR for scanned documents
        pipeline_options.do_table_structure = True  # Extract table structures
        
        # Initialize converter with options (no backend specification needed - auto-detected)
        self.converter = DocumentConverter(
            format_options={
                InputFormat.PDF: pipeline_options,
            }
        )
    
    def process_file(self, filepath: str, filename: str) -> str:
        """Extract text from various file formats using Docling"""
        ext = os.path.splitext(filename)[1].lower()
        
        try:
            # Use Docling for PDF and DOCX files (better extraction)
            if ext in ['.pdf', '.docx', '.doc', '.pptx', '.ppt']:
                return self._process_with_docling(filepath)
            elif ext == '.txt':
                return self._process_txt(filepath)
            elif ext == '.md':
                return self._process_markdown(filepath)
            elif ext in ['.html', '.htm']:
                return self._process_html(filepath)
            else:
                # Try to read as text
                return self._process_txt(filepath)
        except Exception as e:
            logger.error(f"Error processing file {filename}: {e}")
            # Fallback to legacy methods if Docling fails
            try:
                if ext == '.pdf':
                    return self._process_pdf_legacy(filepath)
                elif ext in ['.docx', '.doc']:
                    return self._process_docx_legacy(filepath)
            except Exception as fallback_error:
                logger.error(f"Fallback processing also failed: {fallback_error}")
            raise
    
    def _process_with_docling(self, filepath: str) -> str:
        """
        Use Docling to extract text from document
        Docling provides better quality extraction for PDFs, Word docs, and PowerPoints
        """
        try:
            # Convert document using Docling
            result = self.converter.convert(filepath)
            
            # Extract markdown text (Docling converts to markdown)
            markdown_text = result.document.export_to_markdown()
            
            # You can also extract structured content
            # For now, we'll use the markdown representation
            return markdown_text
            
        except Exception as e:
            logger.error(f"Docling processing failed: {e}")
            raise
    
    def _process_pdf_legacy(self, filepath: str) -> str:
        """Legacy PDF extraction using PyPDF2 (fallback)"""
        text = []
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        return '\n'.join(text)
    
    def _process_docx_legacy(self, filepath: str) -> str:
        """Legacy DOCX extraction using python-docx (fallback)"""
        doc = docx.Document(filepath)
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return '\n'.join(text)
    
    @staticmethod
    def _process_txt(filepath: str) -> str:
        """Read text file"""
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    
    @staticmethod
    def _process_markdown(filepath: str) -> str:
        """Process markdown file"""
        with open(filepath, 'r', encoding='utf-8') as file:
            md_text = file.read()
        # Convert markdown to plain text (remove formatting)
        html = markdown.markdown(md_text)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()
    
    @staticmethod
    def _process_html(filepath: str) -> str:
        """Extract text from HTML"""
        with open(filepath, 'r', encoding='utf-8') as file:
            html = file.read()
        soup = BeautifulSoup(html, 'html.parser')
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        return soup.get_text()


class RAGService:
    """Main RAG service for document management and retrieval"""
    
    def __init__(self, storage_path: str = 'rag_storage', config=None):
        self.storage_path = storage_path
        self.indexes = {}  # Multiple indexes for different document collections
        self.chunker = TextChunker()
        
        # Load configuration
        self.config = config
        if config:
            self.chunk_size = getattr(config, 'RAG_CHUNK_SIZE', 150)
            self.chunk_overlap = getattr(config, 'RAG_CHUNK_OVERLAP', 30)
            self.default_k = getattr(config, 'RAG_DEFAULT_K', 3)
            self.max_k = getattr(config, 'RAG_MAX_K', 10)
            self.query_timeout = getattr(config, 'RAG_QUERY_TIMEOUT', 5)
            self.max_context_length = getattr(config, 'RAG_MAX_CONTEXT_LENGTH', 2000)
            self.enable_caching = getattr(config, 'RAG_ENABLE_CACHING', True)
            self.cache_size = getattr(config, 'RAG_CACHE_SIZE', 100)
            self.min_relevance_score = getattr(config, 'RAG_MIN_RELEVANCE_SCORE', 0.3)
        else:
            # Default values
            self.chunk_size = 150
            self.chunk_overlap = 30
            self.default_k = 3
            self.max_k = 10
            self.query_timeout = 5
            self.max_context_length = 2000
            self.enable_caching = True
            self.cache_size = 100
            self.min_relevance_score = 0.3
        
        # Initialize DocumentProcessor with Docling
        logger.info("Initializing document processor with Docling...")
        self.processor = DocumentProcessor()
        logger.info("Document processor initialized successfully")
        
        # Create storage directory
        os.makedirs(storage_path, exist_ok=True)
        os.makedirs(os.path.join(storage_path, 'documents'), exist_ok=True)
        os.makedirs(os.path.join(storage_path, 'indexes'), exist_ok=True)
        
        # Load existing indexes
        self._load_indexes()
        
        logger.info(f"RAG Service initialized with chunk_size={self.chunk_size}, default_k={self.default_k}, timeout={self.query_timeout}s")
    
    def create_index(self, index_name: str) -> Dict[str, Any]:
        """Create a new document index"""
        if index_name in self.indexes:
            return {'error': f'Index {index_name} already exists'}
        
        self.indexes[index_name] = {
            'vector_store': VectorStore(
                enable_cache=self.enable_caching,
                cache_size=self.cache_size
            ),
            'documents': [],
            'created_at': datetime.now().isoformat(),
            'stats': {
                'total_documents': 0,
                'total_chunks': 0,
                'total_size': 0
            }
        }
        
        return {'success': True, 'message': f'Index {index_name} created'}
    
    def upload_document(self, index_name: str, filepath: str, filename: str, metadata: Dict = None) -> Dict[str, Any]:
        """Process and add document to index"""
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        try:
            # Extract text from document
            text = self.processor.process_file(filepath, filename)
            
            # Generate document ID
            doc_id = hashlib.md5(f"{filename}_{datetime.now().isoformat()}".encode()).hexdigest()
            
            # Chunk the text with optimized settings
            chunks = self.chunker.chunk_text(text, chunk_size=self.chunk_size, overlap=self.chunk_overlap)
            
            # Prepare chunks for vector store
            chunk_texts = []
            chunk_metadatas = []
            
            for chunk in chunks:
                chunk_texts.append(chunk['text'])
                chunk_metadata = {
                    'document_id': doc_id,
                    'document_name': filename,
                    'chunk_id': chunk['id'],
                    'word_count': chunk['word_count'],
                    'keywords': chunk.get('keywords', []),  # Include keywords
                    **(metadata or {})
                }
                chunk_metadatas.append(chunk_metadata)
            
            # Add to vector store
            self.indexes[index_name]['vector_store'].add_documents(chunk_texts, chunk_metadatas)
            
            # Update index stats
            file_size = os.path.getsize(filepath)
            self.indexes[index_name]['documents'].append({
                'id': doc_id,
                'filename': filename,
                'filepath': filepath,
                'size': file_size,
                'chunks': len(chunks),
                'uploaded_at': datetime.now().isoformat(),
                'metadata': metadata
            })
            
            stats = self.indexes[index_name]['stats']
            stats['total_documents'] += 1
            stats['total_chunks'] += len(chunks)
            stats['total_size'] += file_size
            
            # Save index
            self._save_index(index_name)
            
            logger.info(f"Document '{filename}' uploaded to index '{index_name}': {len(chunks)} chunks created")
            
            return {
                'success': True,
                'document_id': doc_id,
                'chunks': len(chunks),
                'size': file_size
            }
            
        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            return {'error': str(e)}
    
    def query(self, index_name: str, query: str, k: int = None, mode: str = 'hybrid') -> Dict[str, Any]:
        """
        Query documents in a specific index only
        Ensures results are strictly from the specified index
        """
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        # Use configured default k if not specified
        if k is None:
            k = self.default_k
        
        # Cap k at max_k
        k = min(k, self.max_k)
        
        start_time = time.time()
        
        try:
            # Get vector store for THIS index only
            vector_store = self.indexes[index_name]['vector_store']
            
            # Verify the vector store has documents
            if not vector_store.vectors:
                return {
                    'success': True,
                    'query': query,
                    'results': [],
                    'mode': mode,
                    'message': f'No documents in index {index_name}'
                }
            
            # Search only within this index's vector store with timeout and min_score filter
            results = vector_store.search(
                query, 
                k=k, 
                mode=mode,
                min_score=self.min_relevance_score,
                timeout=self.query_timeout
            )
            
            # Format results and add index verification
            formatted_results = []
            total_context_length = 0
            
            for metadata, score in results:
                # Double-check that this result belongs to the current index
                doc_id = metadata.get('document_id')
                index_data = self.indexes[index_name]
                
                # Verify document belongs to this index
                doc_exists = any(doc['id'] == doc_id for doc in index_data['documents'])
                
                if doc_exists:
                    # Truncate text if needed to fit in context limit
                    text = metadata['text']
                    if total_context_length + len(text) > self.max_context_length:
                        remaining = self.max_context_length - total_context_length
                        text = text[:remaining] + "..."
                        if remaining <= 0:
                            break  # Skip remaining results if context is full
                    
                    total_context_length += len(text)
                    
                    formatted_results.append({
                        'text': text,
                        'score': float(score),
                        'document_name': metadata.get('document_name', 'Unknown'),
                        'chunk_id': metadata.get('chunk_id', 0),
                        'keywords': metadata.get('keywords', []),
                        'index_name': index_name,  # Add index name to verify source
                        'metadata': {k: v for k, v in metadata.items() 
                                   if k not in ['text', 'doc_id', 'document_name', 'chunk_id', 'keywords']}
                    })
                else:
                    logger.warning(f"Result with doc_id {doc_id} doesn't belong to index {index_name}")
            
            query_time = time.time() - start_time
            
            logger.info(f"RAG query completed in {query_time:.3f}s: {len(formatted_results)} results (min_score={self.min_relevance_score})")
            
            return {
                'success': True,
                'query': query,
                'index_name': index_name,  # Include index name in response
                'results': formatted_results,
                'mode': mode,
                'total_results': len(formatted_results),
                'query_time': query_time,
                'context_length': total_context_length
            }
            
        except Exception as e:
            logger.error(f"Error querying index {index_name}: {e}")
            return {'error': str(e), 'index_name': index_name}
    
    def query_multiple_indexes(self, index_names: List[str], query: str, k: int = None, mode: str = 'hybrid') -> Dict[str, Any]:
        """
        Query multiple indexes and merge results by relevance score
        """
        # Use configured default k if not specified
        if k is None:
            k = self.default_k
        
        # Cap k at max_k
        k = min(k, self.max_k)
        
        start_time = time.time()
        all_results = []
        errors = []
        
        # Query each index
        for index_name in index_names:
            if index_name not in self.indexes:
                errors.append(f'Index {index_name} not found')
                continue
            
            try:
                result = self.query(index_name, query, k=k, mode=mode)
                if result.get('success') and result.get('results'):
                    all_results.extend(result['results'])
            except Exception as e:
                errors.append(f'Error querying {index_name}: {str(e)}')
                logger.error(f"Error querying index {index_name}: {e}")
        
        # Sort all results by score (descending)
        all_results.sort(key=lambda x: x['score'], reverse=True)
        
        # Take top k results and limit by context length
        top_results = []
        total_context_length = 0
        
        for result in all_results:
            if len(top_results) >= k:
                break
                
            text_length = len(result['text'])
            if total_context_length + text_length > self.max_context_length:
                # Try to fit partial result
                remaining = self.max_context_length - total_context_length
                if remaining > 100:  # Only include if meaningful amount remains
                    result['text'] = result['text'][:remaining] + "..."
                    total_context_length += remaining
                    top_results.append(result)
                break
            
            total_context_length += text_length
            top_results.append(result)
        
        query_time = time.time() - start_time
        
        logger.info(f"Multi-index RAG query completed in {query_time:.3f}s: {len(top_results)} results from {len(index_names)} indexes")
        
        return {
            'success': True,
            'query': query,
            'index_names': index_names,
            'results': top_results,
            'mode': mode,
            'total_results': len(top_results),
            'queried_indexes': len([name for name in index_names if name in self.indexes]),
            'query_time': query_time,
            'context_length': total_context_length,
            'errors': errors if errors else None
        }
    
    def list_indexes(self) -> Dict[str, Any]:
        """List all available indexes with document names"""
        index_list = []
        for name, index_data in self.indexes.items():
            # Extract document names from the index
            document_names = [doc['filename'] for doc in index_data['documents']]
            
            index_list.append({
                'name': name,
                'created_at': index_data['created_at'],
                'stats': index_data['stats'],
                'documents': document_names  # Add list of document names
            })
        
        return {'indexes': index_list}
    
    def delete_index(self, index_name: str) -> Dict[str, Any]:
        """Delete an index"""
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        # Remove from memory
        del self.indexes[index_name]
        
        # Remove from disk
        index_path = os.path.join(self.storage_path, 'indexes', f'{index_name}.pkl')
        if os.path.exists(index_path):
            os.remove(index_path)
        
        return {'success': True, 'message': f'Index {index_name} deleted'}
    
    def get_index_info(self, index_name: str) -> Dict[str, Any]:
        """Get detailed information about an index"""
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        index_data = self.indexes[index_name]
        return {
            'name': index_name,
            'created_at': index_data['created_at'],
            'stats': index_data['stats'],
            'documents': index_data['documents']
        }
    
    def list_documents(self, index_name: str) -> Dict[str, Any]:
        """
        List all documents in an index with their metadata
        Returns a simplified view without full content
        """
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        index_data = self.indexes[index_name]
        documents = []
        
        for doc in index_data['documents']:
            documents.append({
                'id': doc['id'],
                'filename': doc['filename'],
                'size': doc['size'],
                'chunks': doc['chunks'],
                'uploaded_at': doc['uploaded_at'],
                'metadata': doc.get('metadata', {})
            })
        
        return {
            'success': True,
            'index_name': index_name,
            'total_documents': len(documents),
            'documents': documents
        }
    
    def get_document_details(self, index_name: str, document_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific document
        """
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        index_data = self.indexes[index_name]
        
        # Find the document
        document = None
        for doc in index_data['documents']:
            if doc['id'] == document_id:
                document = doc
                break
        
        if not document:
            return {'error': f'Document {document_id} not found in index {index_name}'}
        
        # Get all chunks for this document from vector store
        chunks = []
        for metadata in index_data['vector_store'].metadata:
            if metadata.get('document_id') == document_id:
                chunks.append({
                    'chunk_id': metadata.get('chunk_id', 0),
                    'text_preview': metadata.get('text', '')[:200] + '...',
                    'word_count': metadata.get('word_count', 0),
                    'keywords': metadata.get('keywords', [])
                })
        
        return {
            'success': True,
            'document': {
                'id': document['id'],
                'filename': document['filename'],
                'filepath': document.get('filepath', ''),
                'size': document['size'],
                'chunks': document['chunks'],
                'uploaded_at': document['uploaded_at'],
                'metadata': document.get('metadata', {})
            },
            'chunks': chunks
        }
    
    def delete_document(self, index_name: str, document_id: str) -> Dict[str, Any]:
        """
        Delete a specific document from an index
        Note: This doesn't remove vectors from the store (would need rebuild)
        """
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        index_data = self.indexes[index_name]
        
        # Find and remove the document
        document = None
        for i, doc in enumerate(index_data['documents']):
            if doc['id'] == document_id:
                document = index_data['documents'].pop(i)
                break
        
        if not document:
            return {'error': f'Document {document_id} not found in index {index_name}'}
        
        # Update stats
        index_data['stats']['total_documents'] -= 1
        index_data['stats']['total_chunks'] -= document['chunks']
        index_data['stats']['total_size'] -= document['size']
        
        # Save index
        self._save_index(index_name)
        
        return {
            'success': True,
            'message': f'Document {document["filename"]} deleted',
            'document_id': document_id
        }
    
    def _save_index(self, index_name: str):
        """Save index to disk"""
        index_path = os.path.join(self.storage_path, 'indexes', f'{index_name}.pkl')
        with open(index_path, 'wb') as f:
            pickle.dump(self.indexes[index_name], f)
    
    def _load_indexes(self):
        """Load all indexes from disk"""
        index_dir = os.path.join(self.storage_path, 'indexes')
        if not os.path.exists(index_dir):
            return
        
        for filename in os.listdir(index_dir):
            if filename.endswith('.pkl'):
                index_name = filename[:-4]
                index_path = os.path.join(index_dir, filename)
                try:
                    with open(index_path, 'rb') as f:
                        self.indexes[index_name] = pickle.load(f)
                    logger.info(f"Loaded index: {index_name}")
                except Exception as e:
                    logger.error(f"Error loading index {index_name}: {e}")