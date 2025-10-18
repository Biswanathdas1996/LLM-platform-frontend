import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mammoth from 'mammoth';
import natural from 'natural';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use local models (no remote calls)
env.allowLocalModels = true;
env.allowRemoteModels = true; // Allow downloading models once

interface Document {
  id: string;
  filename: string;
  chunks: Chunk[];
  metadata: Record<string, any>;
  uploadedAt: string;
}

interface Chunk {
  id: string;
  text: string;
  embedding?: number[];
  metadata: Record<string, any>;
}

interface Index {
  name: string;
  description?: string;
  documents: Document[];
  created_at: string;
  stats: {
    total_documents: number;
    total_chunks: number;
    total_size: number;
  };
}

export class RAGStorage {
  private baseDir: string;
  private indexes: Map<string, Index> = new Map();
  private tfidf: any;
  private embedder: any = null;
  private tokenizer: any = null;
  private embeddingModelPromise: Promise<void>;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.tfidf = new natural.TfIdf();
    this.embeddingModelPromise = this.initializeEmbeddingModel();
    this.initialize();
  }

  private async initializeEmbeddingModel() {
    try {
      console.log('Loading embedding model (this may take a moment on first run)...');
      // Use a small, efficient embedding model
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Use quantized version for speed
      });
      console.log('Embedding model loaded successfully');
    } catch (error) {
      console.error('Error loading embedding model:', error);
      console.log('Will fall back to keyword-only search');
    }
  }

  private async ensureEmbeddingModel() {
    await this.embeddingModelPromise;
  }

  private async initialize() {
    await fs.mkdir(this.baseDir, { recursive: true });
    await this.loadIndexes();
  }

  private async loadIndexes() {
    try {
      const indexesPath = path.join(this.baseDir, 'indexes.json');
      const exists = await fs.access(indexesPath).then(() => true).catch(() => false);
      
      if (exists) {
        const data = await fs.readFile(indexesPath, 'utf-8');
        const indexesData = JSON.parse(data);
        
        for (const indexData of indexesData) {
          this.indexes.set(indexData.name, indexData);
          
          // Re-register all chunks with TF-IDF for keyword search
          for (const doc of indexData.documents) {
            for (const chunk of doc.chunks) {
              this.tfidf.addDocument(chunk.text, {
                __key: {
                  indexName: indexData.name,
                  documentId: doc.id,
                  chunkId: chunk.id
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading indexes:', error);
    }
  }

  private async saveIndexes() {
    const indexesPath = path.join(this.baseDir, 'indexes.json');
    const indexesData = Array.from(this.indexes.values());
    await fs.writeFile(indexesPath, JSON.stringify(indexesData, null, 2));
  }

  async createIndex(name: string, description?: string) {
    if (this.indexes.has(name)) {
      return { success: false, error: 'Index already exists' };
    }

    const index: Index = {
      name,
      description,
      documents: [],
      created_at: new Date().toISOString(),
      stats: {
        total_documents: 0,
        total_chunks: 0,
        total_size: 0
      }
    };

    // Create index directory
    try {
      const indexDir = path.join(this.baseDir, name);
      await fs.mkdir(indexDir, { recursive: true });
    } catch (error) {
      console.error('Error creating index directory:', error);
    }

    this.indexes.set(name, index);
    await this.saveIndexes();

    return { success: true, message: `Index ${name} created successfully` };
  }

  async listIndexes() {
    return Array.from(this.indexes.values()).map(index => ({
      name: index.name,
      description: index.description,
      created_at: index.created_at,
      stats: index.stats
    }));
  }

  async getIndexInfo(name: string) {
    const index = this.indexes.get(name);
    if (!index) return null;
    
    return {
      name: index.name,
      description: index.description,
      created_at: index.created_at,
      stats: index.stats,
      documents: index.documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        uploadedAt: doc.uploadedAt,
        chunks: doc.chunks.length
      }))
    };
  }

  async deleteIndex(name: string) {
    if (!this.indexes.has(name)) {
      return { success: false, error: 'Index not found' };
    }

    // Delete index directory
    try {
      const indexDir = path.join(this.baseDir, name);
      await fs.rm(indexDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting index directory:', error);
    }

    this.indexes.delete(name);
    await this.saveIndexes();

    return { success: true, message: `Index ${name} deleted successfully` };
  }

  async addDocument(indexName: string, filepath: string, filename: string, metadata: Record<string, any> = {}) {
    const index = this.indexes.get(indexName);
    if (!index) {
      return { success: false, error: 'Index not found' };
    }

    try {
      // Extract text from document
      const text = await this.extractText(filepath, filename);
      
      // Chunk the text using semantic chunking
      const chunks = await this.semanticChunkText(text);
      
      // Ensure embedding model is loaded
      await this.ensureEmbeddingModel();
      
      // Generate embeddings for chunks
      const chunksWithEmbeddings: Chunk[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        let embedding: number[] | undefined;
        
        if (this.embedder) {
          try {
            const result = await this.embedder(chunkText, { pooling: 'mean', normalize: true });
            embedding = Array.from(result.data);
          } catch (error) {
            console.error('Error generating embedding:', error);
          }
        }
        
        chunksWithEmbeddings.push({
          id: `${crypto.randomBytes(8).toString('hex')}`,
          text: chunkText,
          embedding,
          metadata: {
            chunkIndex: i,
            documentId: '',
            ...metadata
          }
        });
      }
      
      // Create document
      const document: Document = {
        id: crypto.randomBytes(16).toString('hex'),
        filename,
        chunks: chunksWithEmbeddings,
        metadata,
        uploadedAt: new Date().toISOString()
      };

      // Set document ID in chunks
      document.chunks.forEach(chunk => {
        chunk.metadata.documentId = document.id;
      });

      // Add to TF-IDF for keyword search
      document.chunks.forEach(chunk => {
        this.tfidf.addDocument(chunk.text, {
          __key: {
            documentId: document.id,
            chunkId: chunk.id,
            indexName
          }
        });
      });

      // Add to index
      index.documents.push(document);
      
      // Update stats
      index.stats.total_documents++;
      index.stats.total_chunks += chunks.length;
      index.stats.total_size += metadata.size || 0;

      await this.saveIndexes();

      return {
        success: true,
        document_id: document.id,
        chunks: chunks.length
      };
    } catch (error) {
      console.error('Error adding document:', error);
      return { success: false, error: String(error) };
    }
  }

  async extractText(filepath: string, filename: string): Promise<string> {
    const ext = path.extname(filename).toLowerCase();
    const buffer = await fs.readFile(filepath);

    try {
      switch (ext) {
        case '.pdf':
          // Dynamic import for pdf-parse
          const pdfParseModule = await import('pdf-parse');
          const pdfParse = (pdfParseModule as any).default || pdfParseModule;
          const pdfData = await (pdfParse as any)(buffer);
          return pdfData.text;
        
        case '.docx':
        case '.doc':
          const result = await mammoth.extractRawText({ buffer });
          return result.value;
        
        case '.txt':
        case '.md':
        case '.json':
        case '.csv':
          return buffer.toString('utf-8');
        
        case '.html':
        case '.htm':
          // Simple HTML text extraction - remove tags
          const html = buffer.toString('utf-8');
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        default:
          // Try to read as text
          return buffer.toString('utf-8');
      }
    } catch (error) {
      console.error(`Error extracting text from ${filename}:`, error);
      throw error;
    }
  }

  // Advanced semantic chunking that respects sentence boundaries
  private async semanticChunkText(text: string, targetChunkSize: number = 512, maxChunkSize: number = 1024): Promise<string[]> {
    // Use natural's sentence tokenizer for better chunking
    const tokenizer = new natural.SentenceTokenizer();
    const sentences = tokenizer.tokenize(text);
    
    if (!sentences || sentences.length === 0) {
      // Fallback to simple word-based chunking
      return this.chunkText(text, targetChunkSize, 128);
    }

    const chunks: string[] = [];
    let currentChunk = '';
    let currentWordCount = 0;

    for (const sentence of sentences) {
      const sentenceWords = sentence.split(/\s+/).length;
      
      // If adding this sentence would exceed max chunk size, save current chunk
      if (currentWordCount + sentenceWords > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentWordCount = sentenceWords;
      } 
      // If we're at or above target size, start a new chunk
      else if (currentWordCount >= targetChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentWordCount = sentenceWords;
      } 
      // Otherwise, add to current chunk
      else {
        currentChunk += (currentChunk.length > 0 ? ' ' : '') + sentence;
        currentWordCount += sentenceWords;
      }
    }

    // Add the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  // Fallback simple chunking
  chunkText(text: string, chunkSize: number = 512, overlap: number = 128): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
    
    return chunks.length > 0 ? chunks : [text];
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async query(indexName: string, query: string, k: number = 5, mode: 'vector' | 'keyword' | 'hybrid' = 'hybrid') {
    const index = this.indexes.get(indexName);
    if (!index) {
      return { success: false, error: 'Index not found' };
    }

    try {
      let keywordResults: any[] = [];
      let vectorResults: any[] = [];

      // Keyword search using TF-IDF
      if (mode === 'keyword' || mode === 'hybrid') {
        const keywordScores: { score: number; metadata: any }[] = [];
        this.tfidf.tfidfs(query, (i: number, measure: number) => {
          const doc = this.tfidf.documents[i];
          if (doc && doc.__key && doc.__key.indexName === indexName) {
            keywordScores.push({ score: measure, metadata: doc.__key });
          }
        });
        
        const topKeywordScores = keywordScores
          .sort((a, b) => b.score - a.score)
          .slice(0, k);

        // Get the actual chunks
        for (const result of topKeywordScores) {
          const doc = index.documents.find(d => d.id === result.metadata.documentId);
          if (doc) {
            const chunk = doc.chunks.find(c => c.id === result.metadata.chunkId);
            if (chunk) {
              keywordResults.push({
                text: chunk.text,
                score: result.score,
                document_name: doc.filename,
                metadata: { ...chunk.metadata, search_type: 'keyword' }
              });
            }
          }
        }
      }

      // Vector search using embeddings
      if ((mode === 'vector' || mode === 'hybrid') && this.embedder) {
        try {
          // Generate embedding for query
          await this.ensureEmbeddingModel();
          const queryEmbeddingResult = await this.embedder(query, { pooling: 'mean', normalize: true });
          const queryEmbedding = Array.from(queryEmbeddingResult.data) as number[];

          const similarities: any[] = [];
          
          // Calculate similarity with all chunks
          for (const doc of index.documents) {
            for (const chunk of doc.chunks) {
              if (chunk.embedding) {
                const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
                if (similarity > 0) {
                  similarities.push({
                    text: chunk.text,
                    score: similarity,
                    document_name: doc.filename,
                    metadata: { ...chunk.metadata, search_type: 'vector' }
                  });
                }
              }
            }
          }
          
          // Sort by similarity and take top k
          vectorResults = similarities
            .sort((a, b) => b.score - a.score)
            .slice(0, k);
        } catch (error) {
          console.error('Error in vector search:', error);
          // Fall back to keyword-only if vector search fails
        }
      }

      // Combine results for hybrid search
      let finalResults: any[] = [];
      
      if (mode === 'hybrid') {
        // Merge and deduplicate results, favoring higher scores
        const resultMap = new Map<string, any>();
        
        // Add keyword results with weight
        keywordResults.forEach(r => {
          const key = r.text.substring(0, 100); // Use text prefix as key
          if (!resultMap.has(key) || resultMap.get(key).score < r.score * 0.7) {
            resultMap.set(key, { ...r, score: r.score * 0.7 });
          }
        });
        
        // Add vector results with higher weight
        vectorResults.forEach(r => {
          const key = r.text.substring(0, 100);
          if (!resultMap.has(key) || resultMap.get(key).score < r.score) {
            resultMap.set(key, r);
          }
        });
        
        finalResults = Array.from(resultMap.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, k);
      } else if (mode === 'vector') {
        finalResults = vectorResults;
      } else {
        finalResults = keywordResults;
      }

      return {
        success: true,
        query,
        mode,
        results: finalResults,
        total_results: finalResults.length
      };
    } catch (error) {
      console.error('Error querying index:', error);
      return { success: false, error: String(error) };
    }
  }

  async getDocuments(indexName: string) {
    const index = this.indexes.get(indexName);
    if (!index) return null;
    
    return index.documents.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      chunks: doc.chunks.length,
      metadata: doc.metadata
    }));
  }

  async deleteDocument(indexName: string, documentId: string) {
    const index = this.indexes.get(indexName);
    if (!index) {
      return { success: false, error: 'Index not found' };
    }

    const docIndex = index.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) {
      return { success: false, error: 'Document not found' };
    }

    const document = index.documents[docIndex];
    
    // Update stats
    index.stats.total_documents--;
    index.stats.total_chunks -= document.chunks.length;
    index.stats.total_size -= document.metadata.size || 0;
    
    // Remove document
    index.documents.splice(docIndex, 1);
    
    await this.saveIndexes();

    return { success: true, message: 'Document deleted successfully' };
  }
}

export interface IStorage {
  // Existing methods can be added here if needed
}
