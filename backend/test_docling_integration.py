"""
Test script to verify Docling integration in RAG service
"""
import sys
import os
import logging

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_docling_import():
    """Test if Docling can be imported"""
    try:
        from docling.document_converter import DocumentConverter
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.datamodel.base_models import InputFormat
        logger.info("✅ Docling import successful")
        return True
    except ImportError as e:
        logger.error(f"❌ Failed to import Docling: {e}")
        return False

def test_document_processor():
    """Test DocumentProcessor initialization"""
    try:
        from services.rag_service import DocumentProcessor
        logger.info("Creating DocumentProcessor instance...")
        processor = DocumentProcessor()
        logger.info("✅ DocumentProcessor created successfully with Docling")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create DocumentProcessor: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_rag_service():
    """Test RAGService initialization"""
    try:
        from services.rag_service import RAGService
        logger.info("Creating RAGService instance...")
        rag_service = RAGService(storage_path='test_rag_storage')
        logger.info("✅ RAGService created successfully with Docling-enabled processor")
        
        # Clean up test directory
        import shutil
        if os.path.exists('test_rag_storage'):
            shutil.rmtree('test_rag_storage')
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create RAGService: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_document_processing(test_file_path=None):
    """Test processing a document with Docling"""
    if not test_file_path or not os.path.exists(test_file_path):
        logger.warning("⚠️ No test file provided or file doesn't exist. Skipping document processing test.")
        return True
    
    try:
        from services.rag_service import DocumentProcessor
        logger.info(f"Testing document processing with file: {test_file_path}")
        
        processor = DocumentProcessor()
        text = processor.process_file(test_file_path, os.path.basename(test_file_path))
        
        logger.info(f"✅ Document processed successfully")
        logger.info(f"   Extracted text length: {len(text)} characters")
        logger.info(f"   First 200 characters: {text[:200]}...")
        
        return True
    except Exception as e:
        logger.error(f"❌ Failed to process document: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    logger.info("=" * 60)
    logger.info("Testing Docling Integration in RAG Service")
    logger.info("=" * 60)
    
    tests = [
        ("Docling Import", test_docling_import),
        ("DocumentProcessor", test_document_processor),
        ("RAGService", test_rag_service),
    ]
    
    # Check for test file
    test_file = None
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
        tests.append(("Document Processing", lambda: test_document_processing(test_file)))
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\n{'=' * 60}")
        logger.info(f"Running: {test_name}")
        logger.info('=' * 60)
        result = test_func()
        results.append((test_name, result))
    
    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("Test Summary")
    logger.info("=" * 60)
    
    passed = 0
    failed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    logger.info("=" * 60)
    logger.info(f"Total: {passed + failed} tests | Passed: {passed} | Failed: {failed}")
    logger.info("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
