import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { RAGStorage } from './storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const indexName = req.body.index_name || 'default';
    const indexDir = path.join(uploadDir, indexName);
    await fs.mkdir(indexDir, { recursive: true }).catch(console.error);
    cb(null, indexDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit (effectively unlimited for most use cases)
  }
});

// Initialize RAG Storage
const ragStorage = new RAGStorage(path.join(__dirname, '../rag_data'));

export function registerRoutes(app: Express) {
  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'LLM Platform API' });
  });

  // RAG Routes
  
  // List all indexes
  app.get('/api/rag/indexes', async (req: Request, res: Response) => {
    try {
      const indexes = await ragStorage.listIndexes();
      res.json({ indexes });
    } catch (error) {
      console.error('Error listing indexes:', error);
      res.status(500).json({ error: 'Failed to list indexes' });
    }
  });

  // Create new index
  app.post('/api/rag/indexes', async (req: Request, res: Response) => {
    try {
      const { index_name, description } = req.body;
      
      if (!index_name) {
        return res.status(400).json({ error: 'index_name is required' });
      }

      const result = await ragStorage.createIndex(index_name, description);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating index:', error);
      res.status(500).json({ error: 'Failed to create index' });
    }
  });

  // Get index info
  app.get('/api/rag/indexes/:indexName', async (req: Request, res: Response) => {
    try {
      const { indexName } = req.params;
      const info = await ragStorage.getIndexInfo(indexName);
      
      if (!info) {
        return res.status(404).json({ error: 'Index not found' });
      }

      res.json(info);
    } catch (error) {
      console.error('Error getting index info:', error);
      res.status(500).json({ error: 'Failed to get index info' });
    }
  });

  // Delete index
  app.delete('/api/rag/indexes/:indexName', async (req: Request, res: Response) => {
    try {
      const { indexName } = req.params;
      const result = await ragStorage.deleteIndex(indexName);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Error deleting index:', error);
      res.status(500).json({ error: 'Failed to delete index' });
    }
  });

  // Upload documents
  app.post('/api/rag/upload', upload.array('files', 50), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { index_name } = req.body;
      
      if (!index_name) {
        return res.status(400).json({ error: 'index_name is required' });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const results: any[] = [];
      const errors: any[] = [];

      for (const file of files) {
        try {
          const result = await ragStorage.addDocument(
            index_name,
            file.path,
            file.originalname,
            {
              size: file.size,
              mimetype: file.mimetype
            }
          );

          if (result.success) {
            results.push({
              filename: file.originalname,
              document_id: result.document_id,
              chunks: result.chunks,
              size: file.size
            });
          } else {
            errors.push({
              filename: file.originalname,
              error: result.error
            });
          }

          // Clean up uploaded file after processing
          await fs.unlink(file.path).catch(console.error);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: String(error)
          });
        }
      }

      res.json({
        success: results.length > 0,
        processed: results,
        errors,
        total_processed: results.length,
        total_errors: errors.length
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({ error: 'Failed to upload documents' });
    }
  });

  // Query documents
  app.post('/api/rag/query', async (req: Request, res: Response) => {
    try {
      const { index_name, query, k = 5, mode = 'hybrid' } = req.body;

      if (!index_name || !query) {
        return res.status(400).json({ error: 'index_name and query are required' });
      }

      const result = await ragStorage.query(index_name, query, k, mode);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Error querying documents:', error);
      res.status(500).json({ error: 'Failed to query documents' });
    }
  });

  // Get documents in index
  app.get('/api/rag/indexes/:indexName/documents', async (req: Request, res: Response) => {
    try {
      const { indexName } = req.params;
      const documents = await ragStorage.getDocuments(indexName);
      
      if (!documents) {
        return res.status(404).json({ error: 'Index not found' });
      }

      res.json({ documents });
    } catch (error) {
      console.error('Error getting documents:', error);
      res.status(500).json({ error: 'Failed to get documents' });
    }
  });

  // Delete document
  app.delete('/api/rag/indexes/:indexName/documents/:documentId', async (req: Request, res: Response) => {
    try {
      const { indexName, documentId } = req.params;
      const result = await ragStorage.deleteDocument(indexName, documentId);
      
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });
}