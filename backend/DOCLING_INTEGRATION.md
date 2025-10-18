# Docling Integration for Document Processing

## Overview

The RAG service has been upgraded to use **Docling**, an advanced document processing library from IBM Research, replacing the basic document extraction methods (PyPDF2, python-docx, etc.).

## What is Docling?

Docling is a state-of-the-art document understanding library that provides:

- **Better PDF extraction**: Superior text extraction from complex PDFs, including scanned documents
- **OCR support**: Automatic OCR for scanned documents and images
- **Table structure preservation**: Extracts and maintains table structures
- **Multi-format support**: PDF, DOCX, PPTX, and more
- **Markdown output**: Converts documents to clean, structured markdown

## Benefits Over Previous Implementation

### Before (Legacy Methods)
- Basic text extraction with PyPDF2 (poor quality on complex PDFs)
- No OCR support
- Tables and images lost
- Poor handling of multi-column layouts
- Limited format support

### After (Docling)
- ✅ High-quality text extraction from complex PDFs
- ✅ Built-in OCR for scanned documents
- ✅ Table structure preservation
- ✅ Better handling of complex layouts
- ✅ Markdown-formatted output (better for LLMs)
- ✅ Support for PDF, DOCX, DOC, PPTX, PPT
- ✅ Automatic fallback to legacy methods if Docling fails

## Implementation Details

### Key Changes

1. **DocumentProcessor Class** (`services/rag_service.py`)
   - Initialized with Docling's `DocumentConverter`
   - Configured with PDF pipeline options (OCR enabled, table structure extraction)
   - Primary processing method uses Docling for PDF/DOCX/PPTX files
   - Legacy methods kept as fallback

2. **Processing Flow**
   ```
   Document → Docling Converter → Markdown → Text Chunks → Vector Store
   ```

3. **Fallback Mechanism**
   - If Docling processing fails, automatically falls back to legacy methods
   - Ensures backward compatibility and reliability

### Configuration

```python
# PDF Pipeline Options
pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = True  # Enable OCR
pipeline_options.do_table_structure = True  # Extract tables

# The converter auto-detects the backend (no manual backend specification needed)
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: pipeline_options,
    }
)
```

### Troubleshooting

**Issue 1: `'PdfPipelineOptions' object has no attribute 'backend'`**
- **Solution**: The current version of Docling auto-detects the backend. Do not manually specify a backend.
- **Fixed in**: The implementation automatically uses the correct backend.

**Issue 2: Logger errors with `exc_info`**
- **Solution**: Fixed the `makeRecord()` call to use positional argument instead of keyword argument.
- **Fixed in**: `utils/logger.py` - corrected the method signature.

**Issue 3: `RuntimeError: Working outside of request context`**
- **Solution**: Added try-catch to handle teardown when not in request context.
- **Fixed in**: `utils/logger.py` - added context checking.

## Supported Formats

| Format | Method | Quality |
|--------|--------|---------|
| PDF | Docling | ⭐⭐⭐⭐⭐ Excellent |
| DOCX | Docling | ⭐⭐⭐⭐⭐ Excellent |
| PPTX | Docling | ⭐⭐⭐⭐⭐ Excellent |
| TXT | Direct read | ⭐⭐⭐⭐⭐ Perfect |
| MD | Markdown parser | ⭐⭐⭐⭐ Good |
| HTML | BeautifulSoup | ⭐⭐⭐⭐ Good |

## Installation

Docling and dependencies are included in `requirements.txt`:

```bash
# Core Docling packages
docling>=1.0.0
docling-core>=1.0.0

# Supporting libraries
PyMuPDF>=1.23.0
python-docx>=0.8.11
PyPDF2>=3.0.0
```

Install with:
```bash
pip install docling docling-core PyMuPDF
```

## Testing

### Test Script: `test_docling_integration.py`

Run comprehensive tests:
```bash
cd backend
python test_docling_integration.py

# Test with a specific document
python test_docling_integration.py path/to/document.pdf
```

### Test Results
All tests passed ✅:
1. Docling Import ✅
2. DocumentProcessor Initialization ✅
3. RAGService Integration ✅
4. Document Processing ✅

## Usage Example

```python
from services.rag_service import RAGService

# Initialize RAG service (Docling auto-configured)
rag = RAGService()

# Create an index
rag.create_index("my_documents")

# Upload a document (automatically uses Docling)
result = rag.upload_document(
    index_name="my_documents",
    filepath="/path/to/document.pdf",
    filename="document.pdf",
    metadata={"author": "John Doe"}
)

# Query the index
results = rag.query(
    index_name="my_documents",
    query="What is the main topic?",
    k=5,
    mode="hybrid"
)
```

## API Integration

The existing RAG API endpoints automatically benefit from Docling:

```bash
# Upload endpoint (POST /api/rag/upload)
curl -X POST http://localhost:5000/api/rag/upload \
  -F "index_name=docs" \
  -F "files=@document.pdf"
```

No API changes required - Docling works transparently!

## Performance Considerations

- **Speed**: Docling is slightly slower than basic extraction but provides much better quality
- **Memory**: Uses more memory for complex PDFs with images
- **OCR**: OCR processing adds time but handles scanned documents
- **Caching**: Docling internally caches parsed documents

## Error Handling

The implementation includes robust error handling:

1. **Primary**: Try Docling extraction
2. **Fallback**: If Docling fails, use legacy methods (PyPDF2, python-docx)
3. **Logging**: All errors logged for debugging
4. **User feedback**: Clear error messages returned to API

## Migration Notes

- ✅ **No breaking changes**: Existing API remains the same
- ✅ **Automatic upgrade**: All document uploads now use Docling
- ✅ **Backward compatible**: Old indexes continue to work
- ✅ **No data migration**: Existing vector stores unchanged

## Future Enhancements

Potential improvements:
1. **Batch processing**: Process multiple documents in parallel
2. **Custom OCR models**: Fine-tune OCR for specific document types
3. **Image extraction**: Extract and index images separately
4. **Layout analysis**: Preserve document structure metadata
5. **Entity extraction**: Extract entities during document processing

## References

- **Docling GitHub**: https://github.com/DS4SD/docling
- **Docling Documentation**: https://ds4sd.github.io/docling/
- **Docling Paper**: IBM Research documentation on document understanding

## Conclusion

The integration of Docling significantly improves document processing quality in the RAG service, providing better text extraction, OCR support, and table structure preservation. The implementation is production-ready with proper fallbacks and error handling.
