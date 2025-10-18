# RAG Query Parameters - Complete Flow Diagram

## User Interface Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYGROUND UI                                 │
│                                                                  │
│  Configuration Panel                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Document Indexes: [✓ research] [✓ docs]               │    │
│  │                                                         │    │
│  │ ─────────── SEARCH CONFIGURATION ──────────────        │    │
│  │                                                         │    │
│  │ Search Mode: [Hybrid ▼]                   ← User sets  │    │
│  │   ├─ Hybrid (Semantic + Keywords)                      │    │
│  │   ├─ Vector (Semantic Only)                            │    │
│  │   └─ Keyword (Exact Match)                             │    │
│  │                                                         │    │
│  │ Chunk Count: 5        ← User sets                      │    │
│  │ ├────────●─────────────┤                               │    │
│  │ 1                    10                                 │    │
│  │                                                         │    │
│  │ Min Relevance: 70%    ← User sets                      │    │
│  │ ├─────────────●────────┤                               │    │
│  │ 0%                  100%                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  User asks: "What is machine learning?"                         │
│  ↓                                                               │
└──────────────────────────────────────────────────────────────────┘

                              ↓ API Call

┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (ChatInterface.tsx)                    │
│                                                                  │
│  Build RAG Query:                                                │
│  {                                                               │
│    index_names: ["research", "docs"],     ✅ From UI            │
│    query: "What is machine learning?",    ✅ User input          │
│    k: 5,                                  ✅ From slider         │
│    mode: "hybrid",                        ✅ From dropdown       │
│    min_score: 0.7                         ✅ From slider (70%)   │
│  }                                                               │
│                                                                  │
│  POST → http://localhost:5001/api/rag/query-multiple            │
│  ↓                                                               │
└──────────────────────────────────────────────────────────────────┘

                              ↓ HTTP Request

┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND API (rag_routes.py)                     │
│                                                                  │
│  @rag.route('/query-multiple', methods=['POST'])                │
│  def query_multiple_indexes():                                  │
│      data = request.get_json()                                  │
│                                                                  │
│      # Extract parameters                                       │
│      index_names = data.get('index_names')  ✅ ["research",..] │
│      query = data.get('query')              ✅ "What is..."     │
│      k = data.get('k', 5)                   ✅ 5                │
│      mode = data.get('mode', 'hybrid')      ✅ "hybrid"         │
│      min_score = data.get('min_score', 0.0) ✅ 0.7             │
│                                                                  │
│      # Call service with ALL parameters                         │
│      result = rag_service.query_multiple_indexes(               │
│          index_names=index_names,                               │
│          query=query,                                           │
│          k=k,                    ← Passed                       │
│          mode=mode,              ← Passed                       │
│          min_score=min_score     ← Passed ✅                    │
│      )                                                           │
│  ↓                                                               │
└──────────────────────────────────────────────────────────────────┘

                              ↓ Service Call

┌─────────────────────────────────────────────────────────────────┐
│              BACKEND SERVICE (rag_service.py)                    │
│                                                                  │
│  query_multiple_indexes(index_names, query, k, mode, min_score) │
│                                                                  │
│  For each index in ["research", "docs"]:                        │
│    │                                                             │
│    ├─ Query "research" index:                                   │
│    │    result = self.query(                                    │
│    │        "research",                                          │
│    │        "What is machine learning?",                         │
│    │        k=5,                        ← Using param           │
│    │        mode="hybrid",              ← Using param           │
│    │        min_score=0.7               ← Using param ✅        │
│    │    )                                                        │
│    │    ↓                                                        │
│    │    vector_store.search(                                    │
│    │        query,                                               │
│    │        k=5,                                                 │
│    │        mode="hybrid",                                       │
│    │        min_score=0.7  ← Applied to search ✅               │
│    │    )                                                        │
│    │    → Returns: [chunk1(0.89), chunk2(0.76), chunk3(0.71)]  │
│    │       All chunks have score >= 0.7 ✅                      │
│    │                                                             │
│    └─ Query "docs" index:                                       │
│         Same process...                                          │
│         → Returns: [chunk4(0.82), chunk5(0.74)]                │
│                                                                  │
│  Merge & sort all results by score:                             │
│  [chunk1(0.89), chunk4(0.82), chunk2(0.76), chunk5(0.74),      │
│   chunk3(0.71)]                                                 │
│                                                                  │
│  Take top k=5 results → All 5 chunks                            │
│  ↓                                                               │
└──────────────────────────────────────────────────────────────────┘

                              ↓ Return Results

┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND RESPONSE                                │
│                                                                  │
│  {                                                               │
│    "success": true,                                             │
│    "query": "What is machine learning?",                        │
│    "index_names": ["research", "docs"],                         │
│    "mode": "hybrid",                                            │
│    "total_results": 5,                                          │
│    "results": [                                                 │
│      {                                                           │
│        "text": "Machine learning is...",                        │
│        "score": 0.89,              ✅ >= 0.7                    │
│        "document_name": "ai_guide.pdf",                         │
│        "index_name": "research"                                 │
│      },                                                          │
│      {                                                           │
│        "text": "ML algorithms learn...",                        │
│        "score": 0.82,              ✅ >= 0.7                    │
│        "document_name": "ml_intro.txt",                         │
│        "index_name": "docs"                                     │
│      },                                                          │
│      ... (3 more results, all with score >= 0.7)               │
│    ]                                                             │
│  }                                                               │
│  ↓                                                               │
└──────────────────────────────────────────────────────────────────┘

                              ↓ Process Response

┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND (ChatInterface.tsx)                    │
│                                                                  │
│  const relevantResults = ragResponse.results;                   │
│  // Backend already filtered, no need to filter again ✅        │
│                                                                  │
│  Build context from 5 chunks:                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Context:                                              │      │
│  │                                                        │      │
│  │ [1] ai_guide.pdf (89%): Machine learning is...       │      │
│  │ [2] ml_intro.txt (82%): ML algorithms learn...       │      │
│  │ [3] research.docx (76%): In supervised learning...   │      │
│  │ [4] basics.md (74%): Neural networks are...          │      │
│  │ [5] overview.pdf (71%): Deep learning extends...     │      │
│  │                                                        │      │
│  │ Q: What is machine learning?                          │      │
│  │                                                        │      │
│  │ A (cite [1], [2], [3], [4], [5]):                    │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  Send to LLM for generation                                     │
│  ↓                                                               │
└──────────────────────────────────────────────────────────────────┘

                              ↓ LLM Response

┌─────────────────────────────────────────────────────────────────┐
│                    FINAL ANSWER TO USER                          │
│                                                                  │
│  "Machine learning is a subset of artificial intelligence       │
│  that enables systems to learn and improve from experience      │
│  without being explicitly programmed [1]. ML algorithms learn   │
│  patterns from data and make predictions or decisions [2].      │
│  Techniques include supervised learning [3], neural networks    │
│  [4], and deep learning [5]."                                   │
│                                                                  │
│  ✅ High quality answer based on 5 relevant chunks              │
│  ✅ All chunks had score >= 70% (user's threshold)              │
│  ✅ Used hybrid search mode (user's choice)                     │
│  ✅ Retrieved exactly 5 chunks (user's setting)                 │
└──────────────────────────────────────────────────────────────────┘
```

## Parameter Flow Summary

```
┌────────────────┬──────────────┬─────────────┬──────────────────┐
│   Parameter    │  UI Value    │  API Value  │  Backend Value   │
├────────────────┼──────────────┼─────────────┼──────────────────┤
│ Search Mode    │ "Hybrid"     │ "hybrid"    │ mode="hybrid"    │
├────────────────┼──────────────┼─────────────┼──────────────────┤
│ Chunk Count    │ Slider: 5    │ k=5         │ k=5              │
├────────────────┼──────────────┼─────────────┼──────────────────┤
│ Min Score      │ Slider: 70%  │ min_score   │ min_score=0.7    │
│                │ (0.7)        │ =0.7 ✅     │ ✅ USED          │
└────────────────┴──────────────┴─────────────┴──────────────────┘
```

## Before vs After Fix

### BEFORE (Broken ❌)

```
UI: min_score = 0.7
  ↓
API: { k: 5, mode: "hybrid" }  ← min_score missing ❌
  ↓
Backend: Uses self.min_relevance_score = 0.3  ← Wrong value ❌
  ↓
Returns: Chunks with score >= 0.3
  → chunk1(0.89), chunk2(0.76), chunk3(0.45), chunk4(0.38), chunk5(0.32)
     ❌ Includes low-quality chunks (0.45, 0.38, 0.32)
```

### AFTER (Fixed ✅)

```
UI: min_score = 0.7
  ↓
API: { k: 5, mode: "hybrid", min_score: 0.7 }  ← All params ✅
  ↓
Backend: Uses min_score = 0.7  ← Correct value ✅
  ↓
Returns: Chunks with score >= 0.7
  → chunk1(0.89), chunk2(0.82), chunk3(0.76), chunk4(0.74), chunk5(0.71)
     ✅ Only high-quality chunks (all >= 0.7)
```

## Network Request Example

### Request (View in Browser DevTools)

```http
POST /api/rag/query-multiple HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "index_names": ["research", "docs"],
  "query": "What is machine learning?",
  "k": 5,                    ✅ Present
  "mode": "hybrid",          ✅ Present
  "min_score": 0.7           ✅ Present (NEW!)
}
```

### Response

```json
{
  "success": true,
  "query": "What is machine learning?",
  "results": [
    {"score": 0.89, "text": "..."},
    {"score": 0.82, "text": "..."},
    {"score": 0.76, "text": "..."},
    {"score": 0.74, "text": "..."},
    {"score": 0.71, "text": "..."}
  ],
  "total_results": 5,
  "mode": "hybrid"
}
```

**Note**: All results have `score >= 0.7` ✅

---

**Diagram Version**: 1.0
**Last Updated**: October 18, 2025
