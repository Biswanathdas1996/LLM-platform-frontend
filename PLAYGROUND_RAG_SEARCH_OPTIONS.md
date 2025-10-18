# Playground RAG Search Options - Feature Documentation

## Overview
Added advanced RAG search configuration options to the Playground to give users fine-grained control over document retrieval and context relevance.

## New Features

### 1. **Search Mode** 
Choose how to search for relevant documents:

- **Hybrid (Semantic + Keywords)** - *Recommended*
  - Combines vector embeddings with keyword matching
  - Best balance of semantic understanding and exact matches
  - Default mode for optimal results

- **Vector (Semantic Only)**
  - Uses only semantic similarity via embeddings
  - Best for conceptual questions
  - May miss exact keyword matches

- **Keyword (Exact Match)**
  - Traditional keyword-based search
  - Best for finding specific terms or phrases
  - Faster but less intelligent

### 2. **Chunk Count**
Control the number of relevant document chunks to retrieve (1-10):

- **Lower values (1-3)**
  - Faster response times
  - More focused context
  - Better for specific questions

- **Higher values (7-10)**
  - Comprehensive context
  - Better for complex questions
  - May include less relevant information

**Default**: 3 chunks

### 3. **Min Relevance Score**
Set the minimum relevance threshold (0-100%):

- **Lower threshold (0-40%)**
  - More results included
  - May include tangentially related content
  - Better recall, lower precision

- **Higher threshold (60-100%)**
  - Only highly relevant results
  - Stricter filtering
  - Better precision, lower recall

**Default**: 50% (0.5)

## UI Location
These options appear in the Playground's Configuration Panel under "Document Indexes (Optional)" section, **only when one or more indexes are selected**.

### Layout
```
Document Indexes (Optional)
├── [Selected Index Badges]
├── Index Selection Dropdown
└── Search Configuration (appears when indexes selected)
    ├── Search Mode (dropdown)
    ├── Chunk Count (slider: 1-10)
    └── Min Relevance Score (slider: 0-100%)
```

## How It Works

### Frontend Flow
1. User selects document indexes in the Configuration Panel
2. Search configuration options become visible
3. User adjusts search mode, chunk count, and min score
4. When user sends a message, these parameters are passed to the RAG query
5. Results are filtered and used to build context for the LLM

### Backend Integration
The frontend passes these parameters to the RAG API endpoint:
```typescript
{
  index_names: string[],
  query: string,
  k: number,              // chunkCount
  mode: string            // searchMode: 'hybrid' | 'vector' | 'keyword'
}
```

The `minChunkScore` is applied as a client-side filter on the results.

## Usage Examples

### Fast, Focused Queries
```
Search Mode: Hybrid
Chunk Count: 2
Min Score: 60%
```
Best for: Quick answers, specific questions

### Comprehensive Research
```
Search Mode: Hybrid
Chunk Count: 7
Min Score: 40%
```
Best for: Complex questions, exploratory research

### Exact Terminology
```
Search Mode: Keyword
Chunk Count: 3
Min Score: 70%
```
Best for: Finding specific terms, technical documentation

## Implementation Details

### Files Modified
1. **PlaygroundView.tsx**
   - Added `searchMode`, `chunkCount`, `minChunkScore` to `PlaygroundConfig`
   - Set default values

2. **ConfigPanel.tsx**
   - Added search configuration UI controls
   - Conditional rendering (only shows when indexes selected)
   - Three new controls: dropdown for mode, sliders for count and score

3. **ChatInterface.tsx**
   - Updated to accept new parameters
   - Uses configured values in RAG query
   - Filters results by minimum score
   - Dynamically builds context based on chunk count

### Type Safety
All three components now use the same updated `PlaygroundConfig` interface:
```typescript
interface PlaygroundConfig {
  selectedModel: string;
  temperature: number;
  maxTokens: number | undefined;
  gpuLayers: number;
  selectedIndexes: string[];
  searchMode: 'hybrid' | 'vector' | 'keyword';  // NEW
  chunkCount: number;                           // NEW
  minChunkScore: number;                        // NEW
}
```

## Benefits

1. **User Control**: Users can fine-tune retrieval to their specific needs
2. **Performance**: Can optimize for speed (fewer chunks) or accuracy (more chunks)
3. **Quality**: Minimum score threshold ensures relevant context
4. **Flexibility**: Different search modes for different types of questions
5. **Transparency**: Users understand how document search is configured

## Best Practices

### General Guidelines
- Start with default settings (Hybrid, 3 chunks, 50% score)
- Increase chunk count for complex questions
- Use keyword mode for exact term matching
- Raise minimum score if getting irrelevant results
- Lower minimum score if getting too few results

### Performance Considerations
- Higher chunk counts = slower responses
- Keyword search is fastest
- Vector search provides best semantic understanding
- Hybrid balances speed and accuracy

---

**Feature Status**: ✅ Implemented
**Version**: 1.0
**Last Updated**: October 18, 2025
