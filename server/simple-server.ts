import express from 'express';
import { registerRoutes } from './routes';
import cors from 'cors';

const PORT = process.env.PORT || 5001;
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
registerRoutes(app);

// Health check root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LLM Platform API Server', 
    status: 'running',
    endpoints: {
      health: '/api/health',
      indexes: '/api/rag/indexes',
      upload: '/api/rag/upload',
      query: '/api/rag/query'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});