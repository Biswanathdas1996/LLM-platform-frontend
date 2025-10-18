"""
Test PDF document processing with Docling
"""
import sys
import os
import logging

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_pdf_processing():
    """Test processing a real PDF file"""
    from services.rag_service import DocumentProcessor
    
    # You can specify a PDF file path here
    pdf_path = input("Enter the path to a PDF file (or press Enter to skip): ").strip()
    
    if not pdf_path or not os.path.exists(pdf_path):
        logger.warning("No valid PDF file provided. Test skipped.")
        return
    
    try:
        logger.info(f"Processing PDF: {pdf_path}")
        processor = DocumentProcessor()
        
        text = processor.process_file(pdf_path, os.path.basename(pdf_path))
        
        logger.info("✅ PDF processed successfully!")
        logger.info(f"   Extracted text length: {len(text)} characters")
        logger.info(f"   First 500 characters:")
        logger.info("-" * 60)
        logger.info(text[:500])
        logger.info("-" * 60)
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to process PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_pdf_processing()
