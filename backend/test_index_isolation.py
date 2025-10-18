"""
Test to verify that queries only return results from the specified index
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

def test_index_isolation():
    """Test that queries only return results from the specified index"""
    from services.rag_service import RAGService
    
    logger.info("=" * 70)
    logger.info("Testing Index Isolation - Query Results Per Index")
    logger.info("=" * 70)
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Initialize RAG service
            logger.info("\n1. Initializing RAG service...")
            rag_service = RAGService(storage_path=temp_dir)
            logger.info("   ✅ RAG service initialized")
            
            # Create two separate indexes
            logger.info("\n2. Creating two separate indexes...")
            rag_service.create_index("index_medical")
            rag_service.create_index("index_technology")
            logger.info("   ✅ Created indexes: 'index_medical' and 'index_technology'")
            
            # Create medical document
            logger.info("\n3. Adding documents to different indexes...")
            
            medical_doc = os.path.join(temp_dir, "medical.txt")
            medical_content = """
            Medical Research on Cardiovascular Disease
            
            Cardiovascular disease remains a leading cause of mortality worldwide.
            Heart attacks and strokes are common cardiovascular events that require
            immediate medical attention. Risk factors include high blood pressure,
            cholesterol levels, diabetes, and smoking.
            
            Treatment options include medication, lifestyle changes, and surgical
            interventions such as angioplasty or bypass surgery. Prevention through
            regular exercise and healthy diet is crucial.
            """
            with open(medical_doc, 'w') as f:
                f.write(medical_content)
            
            medical_result = rag_service.upload_document(
                index_name="index_medical",
                filepath=medical_doc,
                filename="medical.txt",
                metadata={"category": "medical", "topic": "cardiovascular"}
            )
            logger.info(f"   ✅ Uploaded to 'index_medical': medical.txt")
            logger.info(f"      - Document ID: {medical_result['document_id']}")
            
            # Create technology document
            tech_doc = os.path.join(temp_dir, "technology.txt")
            tech_content = """
            Artificial Intelligence and Machine Learning Technologies
            
            Machine learning algorithms are transforming software development and
            data analysis. Neural networks power modern AI applications including
            computer vision, natural language processing, and recommendation systems.
            
            Deep learning frameworks like TensorFlow and PyTorch enable researchers
            to build complex models. Cloud computing provides the infrastructure
            needed for training large-scale AI models.
            """
            with open(tech_doc, 'w') as f:
                f.write(tech_content)
            
            tech_result = rag_service.upload_document(
                index_name="index_technology",
                filepath=tech_doc,
                filename="technology.txt",
                metadata={"category": "technology", "topic": "AI"}
            )
            logger.info(f"   ✅ Uploaded to 'index_technology': technology.txt")
            logger.info(f"      - Document ID: {tech_result['document_id']}")
            
            # Test queries to ensure isolation
            logger.info("\n4. Testing query isolation...")
            logger.info("   " + "-" * 66)
            
            # Query medical index with medical question
            logger.info("\n   Test 1: Query 'index_medical' with medical question")
            query1 = "What are cardiovascular disease risk factors?"
            result1 = rag_service.query(
                index_name="index_medical",
                query=query1,
                k=5,
                mode="hybrid"
            )
            
            if 'error' not in result1:
                logger.info(f"   ✅ Query: '{query1}'")
                logger.info(f"   ✅ Results from index: {result1['index_name']}")
                logger.info(f"   ✅ Total results: {result1['total_results']}")
                
                for i, res in enumerate(result1['results'], 1):
                    logger.info(f"\n   Result {i}:")
                    logger.info(f"   - Index: {res['index_name']}")
                    logger.info(f"   - Document: {res['document_name']}")
                    logger.info(f"   - Score: {res['score']:.3f}")
                    logger.info(f"   - Keywords: {', '.join(res['keywords'][:5])}")
                    
                    # Verify it's from medical index
                    if res['index_name'] != 'index_medical':
                        logger.error(f"   ❌ ERROR: Result from wrong index!")
                        return False
                
                logger.info("\n   ✅ All results are from 'index_medical'")
            
            # Query technology index with tech question
            logger.info("\n   Test 2: Query 'index_technology' with tech question")
            query2 = "What are machine learning frameworks?"
            result2 = rag_service.query(
                index_name="index_technology",
                query=query2,
                k=5,
                mode="hybrid"
            )
            
            if 'error' not in result2:
                logger.info(f"   ✅ Query: '{query2}'")
                logger.info(f"   ✅ Results from index: {result2['index_name']}")
                logger.info(f"   ✅ Total results: {result2['total_results']}")
                
                for i, res in enumerate(result2['results'], 1):
                    logger.info(f"\n   Result {i}:")
                    logger.info(f"   - Index: {res['index_name']}")
                    logger.info(f"   - Document: {res['document_name']}")
                    logger.info(f"   - Score: {res['score']:.3f}")
                    logger.info(f"   - Keywords: {', '.join(res['keywords'][:5])}")
                    
                    # Verify it's from technology index
                    if res['index_name'] != 'index_technology':
                        logger.error(f"   ❌ ERROR: Result from wrong index!")
                        return False
                
                logger.info("\n   ✅ All results are from 'index_technology'")
            
            # Cross-test: Query medical index with tech question (should return no/low results)
            logger.info("\n   Test 3: Query 'index_medical' with tech question (cross-test)")
            query3 = "What are machine learning frameworks?"
            result3 = rag_service.query(
                index_name="index_medical",
                query=query3,
                k=5,
                mode="hybrid"
            )
            
            if 'error' not in result3:
                logger.info(f"   ✅ Query: '{query3}'")
                logger.info(f"   ✅ Results from index: {result3['index_name']}")
                logger.info(f"   ✅ Total results: {result3['total_results']}")
                
                if result3['total_results'] == 0:
                    logger.info("   ✅ Correctly returned no results (query mismatch)")
                else:
                    for res in result3['results']:
                        if res['index_name'] != 'index_medical':
                            logger.error(f"   ❌ ERROR: Result from wrong index!")
                            return False
                    logger.info("   ✅ All results correctly from 'index_medical' only")
            
            # Cross-test: Query technology index with medical question
            logger.info("\n   Test 4: Query 'index_technology' with medical question (cross-test)")
            query4 = "What are cardiovascular disease risk factors?"
            result4 = rag_service.query(
                index_name="index_technology",
                query=query4,
                k=5,
                mode="hybrid"
            )
            
            if 'error' not in result4:
                logger.info(f"   ✅ Query: '{query4}'")
                logger.info(f"   ✅ Results from index: {result4['index_name']}")
                logger.info(f"   ✅ Total results: {result4['total_results']}")
                
                if result4['total_results'] == 0:
                    logger.info("   ✅ Correctly returned no results (query mismatch)")
                else:
                    for res in result4['results']:
                        if res['index_name'] != 'index_technology':
                            logger.error(f"   ❌ ERROR: Result from wrong index!")
                            return False
                    logger.info("   ✅ All results correctly from 'index_technology' only")
            
            # Verify document counts per index
            logger.info("\n5. Verifying document counts per index...")
            
            medical_docs = rag_service.list_documents("index_medical")
            tech_docs = rag_service.list_documents("index_technology")
            
            logger.info(f"   ✅ index_medical: {medical_docs['total_documents']} document(s)")
            logger.info(f"   ✅ index_technology: {tech_docs['total_documents']} document(s)")
            
            if medical_docs['total_documents'] != 1 or tech_docs['total_documents'] != 1:
                logger.error("   ❌ ERROR: Incorrect document counts!")
                return False
            
            logger.info("\n" + "=" * 70)
            logger.info("✅ Index Isolation Test PASSED!")
            logger.info("=" * 70)
            logger.info("\nVerified:")
            logger.info("  ✓ Queries return results only from specified index")
            logger.info("  ✓ Each result includes index_name for verification")
            logger.info("  ✓ Cross-index queries don't leak results")
            logger.info("  ✓ Document isolation is maintained")
            logger.info("=" * 70)
            
            return True
            
    except Exception as e:
        logger.error(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_index_isolation()
    sys.exit(0 if success else 1)
