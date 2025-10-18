# RAG Performance Quick Reference

## 🚀 Quick Fixes for Slow RAG

### Immediate Actions (No Code Changes)

1. **Reduce number of results**:
   ```bash
   # In your API call, use k=2 or k=3 instead of k=5
   ```

2. **Set environment variables**:
   ```bash
   export RAG_DEFAULT_K=2
   export RAG_CHUNK_SIZE=120
   export RAG_MAX_CONTEXT_LENGTH=1500
   export RAG_QUERY_TIMEOUT=3
   ```

3. **Use keyword mode for faster searches**:
   ```python
   # mode='keyword' is fastest
   # mode='hybrid' is balanced (default)
   # mode='vector' is most accurate
   ```

## 📊 Performance Settings Comparison

| Setting | Fast⚡ | Balanced⚖️ | Accurate🎯 |
|---------|-------|-----------|----------|
| RAG_CHUNK_SIZE | 120 | 150 | 200 |
| RAG_DEFAULT_K | 2 | 3 | 5 |
| RAG_QUERY_TIMEOUT | 3s | 5s | 10s |
| RAG_MAX_CONTEXT_LENGTH | 1000 | 2000 | 3000 |
| RAG_MIN_RELEVANCE_SCORE | 0.4 | 0.3 | 0.2 |

## 🔍 Troubleshooting Decision Tree

```
Query slow or timing out?
├─ Check query_time in response
│  ├─ > 2 seconds?
│  │  ├─ Reduce RAG_DEFAULT_K to 2
│  │  ├─ Use mode='keyword'
│  │  └─ Split large indexes
│  └─ < 0.5 seconds?
│     └─ RAG is fine, LLM is slow
│        ├─ Reduce RAG_MAX_CONTEXT_LENGTH
│        └─ Use smaller/faster model
└─ No results returned?
   ├─ Check timeout (increase RAG_QUERY_TIMEOUT)
   ├─ Lower RAG_MIN_RELEVANCE_SCORE
   └─ Try mode='keyword'
```

## 🎯 Optimal Settings by Use Case

### Chat Applications (Speed Priority)
```bash
export RAG_DEFAULT_K=2
export RAG_CHUNK_SIZE=120
export RAG_QUERY_TIMEOUT=3
export RAG_MAX_CONTEXT_LENGTH=1500
export RAG_MIN_RELEVANCE_SCORE=0.35
```

### Research/Analysis (Accuracy Priority)
```bash
export RAG_DEFAULT_K=5
export RAG_CHUNK_SIZE=200
export RAG_QUERY_TIMEOUT=10
export RAG_MAX_CONTEXT_LENGTH=3000
export RAG_MIN_RELEVANCE_SCORE=0.25
```

### Production API (Balanced)
```bash
export RAG_DEFAULT_K=3
export RAG_CHUNK_SIZE=150
export RAG_QUERY_TIMEOUT=5
export RAG_MAX_CONTEXT_LENGTH=2000
export RAG_MIN_RELEVANCE_SCORE=0.3
export RAG_ENABLE_CACHING=True
export RAG_CACHE_SIZE=100
```

## 💡 Pro Tips

1. **Cache is your friend**: Identical queries return in <5ms
2. **Start small**: Begin with k=2, increase if needed
3. **Monitor query_time**: Should be <500ms
4. **Context length matters**: Less context = faster LLM responses
5. **Index design**: Create topic-specific indexes, not one giant index

## 📈 Expected Performance

| Document Size | Query Time | Total Response |
|---------------|------------|----------------|
| Small (1-5 pages) | 100-300ms | 1-2s |
| Medium (10-50 pages) | 300-800ms | 2-4s |
| Large (100+ pages) | 800ms-1.5s | 4-8s |
| Cached query | <5ms | 0.5-2s |

## ⚠️ Common Mistakes

1. ❌ Using k=10 (too many results)
   ✅ Use k=2-3 for fast responses

2. ❌ Querying all indexes at once
   ✅ Query specific relevant indexes

3. ❌ No timeout set
   ✅ Always set RAG_QUERY_TIMEOUT

4. ❌ Sending full chunks to LLM
   ✅ Truncate to first 300 chars (already done in frontend)

5. ❌ Disabling cache in production
   ✅ Keep RAG_ENABLE_CACHING=True

## 🔧 Quick Commands

### Check Current Settings
```bash
# In Python
from backend.config import Config
config = Config()
print(f"Chunk size: {config.RAG_CHUNK_SIZE}")
print(f"Default k: {config.RAG_DEFAULT_K}")
print(f"Timeout: {config.RAG_QUERY_TIMEOUT}s")
```

### Test Query Performance
```python
import time
start = time.time()
result = rag_service.query('my_index', 'test query', k=3)
print(f"Query time: {time.time() - start:.3f}s")
print(f"Results: {len(result['results'])}")
print(f"Context length: {result.get('context_length', 0)}")
```

### Monitor Cache Hit Rate
```python
# Check cache effectiveness
vector_store = rag_service.indexes['my_index']['vector_store']
cache_size = len(vector_store._query_cache)
print(f"Cached queries: {cache_size}")
```

## 📚 Further Reading

- Full documentation: `backend/RAG_PERFORMANCE_OPTIMIZATION.md`
- RAG API Reference: `backend/RAG_API_REFERENCE.md`
- Configuration: `backend/config.py`
