import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mammoth from 'mammoth';
import natural from 'natural';

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

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.tfidf = new natural.TfIdf();
    this.initialize();
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
      
      // Chunk the text
      const chunks = this.chunkText(text);
      
      // Create document
      const document: Document = {
        id: crypto.randomBytes(16).toString('hex'),
        filename,
        chunks: chunks.map((chunkText, i) => ({
          id: `${crypto.randomBytes(8).toString('hex')}`,
          text: chunkText,
          metadata: {
            chunkIndex: i,
            documentId: '',
            ...metadata
          }
        })),
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
          documentId: document.id,
          chunkId: chunk.id,
          indexName
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
          const pdfParse = pdfParseModule.default || pdfParseModule;
          const pdfData = await pdfParse(buffer);
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

  chunkText(text: string, chunkSize: number = 512, overlap: number = 128): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }
    
    return chunks;
  }

  async query(indexName: string, query: string, k: number = 5, mode: 'vector' | 'keyword' | 'hybrid' = 'hybrid') {
    const index = this.indexes.get(indexName);
    if (!index) {
      return { success: false, error: 'Index not found' };
    }

    try {
      let results: any[] = [];

      if (mode === 'keyword' || mode === 'hybrid') {
        // Keyword search using TF-IDF
        const keywordResults = this.tfidf.tfidfs(query);
        const topKeywordResults = keywordResults
          .map((score: number, idx: number) => {
            const doc = this.tfidf.documents[idx];
            if (doc && doc.__key && doc.__key.indexName === indexName) {
              return { score, metadata: doc.__key };
            }
            return null;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, k);

        // Get the actual chunks
        for (const result of topKeywordResults) {
          const doc = index.documents.find(d => d.id === result.metadata.documentId);
          if (doc) {
            const chunk = doc.chunks.find(c => c.id === result.metadata.chunkId);
            if (chunk) {
              results.push({
                text: chunk.text,
                score: result.score,
                document_name: doc.filename,
                metadata: chunk.metadata
              });
            }
          }
        }
      }

      if (mode === 'vector' || (mode === 'hybrid' && results.length < k)) {
        // For now, we'll use a simple similarity based on word overlap
        // In production, you'd use proper embeddings
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        
        const vectorResults: any[] = [];
        for (const doc of index.documents) {
          for (const chunk of doc.chunks) {
            const chunkWords = new Set(chunk.text.toLowerCase().split(/\s+/));
            const overlap = [...queryWords].filter(word => chunkWords.has(word)).length;
            const score = overlap / Math.max(queryWords.size, chunkWords.size);
            
            if (score > 0) {
              vectorResults.push({
                text: chunk.text,
                score,
                document_name: doc.filename,
                metadata: chunk.metadata
              });
            }
          }
        }
        
        // Sort by score and take top k
        vectorResults.sort((a, b) => b.score - a.score);
        
        if (mode === 'vector') {
          results = vectorResults.slice(0, k);
        } else {
          // Hybrid - merge results
          const seen = new Set(results.map(r => r.text));
          for (const vr of vectorResults) {
            if (!seen.has(vr.text) && results.length < k) {
              results.push(vr);
            }
          }
        }
      }

      return {
        success: true,
        query,
        mode,
        results: results.slice(0, k),
        total_results: results.slice(0, k).length
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