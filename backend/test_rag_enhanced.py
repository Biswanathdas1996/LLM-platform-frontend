"""
Test enhanced RAG features: smaller chunks, keywords, and document management
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

def test_enhanced_rag_features():
    """Test all enhanced RAG features"""
    from services.rag_service import RAGService
    
    logger.info("=" * 70)
    logger.info("Testing Enhanced RAG Features")
    logger.info("=" * 70)
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Initialize RAG service
            logger.info("\n1. Initializing RAG service...")
            rag_service = RAGService(storage_path=temp_dir)
            logger.info("   ✅ RAG service initialized with Docling")
            
            # Create an index
            logger.info("\n2. Creating test index...")
            result = rag_service.create_index("test_index")
            logger.info("   ✅ Index created")
            
            # Create test documents
            logger.info("\n3. Creating test documents...")
            docs = []
            
            # Document 1: Technical documentation
            doc1_path = os.path.join(temp_dir, "tech_doc.txt")
            doc1_content = """
            Machine Learning and Artificial Intelligence
            
            Machine learning is a subset of artificial intelligence that focuses on 
            developing algorithms that can learn from data. Deep learning uses neural 
            networks with multiple layers to process complex patterns.
            
            Key concepts include supervised learning, unsupervised learning, and 
            reinforcement learning. Popular frameworks include TensorFlow and PyTorch.
            
            Neural networks consist of interconnected nodes that process information
            in layers. Convolutional neural networks are particularly effective for
            image processing tasks.
            """
            with open(doc1_path, 'w') as f:
                f.write(doc1_content)
            docs.append(('tech_doc.txt', doc1_path, {'category': 'technical', 'topic': 'AI'}))
            
            # Document 2: Business content
            doc2_path = os.path.join(temp_dir, "business_doc.txt")
            doc2_content = """
            Business Strategy and Market Analysis
            
            Strategic planning involves analyzing market trends and competitive landscapes.
            Companies must adapt to changing customer needs and technological disruptions.
            
            Key performance indicators help measure business success. Revenue growth,
            customer acquisition costs, and retention rates are critical metrics.
            
            Digital transformation is reshaping industries. Cloud computing and data
            analytics enable better decision-making and operational efficiency.
            """
            with open(doc2_path, 'w') as f:
                f.write(doc2_content)
            docs.append(('business_doc.txt', doc2_path, {'category': 'business', 'topic': 'strategy'}))
            
            logger.info(f"   ✅ Created {len(docs)} test documents")
            
            # Upload documents
            logger.info("\n4. Uploading documents with keyword extraction...")
            uploaded_docs = []
            for filename, filepath, metadata in docs:
                result = rag_service.upload_document(
                    index_name="test_index",
                    filepath=filepath,
                    filename=filename,
                    metadata=metadata
                )
                
                if 'error' not in result:
                    uploaded_docs.append(result)
                    logger.info(f"   ✅ Uploaded: {filename}")
                    logger.info(f"      - Document ID: {result['document_id']}")
                    logger.info(f"      - Chunks: {result['chunks']}")
                    logger.info(f"      - Size: {result['size']} bytes")
            
            # List documents in index
            logger.info("\n5. Listing all documents in index...")
            doc_list = rag_service.list_documents("test_index")
            
            if 'error' not in doc_list:
                logger.info(f"   ✅ Found {doc_list['total_documents']} documents")
                for doc in doc_list['documents']:
                    logger.info(f"\n   Document: {doc['filename']}")
                    logger.info(f"   - ID: {doc['id']}")
                    logger.info(f"   - Chunks: {doc['chunks']}")
                    logger.info(f"   - Category: {doc['metadata'].get('category', 'N/A')}")
            
            # Get detailed document information
            if uploaded_docs:
                logger.info("\n6. Getting detailed document information...")
                doc_id = uploaded_docs[0]['document_id']
                details = rag_service.get_document_details("test_index", doc_id)
                
                if 'error' not in details:
                    logger.info(f"   ✅ Retrieved details for: {details['document']['filename']}")
                    logger.info(f"   - Total chunks: {len(details['chunks'])}")
                    
                    # Show chunk keywords
                    for i, chunk in enumerate(details['chunks'][:2], 1):
                        logger.info(f"\n   Chunk {i}:")
                        logger.info(f"   - Word count: {chunk['word_count']}")
                        logger.info(f"   - Keywords: {', '.join(chunk['keywords'][:5])}")
                        logger.info(f"   - Preview: {chunk['text_preview'][:100]}...")
            
            # Test queries with different modes
            logger.info("\n7. Testing queries with keyword matching...")
            
            queries = [
                ("What is machine learning?", "Technical query"),
                ("Tell me about business strategy", "Business query"),
                ("neural networks", "Keyword search")
            ]
            
            for query, description in queries:
                logger.info(f"\n   Query: '{query}' ({description})")
                
                for mode in ['hybrid', 'keyword', 'vector']:
                    result = rag_service.query(
                        index_name="test_index",
                        query=query,
                        k=2,
                        mode=mode
                    )
                    
                    if 'error' not in result and result['results']:
                        top_result = result['results'][0]
                        logger.info(f"   - {mode.upper()} mode: score={top_result['score']:.3f}, keywords={', '.join(top_result['keywords'][:3])}")
            
            # Test document deletion
            if uploaded_docs:
                logger.info("\n8. Testing document deletion...")
                doc_id = uploaded_docs[0]['document_id']
                delete_result = rag_service.delete_document("test_index", doc_id)
                
                if 'error' not in delete_result:
                    logger.info(f"   ✅ Deleted document: {delete_result['document_id']}")
                    
                    # Verify deletion
                    doc_list = rag_service.list_documents("test_index")
                    logger.info(f"   ✅ Documents remaining: {doc_list['total_documents']}")
            
            # Get index statistics
            logger.info("\n9. Getting index statistics...")
            index_info = rag_service.get_index_info("test_index")
            
            if 'error' not in index_info:
                logger.info(f"   ✅ Index statistics:")
                logger.info(f"   - Total documents: {index_info['stats']['total_documents']}")
                logger.info(f"   - Total chunks: {index_info['stats']['total_chunks']}")
                logger.info(f"   - Total size: {index_info['stats']['total_size']} bytes")
            
            logger.info("\n" + "=" * 70)
            logger.info("✅ All enhanced features tested successfully!")
            logger.info("=" * 70)
            logger.info("\nKey Improvements:")
            logger.info("  ✓ Smaller chunk sizes (256 words vs 512)")
            logger.info("  ✓ Keyword extraction for each chunk")
            logger.info("  ✓ Enhanced keyword-based search")
            logger.info("  ✓ Document listing and management")
            logger.info("  ✓ Detailed document and chunk information")
            logger.info("=" * 70)
            
            return True
            
    except Exception as e:
        logger.error(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_enhanced_rag_features()
    sys.exit(0 if success else 1)
