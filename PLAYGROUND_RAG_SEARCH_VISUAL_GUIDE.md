# Playground RAG Search Options - Visual Guide

## UI Layout

### Before Selecting Indexes
```
┌─────────────────────────────────────────────┐
│ 📊 Configuration                            │
├─────────────────────────────────────────────┤
│                                             │
│ Model                                       │
│ [Select a model...              ▼]         │
│                                             │
│ Temperature                     0.7         │
│ ├──────●──────────────┤                    │
│                                             │
│ Max Tokens (Optional)                       │
│ [Auto (model default)]                      │
│                                             │
│ GPU Layers                                  │
│ [40 (Very High GPU)            ▼]          │
│                                             │
│ Document Indexes (Optional)                 │
│ Select indexes to enhance responses         │
│ [Select indexes...             ▼]          │
│                                             │
└─────────────────────────────────────────────┘
```

### After Selecting Indexes (NEW!)
```
┌─────────────────────────────────────────────┐
│ 📊 Configuration                            │
├─────────────────────────────────────────────┤
│                                             │
│ Model                                       │
│ [llama-2-7b-chat.gguf        ▼]            │
│                                             │
│ Temperature                     0.7         │
│ ├──────●──────────────┤                    │
│                                             │
│ Max Tokens (Optional)                       │
│ [Auto (model default)]                      │
│                                             │
│ GPU Layers                                  │
│ [40 (Very High GPU)            ▼]          │
│                                             │
│ Document Indexes (Optional)                 │
│ Select indexes to enhance responses         │
│                                             │
│ Selected: [✖ research] [✖ documentation]    │
│                                             │
│ [Select indexes...             ▼]          │
│                                             │
│ ─────────────────────────────────────────── │
│ SEARCH CONFIGURATION                        │
│                                             │
│ Search Mode                                 │
│ Choose how to search for relevant docs      │
│ [Hybrid (Semantic+Keywords) ▼] 👈 NEW!     │
│   ├─ Hybrid (Recommended)                   │
│   ├─ Vector (Semantic Only)                 │
│   └─ Keyword (Exact Match)                  │
│                                             │
│ Chunk Count: 3                   👈 NEW!   │
│ Number of relevant chunks (1-10)            │
│ ├────────●─────────────┤                   │
│ 1 (Focused)     10 (Comprehensive)          │
│                                             │
│ Min Relevance Score: 50%         👈 NEW!   │
│ Minimum relevance score (0-100%)            │
│ ├─────────●────────────┤                   │
│ 0% (All)        100% (Perfect)              │
│                                             │
└─────────────────────────────────────────────┘
```

## Search Mode Options

### Option 1: Hybrid (Semantic + Keywords) - RECOMMENDED ⭐
```
┌─────────────────────────────────────────────┐
│ [Hybrid (Semantic+Keywords) - Recommended ▼]│
└─────────────────────────────────────────────┘

✅ Best for: Most use cases
✅ Combines semantic understanding with exact matches
✅ Balanced approach
```

### Option 2: Vector (Semantic Only)
```
┌─────────────────────────────────────────────┐
│ [Vector (Semantic Only)               ▼]    │
└─────────────────────────────────────────────┘

📚 Best for: Conceptual questions
📚 Uses AI embeddings for meaning
📚 May miss exact keyword matches
```

### Option 3: Keyword (Exact Match)
```
┌─────────────────────────────────────────────┐
│ [Keyword (Exact Match)                ▼]    │
└─────────────────────────────────────────────┘

🔍 Best for: Specific terms/phrases
🔍 Fast and precise
🔍 No semantic understanding
```

## Chunk Count Slider

### Low (1-3): Focused & Fast 🚀
```
Chunk Count: 2
├──●──────────────────┤
1             5            10

Speed:  ████████████░░ (Fast)
Focus:  ████████████░░ (Precise)
Detail: ████░░░░░░░░░░ (Limited)
```

### Medium (3-5): Balanced ⚖️
```
Chunk Count: 4
├──────────●──────────┤
1             5            10

Speed:  ████████░░░░░░ (Good)
Focus:  ████████░░░░░░ (Good)
Detail: ████████░░░░░░ (Good)
```

