import { Express, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { RAGStorage, DatasetStorage } from './storage';
import * as XLSX from 'xlsx';
import { pipeline } from '@xenova/transformers';

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

// Initialize Dataset Storage
const datasetStorage = new DatasetStorage();

// Separate upload configuration for datasets (CSV/Excel)
const datasetUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

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

  // Analytics/Dataset Routes

  // Upload CSV/Excel dataset
  app.post('/api/analytics/upload', datasetUpload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse the file based on type
      let workbook: XLSX.WorkBook;
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (ext === '.csv') {
        const csvText = file.buffer.toString('utf-8');
        workbook = XLSX.read(csvText, { type: 'string' });
      } else {
        workbook = XLSX.read(file.buffer, { type: 'buffer' });
      }

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to get data
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (jsonData.length === 0) {
        return res.status(400).json({ error: 'File is empty' });
      }

      // Extract headers and data
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1);
      
      // Create dataset metadata
      const dataset = await datasetStorage.create({
        name: file.originalname.replace(/\.[^/.]+$/, ''),
        filename: file.originalname,
        size: file.size,
        rows: rows.length,
        columns: headers.length,
        columnNames: headers,
      });

      // Store the actual data
      await datasetStorage.storeData(dataset.id, rows);

      res.json({
        success: true,
        dataset,
        preview: rows.slice(0, 5), // First 5 rows as preview
      });
    } catch (error) {
      console.error('Error uploading dataset:', error);
      res.status(500).json({ error: 'Failed to upload dataset: ' + String(error) });
    }
  });

  // List all datasets
  app.get('/api/analytics/datasets', async (req: Request, res: Response) => {
    try {
      const datasets = await datasetStorage.getAll();
      res.json({ datasets });
    } catch (error) {
      console.error('Error listing datasets:', error);
      res.status(500).json({ error: 'Failed to list datasets' });
    }
  });

  // Get dataset with data and analysis
  app.get('/api/analytics/datasets/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const dataset = await datasetStorage.getById(id);
      
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const data = await datasetStorage.getData(id);
      
      if (!data) {
        return res.status(404).json({ error: 'Dataset data not found' });
      }

      // Calculate basic statistics
      const statistics = calculateStatistics(dataset.columnNames, data);

      res.json({
        dataset,
        data: {
          headers: dataset.columnNames,
          rows: data,
          rowCount: dataset.rows,
          columnCount: dataset.columns,
        },
        statistics,
      });
    } catch (error) {
      console.error('Error getting dataset:', error);
      res.status(500).json({ error: 'Failed to get dataset' });
    }
  });

  // Generate insights for a dataset using local LLM
  app.post('/api/analytics/datasets/:id/insights', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const dataset = await datasetStorage.getById(id);
      
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      const data = await datasetStorage.getData(id);
      
      if (!data) {
        return res.status(404).json({ error: 'Dataset data not found' });
      }

      // Generate insights
      const insights = await generateInsights(dataset, data);

      res.json({ insights });
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({ error: 'Failed to generate insights' });
    }
  });

  // Delete dataset
  app.delete('/api/analytics/datasets/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await datasetStorage.delete(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      res.json({ success: true, message: 'Dataset deleted successfully' });
    } catch (error) {
      console.error('Error deleting dataset:', error);
      res.status(500).json({ error: 'Failed to delete dataset' });
    }
  });
}

// Helper function to calculate statistics
function calculateStatistics(headers: string[], data: any[][]): Record<string, any> {
  const stats: Record<string, any> = {};

  headers.forEach((header, colIndex) => {
    const column = data.map(row => row[colIndex]).filter(val => val !== null && val !== undefined && val !== '');
    
    // Check if column is numeric
    const numericValues = column.map(v => {
      const num = typeof v === 'number' ? v : parseFloat(String(v));
      return isNaN(num) ? null : num;
    }).filter(v => v !== null) as number[];

    if (numericValues.length > 0) {
      // Numeric statistics
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const mean = sum / numericValues.length;
      const sorted = [...numericValues].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
      const stdDev = Math.sqrt(variance);

      stats[header] = {
        type: 'numeric',
        count: numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        sum: parseFloat(sum.toFixed(2)),
      };
    } else {
      // Categorical statistics
      const valueCounts: Record<string, number> = {};
      column.forEach(val => {
        const key = String(val);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });

      const uniqueValues = Object.keys(valueCounts).length;
      const mode = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0];

      stats[header] = {
        type: 'categorical',
        count: column.length,
        unique: uniqueValues,
        mode: mode ? mode[0] : null,
        modeCount: mode ? mode[1] : 0,
        topValues: Object.entries(valueCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([value, count]) => ({ value, count })),
      };
    }
  });

  return stats;
}

