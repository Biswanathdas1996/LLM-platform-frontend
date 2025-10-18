# RAG API Quick Reference

## Base URL
```
http://localhost:5001/api/rag
```

## Endpoints

### 📚 Index Management

#### Create Index
```http
POST /api/rag/indexes
Content-Type: application/json

{
    "index_name": "my_documents"
}
```

#### List Indexes
```http
GET /api/rag/indexes
```

#### Get Index Info
```http
GET /api/rag/indexes/my_documents
```

#### Delete Index
```http
DELETE /api/rag/indexes/my_documents
```

---

### 📄 Document Management

#### List All Documents
```http
GET /api/rag/indexes/my_documents/documents
```

**Response:**
```json
{
    "success": true,
    "total_documents": 3,
    "documents": [
        {
            "id": "abc123",
            "filename": "doc.pdf",
            "size": 15234,
            "chunks": 12,
            "uploaded_at": "2025-10-18T10:30:00",
            "metadata": {"category": "tech"}
        }
    ]
}
```

#### Get Document Details
```http
GET /api/rag/indexes/my_documents/documents/abc123
```

**Response includes:**
- Document metadata
- All chunks with keywords
- Word counts
- Text previews

#### Delete Document
```http
DELETE /api/rag/indexes/my_documents/documents/abc123
```

---

### 📤 Upload Documents

```http
POST /api/rag/upload
Content-Type: multipart/form-data

index_name: my_documents
files: [file1.pdf, file2.txt]
metadata: {"category": "technical", "author": "John"}
```

**Supported formats:**
- PDF, DOCX, DOC, PPTX
- TXT, MD, HTML
- CSV, JSON

---

### 🔍 Query Documents

```http
POST /api/rag/query
Content-Type: application/json

{
    "index_name": "my_documents",
    "query": "What is machine learning?",
    "k": 5,
    "mode": "hybrid"
}
```

**Search modes:**
- `vector` - Semantic similarity
- `keyword` - Exact keyword matching
- `hybrid` - Best of both (recommended)

**Response:**
```json
{
    "success": true,
    "query": "What is machine learning?",
    "results": [
        {
            "text": "Machine learning is...",
            "score": 0.92,
            "document_name": "ml_guide.pdf",
            "chunk_id": 3,
            "keywords": ["machine", "learning", "algorithm"],
            "metadata": {}
        }
    ],
    "mode": "hybrid"
}
```

---

## curl Examples

### Upload Document
```bash
curl -X POST http://localhost:5001/api/rag/upload \
  -F "index_name=docs" \
  -F "files=@document.pdf" \
  -F 'metadata={"category":"tech"}'
```

### Query
```bash
curl -X POST http://localhost:5001/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "index_name": "docs",
    "query": "machine learning",
    "k": 5,
    "mode": "hybrid"
  }'
```

### List Documents
```bash
curl http://localhost:5001/api/rag/indexes/docs/documents
```

### Delete Document
```bash
curl -X DELETE http://localhost:5001/api/rag/indexes/docs/documents/abc123
```

---

## Python Examples

```python
import requests
import json

BASE_URL = "http://localhost:5001/api/rag"

# Create index
requests.post(f"{BASE_URL}/indexes", json={"index_name": "docs"})

# Upload document
files = {'files': open('doc.pdf', 'rb')}
data = {
    'index_name': 'docs',
    'metadata': json.dumps({'category': 'tech'})
}
requests.post(f"{BASE_URL}/upload", files=files, data=data)

# Query
response = requests.post(f"{BASE_URL}/query", json={
    'index_name': 'docs',
    'query': 'What is AI?',
    'k': 5,
    'mode': 'hybrid'
})
print(response.json())

# List documents
docs = requests.get(f"{BASE_URL}/indexes/docs/documents")
print(docs.json())
```

---

## Key Features

✅ **Automatic keyword extraction** - Each chunk gets top keywords  
✅ **Smaller chunks (256 words)** - Better retrieval precision  
✅ **Multiple search modes** - Vector, keyword, or hybrid  
✅ **Document management** - List, view, delete documents  
✅ **Rich metadata** - Store custom metadata with documents  
✅ **Docling integration** - High-quality PDF/DOCX extraction  

---

## Tips

1. **Use hybrid mode** for best search results
2. **Add metadata** when uploading for better organization
3. **Check keywords** in document details for quality
4. **Monitor index stats** to track usage
5. **Clean up old docs** using delete endpoint
