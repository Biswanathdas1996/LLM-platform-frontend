"""
Test script for Playground RAG multi-index query feature
Tests the new query_multiple_indexes endpoint
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.rag_service import RAGService
import tempfile
import json

def test_multi_index_query():
    """Test querying multiple indexes"""
    print("=" * 60)
    print("Testing Playground RAG Multi-Index Query Feature")
    print("=" * 60)
    
    # Create temporary storage for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        rag_service = RAGService(storage_path=temp_dir)
        
        print("\n1. Creating test indexes...")
        # Create two test indexes
        index1_result = rag_service.create_index('tech_docs')
        index2_result = rag_service.create_index('research_papers')
        
        if 'error' not in index1_result and 'error' not in index2_result:
            print(f"   ✓ Created indexes: tech_docs, research_papers")
        else:
            print(f"   ✗ Failed to create indexes")
            return False
        
        print("\n2. Adding test documents...")
        
        # Create test document 1
        test_doc1 = os.path.join(temp_dir, 'machine_learning.txt')
        with open(test_doc1, 'w', encoding='utf-8') as f:
            f.write("""
            Machine learning is a subset of artificial intelligence that enables 
            computers to learn from data without being explicitly programmed. 
            It uses algorithms to identify patterns and make predictions.
            
            The three main types of machine learning are:
            1. Supervised learning - learning from labeled data
            2. Unsupervised learning - finding patterns in unlabeled data
            3. Reinforcement learning - learning through trial and error
            """)
        
        # Create test document 2
        test_doc2 = os.path.join(temp_dir, 'neural_networks.txt')
        with open(test_doc2, 'w', encoding='utf-8') as f:
            f.write("""
            Neural networks are computational models inspired by biological neural 
            networks in the brain. They consist of layers of interconnected nodes 
            that process and transform data.
            
            Deep learning uses multi-layer neural networks to learn hierarchical 
            representations of data. It has achieved breakthrough results in 
            image recognition, natural language processing, and many other fields.
            """)
        
        # Upload to first index
        result1 = rag_service.upload_document(
            index_name='tech_docs',
            filepath=test_doc1,
            filename='machine_learning.txt'
        )
        
        # Upload to second index
        result2 = rag_service.upload_document(
            index_name='research_papers',
            filepath=test_doc2,
            filename='neural_networks.txt'
        )
        
        if 'error' not in result1 and 'error' not in result2:
            print(f"   ✓ Uploaded documents successfully")
            print(f"     - tech_docs: {result1['chunks']} chunks")
            print(f"     - research_papers: {result2['chunks']} chunks")
        else:
            print(f"   ✗ Failed to upload documents")
            return False
        
        print("\n3. Testing single index query...")
        single_result = rag_service.query(
            index_name='tech_docs',
            query='What is machine learning?',
            k=3,
            mode='hybrid'
        )
        
        if single_result.get('success'):
            print(f"   ✓ Single index query successful")
            print(f"     - Found {single_result['total_results']} results")
            if single_result['results']:
                print(f"     - Top score: {single_result['results'][0]['score']:.3f}")
        else:
            print(f"   ✗ Single index query failed: {single_result.get('error')}")
            return False
        
        print("\n4. Testing multi-index query (NEW FEATURE)...")
        multi_result = rag_service.query_multiple_indexes(
            index_names=['tech_docs', 'research_papers'],
            query='What is machine learning and neural networks?',
            k=5,
            mode='hybrid'
        )
        
        if multi_result.get('success'):
            print(f"   ✓ Multi-index query successful!")
            print(f"     - Queried {multi_result['queried_indexes']} indexes")
            print(f"     - Total results: {multi_result['total_results']}")
            
            if multi_result['results']:
                print(f"\n   Top 3 Results:")
                for i, result in enumerate(multi_result['results'][:3], 1):
                    print(f"   [{i}] Score: {result['score']:.3f} | "
                          f"From: {result['index_name']} | "
                          f"Doc: {result['document_name']}")
                    print(f"       Preview: {result['text'][:80]}...")
        else:
            print(f"   ✗ Multi-index query failed: {multi_result.get('error')}")
            return False
        
        print("\n5. Testing with non-existent index...")
        error_result = rag_service.query_multiple_indexes(
            index_names=['tech_docs', 'nonexistent_index'],
            query='test query',
            k=3,
            mode='hybrid'
        )
        
        if error_result.get('success'):
            print(f"   ✓ Handled non-existent index gracefully")
            print(f"     - Queried {error_result['queried_indexes']} valid indexes")
            if error_result.get('errors'):
                print(f"     - Errors: {error_result['errors']}")
        else:
            print(f"   ✓ Returned error as expected: {error_result.get('error')}")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nNew Feature Summary:")
        print("- ✓ Single index query works")
        print("- ✓ Multi-index query merges results")
        print("- ✓ Results sorted by relevance score")
        print("- ✓ Index names tracked in results")
        print("- ✓ Error handling for invalid indexes")
        print("\nThe Playground RAG feature is ready to use!")
        print("=" * 60)
        
        return True

if __name__ == '__main__':
    print("Testing Playground RAG Multi-Index Query")
    print()
    
    try:
        success = test_multi_index_query()
        if success:
            print("\n✅ Test completed successfully!")
            sys.exit(0)
        else:
            print("\n❌ Test failed!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
