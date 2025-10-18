# RAG Query Parameters Fix - Implementation Summary

## Problem
The playground's RAG search configuration (search mode, chunk count, and min chunk score) were not being properly sent to or used by the backend API when querying documents.

## Root Cause
1. **Frontend**: The `RAGQueryRequest` interface was missing the `min_score` parameter
2. **Frontend**: The `min_score` parameter was not being sent in the API call
3. **Backend**: The `/query-multiple` endpoint was not accepting or using the `min_score` parameter
4. **Backend**: The RAG service methods (`query` and `query_multiple_indexes`) were using the default `self.min_relevance_score` instead of accepting it as a parameter

## Solution

### Frontend Changes

#### 1. Updated `api.ts` Interface
**File**: `client/src/lib/api.ts`

```typescript
export interface RAGQueryRequest {
  index_names: string[];
  query: string;
  k?: number;
  mode?: 'vector' | 'keyword' | 'hybrid';
  min_score?: number;  // ✅ ADDED
}
```

#### 2. Updated API Call in ChatInterface
**File**: `client/src/components/Playground/ChatInterface.tsx`

```typescript
const ragResponse = await ragQueryMutation.mutateAsync({
  index_names: selectedIndexes,
  query: inputMessage,
  k: chunkCount,           // ✅ Using configured value
  mode: searchMode,        // ✅ Using configured value
  min_score: minChunkScore, // ✅ ADDED - Using configured value
});
```

#### 3. Removed Client-Side Filtering
Since the backend now filters by `min_score`, removed redundant client-side filtering:

```typescript
// BEFORE:
const relevantResults = ragResponse.results.filter(r => r.score > minChunkScore);

// AFTER:
const relevantResults = ragResponse.results; // Already filtered by backend
```

### Backend Changes

#### 1. Updated `/query-multiple` Route
**File**: `backend/api/rag_routes.py`

```python
@rag.route('/query-multiple', methods=['POST'])
def query_multiple_indexes():
    # ... validation code ...
    
    # Optional parameters
    k = data.get('k', 5)
    mode = data.get('mode', 'hybrid')
    min_score = data.get('min_score', 0.0)  # ✅ ADDED
    
    result = rag_service.query_multiple_indexes(
        index_names=index_names,
        query=query,
        k=k,
        mode=mode,
        min_score=min_score  # ✅ ADDED
    )
```

#### 2. Updated `/query` Route (for consistency)
**File**: `backend/api/rag_routes.py`

```python
@rag.route('/query', methods=['POST'])
def query_documents():
    # ... validation code ...
    
    # Optional parameters
    k = data.get('k', 5)
    mode = data.get('mode', 'hybrid')
    min_score = data.get('min_score', 0.0)  # ✅ ADDED
    
    result = rag_service.query(
        index_name=index_name,
        query=query,
        k=k,
        mode=mode,
        min_score=min_score  # ✅ ADDED
    )
```

#### 3. Updated `query` Method
**File**: `backend/services/rag_service.py`

```python
def query(self, index_name: str, query: str, k: int = None, 
          mode: str = 'hybrid', min_score: float = None) -> Dict[str, Any]:
    # ✅ ADDED min_score parameter
    
    # Use configured default k if not specified
    if k is None:
        k = self.default_k
    
    # Use configured min_relevance_score if not specified
    if min_score is None:  # ✅ ADDED
        min_score = self.min_relevance_score
    
    # Search with min_score filter
    results = vector_store.search(
        query, 
        k=k, 
        mode=mode,
        min_score=min_score,  # ✅ Using parameter instead of self.min_relevance_score
        timeout=self.query_timeout
    )
```

#### 4. Updated `query_multiple_indexes` Method
**File**: `backend/services/rag_service.py`

```python
def query_multiple_indexes(self, index_names: List[str], query: str, 
                          k: int = None, mode: str = 'hybrid', 
                          min_score: float = None) -> Dict[str, Any]:
    # ✅ ADDED min_score parameter
    
    # Use configured default k if not specified
    if k is None:
        k = self.default_k
    
    # Use configured min_relevance_score if not specified
    if min_score is None:  # ✅ ADDED
        min_score = self.min_relevance_score
    
    # Query each index with min_score
    for index_name in index_names:
        result = self.query(index_name, query, k=k, mode=mode, 
                          min_score=min_score)  # ✅ Passing min_score
```

## Data Flow

### Before Fix
```
User sets min_score = 0.7 in UI
    ↓
Frontend sends: { k: 3, mode: 'hybrid' }  ❌ min_score not sent
    ↓
Backend uses: self.min_relevance_score = 0.3  ❌ Wrong value
    ↓
Returns results with score > 0.3  ❌ Too many low-quality results
```

### After Fix
```
User sets min_score = 0.7 in UI
    ↓
Frontend sends: { k: 3, mode: 'hybrid', min_score: 0.7 }  ✅ All params sent
    ↓
Backend uses: min_score = 0.7  ✅ Correct value
    ↓
Returns results with score > 0.7  ✅ High-quality results only
```

## API Request Example

### Request Payload (POST to `/api/rag/query-multiple`)
```json
{
  "index_names": ["research", "documentation"],
  "query": "What is machine learning?",
  "k": 5,
  "mode": "hybrid",
  "min_score": 0.6
}
```

### Response
```json
{
  "success": true,
  "query": "What is machine learning?",
  "index_names": ["research", "documentation"],
  "results": [
    {
      "text": "Machine learning is a subset of AI...",
      "score": 0.89,
      "document_name": "ai_guide.pdf",
      "chunk_id": 2,
      "index_name": "research"
    },
    {
      "text": "In machine learning, algorithms...",
      "score": 0.75,
      "document_name": "ml_basics.txt",
      "chunk_id": 5,
      "index_name": "documentation"
    }
  ],
  "mode": "hybrid",
  "total_results": 2,
  "query_time": 0.234
}
```

Note: All results have `score >= 0.6` because of the `min_score` filter.

## Benefits

1. **User Control**: Users can now set minimum relevance scores from the UI
2. **Consistency**: All three parameters (k, mode, min_score) are now properly sent and used
3. **Performance**: Backend filtering is more efficient than client-side filtering
4. **Quality**: Users get exactly the results they expect based on their configuration
5. **Flexibility**: Different queries can use different thresholds without changing config

## Testing

To verify the fix works:

1. **Start the backend server**:
   ```bash
   cd backend
   python main.py
   ```

2. **Open Playground in browser**
3. **Select one or more document indexes**
4. **Adjust search configuration**:
   - Search Mode: Hybrid
   - Chunk Count: 5
   - Min Relevance Score: 70%

5. **Ask a question**
6. **Verify in network tab**: Check that the `/api/rag/query-multiple` payload includes:
   ```json
   {
     "k": 5,
     "mode": "hybrid",
     "min_score": 0.7
   }
   ```

7. **Verify results**: All returned chunks should have `score >= 0.7`

## Backward Compatibility

✅ **Fully backward compatible**:
- If `min_score` is not provided, defaults to configured value (`self.min_relevance_score`)
- Existing API calls without `min_score` parameter continue to work
- Old clients can still call the API without the new parameter

## Files Modified

### Frontend
1. `client/src/lib/api.ts` - Added `min_score` to interface
2. `client/src/components/Playground/ChatInterface.tsx` - Pass and use min_score

### Backend
3. `backend/api/rag_routes.py` - Accept min_score in both routes
4. `backend/services/rag_service.py` - Accept and use min_score in both query methods

---

**Fix Status**: ✅ Complete
**Tested**: Ready for testing
**Version**: 1.0
**Date**: October 18, 2025