// Helper function to generate AI insights
async function generateInsights(dataset: any, data: any[][]): Promise<any[]> {
  const insights: any[] = [];

  try {
    // Calculate statistics first
    const stats = calculateStatistics(dataset.columnNames, data);

    // Generate summary insight
    insights.push({
      type: 'summary',
      title: 'Dataset Overview',
      description: `This dataset contains ${dataset.rows} rows and ${dataset.columns} columns. The data includes ${
        Object.values(stats).filter((s: any) => s.type === 'numeric').length
      } numeric columns and ${
        Object.values(stats).filter((s: any) => s.type === 'categorical').length
      } categorical columns.`,
      confidence: 1.0,
    });

    // Find trends in numeric columns
    Object.entries(stats).forEach(([column, stat]: [string, any]) => {
      if (stat.type === 'numeric') {
        const range = stat.max - stat.min;
        const cv = stat.stdDev / stat.mean; // Coefficient of variation

        if (cv > 0.5) {
          insights.push({
            type: 'trend',
            title: `High Variability in ${column}`,
            description: `The ${column} column shows high variability with values ranging from ${stat.min} to ${stat.max}. The standard deviation is ${stat.stdDev}, indicating significant spread in the data.`,
            confidence: 0.85,
            data: { column, ...stat },
          });
        }

        // Detect potential outliers
        const outlierThreshold = stat.mean + (2 * stat.stdDev);
        if (stat.max > outlierThreshold || stat.min < stat.mean - (2 * stat.stdDev)) {
          insights.push({
            type: 'anomaly',
            title: `Potential Outliers in ${column}`,
            description: `The ${column} column may contain outliers. Values significantly deviate from the mean (${stat.mean}).`,
            confidence: 0.7,
            data: { column, mean: stat.mean, stdDev: stat.stdDev },
          });
        }
      }
    });

    // Generate correlation insights for numeric columns
    const numericColumns = Object.entries(stats)
      .filter(([_, stat]: [string, any]) => stat.type === 'numeric')
      .map(([col, _]) => col);

    if (numericColumns.length >= 2) {
      insights.push({
        type: 'correlation',
        title: 'Numeric Columns Analysis',
        description: `Found ${numericColumns.length} numeric columns that can be analyzed for correlations and patterns: ${numericColumns.join(', ')}.`,
        confidence: 0.8,
        data: { columns: numericColumns },
      });
    }

    // Simple prediction insight based on trends
    if (numericColumns.length > 0) {
      const firstNumCol = numericColumns[0];
      const colStat = stats[firstNumCol] as any;
      
      insights.push({
        type: 'prediction',
        title: `${firstNumCol} Trend Analysis`,
        description: `Based on the current data, ${firstNumCol} has an average value of ${colStat.mean}. Future values are likely to fall within the range of ${
          (colStat.mean - colStat.stdDev).toFixed(2)
        } to ${
          (colStat.mean + colStat.stdDev).toFixed(2)
        } (one standard deviation from mean).`,
        confidence: 0.65,
        data: {
          column: firstNumCol,
          predictedRange: [
            parseFloat((colStat.mean - colStat.stdDev).toFixed(2)),
            parseFloat((colStat.mean + colStat.stdDev).toFixed(2))
          ],
        },
      });
    }

  } catch (error) {
    console.error('Error generating insights:', error);
    insights.push({
      type: 'summary',
      title: 'Analysis Complete',
      description: 'Basic statistical analysis completed. Upload more data for deeper insights.',
      confidence: 0.5,
    });
  }

  return insights;
}