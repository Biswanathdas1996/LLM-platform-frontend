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

# Document processing
import PyPDF2
import docx
from bs4 import BeautifulSoup
import markdown

logger = logging.getLogger(__name__)

class TextChunker:
    """Advanced text chunking with overlap and smart splitting"""
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 512, overlap: int = 100) -> List[Dict[str, Any]]:
        """
        Split text into chunks with overlap
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
                chunks.append({
                    'id': chunk_id,
                    'text': chunk_text,
                    'start_sentence': i - len(current_chunk),
                    'end_sentence': i - 1,
                    'word_count': current_size
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
            chunks.append({
                'id': chunk_id,
                'text': ' '.join(current_chunk),
                'start_sentence': len(sentences) - len(current_chunk),
                'end_sentence': len(sentences) - 1,
                'word_count': current_size
            })
        
        return chunks
    
    @staticmethod
    def _split_sentences(text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting - can be improved with NLTK
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
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
    """Simple in-memory vector store with hybrid search"""
    
    def __init__(self, embedding_dim: int = 768):
        self.embedding_dim = embedding_dim
        self.vectors = []
        self.metadata = []
        self.text_index = {}  # For keyword search
        self.embedder = SimpleEmbedder()
        
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
    
    def search(self, query: str, k: int = 5, mode: str = 'hybrid') -> List[Tuple[Dict, float]]:
        """
        Search for similar documents
        mode: 'vector', 'keyword', or 'hybrid'
        """
        if mode == 'vector':
            return self._vector_search(query, k)
        elif mode == 'keyword':
            return self._keyword_search(query, k)
        else:  # hybrid
            return self._hybrid_search(query, k)
    
    def _vector_search(self, query: str, k: int) -> List[Tuple[Dict, float]]:
        """Vector similarity search"""
        if not self.vectors:
            return []
        
        query_embedding = self.embedder.embed(query)
        
        # Calculate cosine similarities
        similarities = []
        for i, vec in enumerate(self.vectors):
            similarity = np.dot(query_embedding, vec)
            similarities.append((i, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top k results
        results = []
        for doc_id, score in similarities[:k]:
            results.append((self.metadata[doc_id], score))
        
        return results
    
    def _keyword_search(self, query: str, k: int) -> List[Tuple[Dict, float]]:
        """Keyword-based search"""
        query_words = set(self.embedder._tokenize(query))
        
        # Score documents based on keyword matches
        doc_scores = Counter()
        for word in query_words:
            if word in self.text_index:
                for doc_id in self.text_index[word]:
                    doc_scores[doc_id] += 1
        
        # Normalize scores
        max_score = max(doc_scores.values()) if doc_scores else 1
        
        # Get top k results
        top_docs = doc_scores.most_common(k)
        results = []
        for doc_id, count in top_docs:
            score = count / max_score
            results.append((self.metadata[doc_id], score))
        
        return results
    
    def _hybrid_search(self, query: str, k: int) -> List[Tuple[Dict, float]]:
        """Combine vector and keyword search"""
        # Get results from both methods
        vector_results = self._vector_search(query, k * 2)
        keyword_results = self._keyword_search(query, k * 2)
        
        # Combine scores
        combined_scores = {}
        
        # Add vector search results
        for metadata, score in vector_results:
            doc_id = metadata['doc_id']
            combined_scores[doc_id] = {
                'metadata': metadata,
                'vector_score': score,
                'keyword_score': 0,
                'combined_score': score * 0.7  # Weight for vector search
            }
        
        # Add keyword search results
        for metadata, score in keyword_results:
            doc_id = metadata['doc_id']
            if doc_id in combined_scores:
                combined_scores[doc_id]['keyword_score'] = score
                combined_scores[doc_id]['combined_score'] += score * 0.3  # Weight for keyword search
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
    """Process various document formats"""
    
    @staticmethod
    def process_file(filepath: str, filename: str) -> str:
        """Extract text from various file formats"""
        ext = os.path.splitext(filename)[1].lower()
        
        try:
            if ext == '.pdf':
                return DocumentProcessor._process_pdf(filepath)
            elif ext in ['.docx', '.doc']:
                return DocumentProcessor._process_docx(filepath)
            elif ext == '.txt':
                return DocumentProcessor._process_txt(filepath)
            elif ext == '.md':
                return DocumentProcessor._process_markdown(filepath)
            elif ext in ['.html', '.htm']:
                return DocumentProcessor._process_html(filepath)
            else:
                # Try to read as text
                return DocumentProcessor._process_txt(filepath)
        except Exception as e:
            logger.error(f"Error processing file {filename}: {e}")
            raise
    
    @staticmethod
    def _process_pdf(filepath: str) -> str:
        """Extract text from PDF"""
        text = []
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text.append(page.extract_text())
        return '\n'.join(text)
    
    @staticmethod
    def _process_docx(filepath: str) -> str:
        """Extract text from DOCX"""
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
    
    def __init__(self, storage_path: str = 'rag_storage'):
        self.storage_path = storage_path
        self.indexes = {}  # Multiple indexes for different document collections
        self.chunker = TextChunker()
        self.processor = DocumentProcessor()
        
        # Create storage directory
        os.makedirs(storage_path, exist_ok=True)
        os.makedirs(os.path.join(storage_path, 'documents'), exist_ok=True)
        os.makedirs(os.path.join(storage_path, 'indexes'), exist_ok=True)
        
        # Load existing indexes
        self._load_indexes()
    
    def create_index(self, index_name: str) -> Dict[str, Any]:
        """Create a new document index"""
        if index_name in self.indexes:
            return {'error': f'Index {index_name} already exists'}
        
        self.indexes[index_name] = {
            'vector_store': VectorStore(),
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
            
            # Chunk the text
            chunks = self.chunker.chunk_text(text)
            
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
            
            return {
                'success': True,
                'document_id': doc_id,
                'chunks': len(chunks),
                'size': file_size
            }
            
        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            return {'error': str(e)}
    
    def query(self, index_name: str, query: str, k: int = 5, mode: str = 'hybrid') -> Dict[str, Any]:
        """Query documents in an index"""
        if index_name not in self.indexes:
            return {'error': f'Index {index_name} not found'}
        
        try:
            vector_store = self.indexes[index_name]['vector_store']
            results = vector_store.search(query, k=k, mode=mode)
            
            # Format results
            formatted_results = []
            for metadata, score in results:
                formatted_results.append({
                    'text': metadata['text'],
                    'score': float(score),
                    'document_name': metadata.get('document_name', 'Unknown'),
                    'chunk_id': metadata.get('chunk_id', 0),
                    'metadata': {k: v for k, v in metadata.items() 
                               if k not in ['text', 'doc_id', 'document_name', 'chunk_id']}
                })
            
            return {
                'success': True,
                'query': query,
                'results': formatted_results,
                'mode': mode
            }
            
        except Exception as e:
            logger.error(f"Error querying index: {e}")
            return {'error': str(e)}
    
    def list_indexes(self) -> Dict[str, Any]:
        """List all available indexes"""
        index_list = []
        for name, index_data in self.indexes.items():
            index_list.append({
                'name': name,
                'created_at': index_data['created_at'],
                'stats': index_data['stats']
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