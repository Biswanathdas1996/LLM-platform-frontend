"""
Comprehensive test for Docling integration with error handling
"""
import sys
import os
import tempfile
import logging

sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_rag_service_with_sample_file():
    """Test the full RAG service workflow with Docling"""
    from services.rag_service import RAGService
    
    logger.info("=" * 60)
    logger.info("Testing RAG Service with Docling Integration")
    logger.info("=" * 60)
    
    try:
        # Create temporary storage
        with tempfile.TemporaryDirectory() as temp_dir:
            # Initialize RAG service
            logger.info("1. Initializing RAG service...")
            rag_service = RAGService(storage_path=temp_dir)
            logger.info("   ✅ RAG service initialized")
            
            # Create an index
            logger.info("\n2. Creating document index...")
            result = rag_service.create_index("test_index")
            if 'error' in result:
                logger.error(f"   ❌ Failed to create index: {result['error']}")
                return False
            logger.info("   ✅ Index created")
            
            # Create a test text file
            logger.info("\n3. Creating test document...")
            test_file = os.path.join(temp_dir, "test_doc.txt")
            test_content = """
            This is a test document for the RAG service.
            It contains multiple paragraphs to test text chunking.
            
            The document processor should extract this text correctly.
            We're testing the Docling integration here.
            
            Key features being tested:
            1. Document loading
            2. Text extraction
            3. Chunking
            4. Vector storage
            5. Retrieval
            """
            
            with open(test_file, 'w') as f:
                f.write(test_content)
            logger.info("   ✅ Test document created")
            
            # Upload the document
            logger.info("\n4. Uploading document to index...")
            upload_result = rag_service.upload_document(
                index_name="test_index",
                filepath=test_file,
                filename="test_doc.txt",
                metadata={"source": "test", "author": "system"}
            )
            
            if 'error' in upload_result:
                logger.error(f"   ❌ Failed to upload: {upload_result['error']}")
                return False
            
            logger.info(f"   ✅ Document uploaded")
            logger.info(f"      - Chunks: {upload_result.get('chunks', 0)}")
            logger.info(f"      - Size: {upload_result.get('size', 0)} bytes")
            
            # Query the index
            logger.info("\n5. Querying the index...")
            query_result = rag_service.query(
                index_name="test_index",
                query="What features are being tested?",
                k=3,
                mode="hybrid"
            )
            
            if 'error' in query_result:
                logger.error(f"   ❌ Failed to query: {query_result['error']}")
                return False
            
            logger.info(f"   ✅ Query successful")
            logger.info(f"      - Found {len(query_result.get('results', []))} results")
            
            # Display results
            if query_result.get('results'):
                logger.info("\n   Top Results:")
                for i, result in enumerate(query_result['results'][:2], 1):
                    logger.info(f"\n   Result {i}:")
                    logger.info(f"   Score: {result['score']:.4f}")
                    logger.info(f"   Text: {result['text'][:100]}...")
            
            # Get index info
            logger.info("\n6. Getting index information...")
            index_info = rag_service.get_index_info("test_index")
            if 'error' not in index_info:
                logger.info(f"   ✅ Index info retrieved")
                logger.info(f"      - Total documents: {index_info['stats']['total_documents']}")
                logger.info(f"      - Total chunks: {index_info['stats']['total_chunks']}")
            
            logger.info("\n" + "=" * 60)
            logger.info("✅ All tests passed successfully!")
            logger.info("=" * 60)
            return True
            
    except Exception as e:
        logger.error(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_rag_service_with_sample_file()
    sys.exit(0 if success else 1)