### High (6-10): Comprehensive 📚
```
Chunk Count: 8
├─────────────────●───┤
1             5            10

Speed:  ████░░░░░░░░░░ (Slower)
Focus:  ████░░░░░░░░░░ (Broad)
Detail: ████████████░░ (Rich)
```

## Min Relevance Score Slider

### Low (0-40%): Include More Results 📥
```
Min Relevance Score: 30%
├──────●──────────────┤
0%           50%          100%

Inclusivity: ████████████░░ (High)
Precision:   ████░░░░░░░░░░ (Low)
Results:     ████████████░░ (Many)
```

### Medium (40-60%): Balanced 🎯
```
Min Relevance Score: 50%
├─────────●───────────┤
0%           50%          100%

Inclusivity: ████████░░░░░░ (Medium)
Precision:   ████████░░░░░░ (Medium)
Results:     ████████░░░░░░ (Moderate)
```

### High (60-100%): Only Best Matches ✨
```
Min Relevance Score: 75%
├───────────────●─────┤
0%           50%          100%

Inclusivity: ████░░░░░░░░░░ (Low)
Precision:   ████████████░░ (High)
Results:     ████░░░░░░░░░░ (Few)
```

## Example Configurations

### 🏃 Speed Optimized
```
┌─────────────────────────────────────┐
│ Search Mode:     Keyword            │
│ Chunk Count:     2                  │
│ Min Score:       60%                │
└─────────────────────────────────────┘

⚡ Fastest responses
⚡ Most focused context
⚡ Best for quick Q&A
```

### ⚖️ Balanced (Default)
```
┌─────────────────────────────────────┐
│ Search Mode:     Hybrid             │
│ Chunk Count:     3                  │
│ Min Score:       50%                │
└─────────────────────────────────────┘

✅ Good speed & quality
✅ Versatile for most uses
✅ Recommended starting point
```

### 🎓 Accuracy Optimized
```
┌─────────────────────────────────────┐
│ Search Mode:     Hybrid             │
│ Chunk Count:     7                  │
│ Min Score:       40%                │
└─────────────────────────────────────┘

📚 Most comprehensive
📚 Best context coverage
📚 Best for research/analysis
```

## Real-World Usage Examples

### Example 1: Technical Documentation Search
**Scenario**: Finding API documentation

```
Configuration:
├─ Search Mode:    Keyword
├─ Chunk Count:    3
└─ Min Score:      70%

User Query: "How do I authenticate with JWT?"

Result:
✅ Finds exact matches for "JWT" and "authenticate"
✅ High precision (70% threshold)
✅ Fast response with 3 focused chunks
```

### Example 2: Research Paper Analysis
**Scenario**: Understanding complex concepts

```
Configuration:
├─ Search Mode:    Vector
├─ Chunk Count:    5
└─ Min Score:      45%

User Query: "Explain the methodology behind this research"

Result:
✅ Semantic understanding of "methodology"
✅ Multiple relevant sections (5 chunks)
✅ Includes related but not exact-match content
```

### Example 3: General Knowledge Base Query
**Scenario**: Broad question across documents

```
Configuration:
├─ Search Mode:    Hybrid
├─ Chunk Count:    4
└─ Min Score:      50%

User Query: "What are the best practices for security?"

Result:
✅ Combines semantic and keyword matching
✅ Balanced number of results
✅ Filters out loosely related content
```

## Tips & Tricks

### 💡 Tip 1: Adjust Based on Results
- Getting **too few** results? → Lower min score or increase chunk count
- Getting **irrelevant** results? → Raise min score or use keyword mode
- Getting **slow** responses? → Lower chunk count or use keyword mode

### 💡 Tip 2: Match Mode to Question Type
- **"What is X?"** → Hybrid mode (best for definitions)
- **"Find mentions of X"** → Keyword mode (exact matches)
- **"Explain the concept of X"** → Vector mode (conceptual)

### 💡 Tip 3: Iterate and Refine
1. Start with defaults (Hybrid, 3 chunks, 50%)
2. Review the quality of answers
3. Adjust one parameter at a time
4. Find your optimal configuration

### 💡 Tip 4: Context Length Awareness
More chunks = longer context:
- 1-3 chunks: ~400-1200 characters
- 4-6 chunks: ~1600-2400 characters
- 7-10 chunks: ~2800-4000 characters

Higher context may slow down LLM generation!

---

**Visual Guide Version**: 1.0
**Last Updated**: October 18, 2025
