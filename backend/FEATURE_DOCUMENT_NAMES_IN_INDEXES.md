# Document Names in Index Listing

## Overview
Enhanced the `list_indexes()` endpoint to include document names for each index, making it easier to see what documents have been uploaded to each index.

## What Changed

### Before
When calling `GET /api/rag/indexes`, you only got index statistics:
```json
{
  "indexes": [
    {
      "name": "medical",
      "created_at": "2025-01-15T10:30:00",
      "stats": {
        "total_documents": 2,
        "total_chunks": 15,
        "total_size": 1024
      }
    }
  ]
}
```

### After
Now you also get a list of document names in each index:
```json
{
  "indexes": [
    {
      "name": "medical",
      "created_at": "2025-01-15T10:30:00",
      "stats": {
        "total_documents": 2,
        "total_chunks": 15,
        "total_size": 1024
      },
      "documents": [
        "patient_records.txt",
        "treatment_guidelines.pdf"
      ]
    }
  ]
}
```

## API Endpoint

### List All Indexes with Document Names

**Endpoint:** `GET /api/rag/indexes`

**Response:**
```json
{
  "indexes": [
    {
      "name": "string",           // Index name
      "created_at": "string",     // ISO timestamp
      "stats": {
        "total_documents": 0,     // Number of documents
        "total_chunks": 0,        // Number of chunks
        "total_size": 0           // Total size in bytes
      },
      "documents": ["string"]     // 🆕 Array of document filenames
    }
  ]
}
```

## Usage Examples

### cURL
```bash
curl -X GET http://localhost:5001/api/rag/indexes
```

### Python
```python
import requests

response = requests.get('http://localhost:5001/api/rag/indexes')
data = response.json()

for index in data['indexes']:
    print(f"Index: {index['name']}")
    print(f"Documents:")
    for doc in index['documents']:
        print(f"  - {doc}")
```

### JavaScript/Frontend
```javascript
fetch('/api/rag/indexes')
  .then(res => res.json())
  .then(data => {
    data.indexes.forEach(index => {
      console.log(`Index: ${index.name}`);
      console.log('Documents:');
      index.documents.forEach(doc => {
        console.log(`  - ${doc}`);
      });
    });
  });
```

## Use Cases

1. **Dashboard Display**: Show which documents are in each index
2. **Document Management**: See all uploaded documents at a glance
3. **Index Comparison**: Compare document sets across indexes
4. **Quick Audit**: Verify which documents have been uploaded
5. **User Interface**: Populate dropdowns or lists with document names

## Implementation Details

### Code Changes
Modified `RAGService.list_indexes()` in `backend/services/rag_service.py`:

```python
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
```

### Performance Considerations
- **Minimal Overhead**: Only extracts filenames from existing document metadata
- **No Database Queries**: All data is already in memory
- **Scalable**: Works efficiently even with many documents per index

## Related Endpoints

For more detailed document information, use these endpoints:

1. **List Documents in Index** (with full metadata):
   ```
   GET /api/rag/indexes/{index_name}/documents
   ```

2. **Get Document Details**:
   ```
   GET /api/rag/indexes/{index_name}/documents/{document_id}
   ```

## Testing

Run the test suite to verify functionality:
```bash
cd backend
python test_list_indexes_with_docs.py
```

Expected output:
```
✅ ALL TESTS PASSED!

📋 Summary:
   - list_indexes() now includes document names
   - Each index shows which documents have been uploaded
   - Frontend can display document names for each index
```

## Benefits

✅ **Better User Experience**: Users can see what documents are in each index  
✅ **Quick Overview**: No need to make additional API calls  
✅ **Backward Compatible**: Existing code still works (new field is added)  
✅ **Frontend Friendly**: Easy to display in UI components  
✅ **No Breaking Changes**: API response is enhanced, not modified  

## Migration Notes

This is a **non-breaking change**. No migration needed:
- Existing API consumers will continue to work
- New `documents` field is added to response
- No database schema changes required
- Works with existing indexes

## Future Enhancements

Potential improvements:
1. Add document upload timestamps to the list
2. Include document size information
3. Add filtering/sorting options
4. Support pagination for large document lists
5. Add document metadata preview
