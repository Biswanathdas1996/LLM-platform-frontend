# Playground RAG Feature - Quick Start Guide

## What's New?

The Playground now supports **Document-Aware AI Responses**! You can select multiple document indexes, and the AI will use information from your uploaded documents to provide more accurate, context-aware answers.

## How to Use

### Step 1: Access the Playground
Navigate to `/playground` in your application.

### Step 2: Configure Your Chat
1. **Select a Model** (Required)
2. **Adjust Parameters** (Optional)
   - Temperature: Controls randomness (0-2)
   - Max Tokens: Maximum response length
   - GPU Layers: GPU acceleration settings

### Step 3: Select Document Indexes (NEW! Optional)
1. Look for the **"Document Indexes (Optional)"** section
2. Click the dropdown showing "Select indexes..."
3. Choose one or more document indexes
4. Selected indexes appear as **green badges** above the dropdown
5. Click the **X** on a badge to remove that index

### Step 4: Ask Questions
1. Type your question in the chat input
2. If indexes are selected, you'll see **"RAG Context: X indexes"** in the chat header
3. The AI will search your documents and use that context in its response
4. Responses will be based on your uploaded documents!

## Example Usage

### Without RAG (Normal Chat)
```
You: What is machine learning?
AI: [Generic response from model's training data]
```

### With RAG (Document-Enhanced)
```
Indexes Selected: "AI_Textbook", "Research_Papers"
RAG Context: 2 indexes

You: What is machine learning?
AI: Based on your documents, machine learning is defined in 
    "AI_Textbook.pdf" as a subset of artificial intelligence...
    According to "latest_research.pdf", recent advances include...
```

## Visual Indicators

### Index Selection Area
```
Document Indexes (Optional)
Select indexes to enhance responses with document context

[AI_Textbook ×] [Research_Papers ×]

[Select indexes... ▼]
```

### Chat Header
```
Chat                           📚 RAG Context: 2 indexes
```

## Features

✅ **Multi-Index Support**: Query multiple document collections at once
✅ **Visual Feedback**: See which indexes are active
✅ **Source Attribution**: Responses reference specific documents
✅ **Graceful Fallback**: Works normally if no documents match
✅ **Hybrid Search**: Uses both vector similarity and keyword matching
✅ **Relevance Ranking**: Best results from all indexes prioritized

## Tips

💡 **Tip 1**: Select indexes relevant to your question for best results
💡 **Tip 2**: You can leave indexes unselected for general questions
💡 **Tip 3**: The system retrieves the top 5 most relevant chunks
💡 **Tip 4**: Responses include relevance scores and source documents
💡 **Tip 5**: More specific questions work better with RAG

## Troubleshooting

**Q: I don't see any indexes in the dropdown**
- A: Make sure you've uploaded documents to at least one index via the BYOD page

**Q: RAG context shows but responses don't use documents**
- A: The documents may not contain relevant information for your question

**Q: How do I know if the AI is using my documents?**
- A: The enhanced prompt instructs the AI to cite sources and base answers on the provided context

**Q: Can I use this without selecting indexes?**
- A: Yes! The feature is completely optional. Without indexes, it works like normal chat.

## Example Workflow

1. **Upload Documents** (on BYOD page)
   - Upload your PDFs, DOCX, TXT files
   - Create/select an index
   - Documents are processed and stored

2. **Go to Playground**
   - Navigate to `/playground`

3. **Configure RAG**
   - Select the index(es) you just created
   - Choose your model

4. **Ask Questions**
   - Ask questions about your documents
   - Get accurate, document-based answers!

## Behind the Scenes

When you ask a question with indexes selected:

1. 🔍 System searches selected indexes for relevant content
2. 📊 Ranks results by relevance score
3. 📚 Combines top 5 chunks from all indexes
4. 🤖 Enhances your question with document context
5. 💬 AI generates response based on your documents
6. ✨ You get accurate, source-backed answers!

---

**Need Help?**
- Check the main documentation: `PLAYGROUND_RAG_INTEGRATION.md`
- Visit the BYOD page to manage document indexes
- Review the RAG API documentation: `backend/RAG_API_REFERENCE.md`
