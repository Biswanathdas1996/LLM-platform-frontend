"""
Test script to verify list_indexes() returns document names
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from services.rag_service import RAGService
import tempfile
import shutil

def test_list_indexes_with_documents():
    """Test that list_indexes returns document names"""
    
    # Create temporary directory for testing
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Initialize RAG service
        print("Initializing RAG service...")
        rag_service = RAGService(storage_path=temp_dir)
        
        # Create test indexes
        print("\n1. Creating test indexes...")
        rag_service.create_index('medical')
        rag_service.create_index('technology')
        print("✅ Created 2 test indexes")
        
        # Create test documents (using TXT files for easy testing)
        test_docs = [
            ('medical', 'patient_records.txt', 'This is a medical document about patient care and treatment protocols.'),
            ('medical', 'treatment_guidelines.txt', 'Medical treatment guidelines for healthcare professionals.'),
            ('technology', 'ai_research.txt', 'Research paper on artificial intelligence and machine learning.'),
            ('technology', 'cloud_computing.txt', 'Comprehensive guide to cloud computing technologies and best practices.')
        ]
        
        print("\n2. Uploading test documents...")
        for index_name, filename, content in test_docs:
            # Create temporary file
            temp_file = os.path.join(temp_dir, filename)
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Upload to index
            result = rag_service.upload_document(index_name, temp_file, filename)
            if 'error' in result:
                print(f"❌ Failed to upload {filename}: {result['error']}")
            else:
                print(f"✅ Uploaded {filename} to {index_name}")
        
        # Test list_indexes
        print("\n3. Testing list_indexes()...")
        result = rag_service.list_indexes()
        
        print("\n" + "="*70)
        print("LIST INDEXES RESULT:")
        print("="*70)
        
        for index in result['indexes']:
            print(f"\nIndex: {index['name']}")
            print(f"  Created: {index['created_at']}")
            print(f"  Stats:")
            print(f"    - Total Documents: {index['stats']['total_documents']}")
            print(f"    - Total Chunks: {index['stats']['total_chunks']}")
            print(f"  Documents:")
            if 'documents' in index:
                for doc_name in index['documents']:
                    print(f"    - {doc_name}")
            else:
                print("    ⚠️  No 'documents' field found!")
        
        # Verify documents field exists
        print("\n" + "="*70)
        print("VERIFICATION:")
        print("="*70)
        
        all_passed = True
        for index in result['indexes']:
            if 'documents' not in index:
                print(f"❌ Index '{index['name']}' missing 'documents' field")
                all_passed = False
            elif not isinstance(index['documents'], list):
                print(f"❌ Index '{index['name']}' 'documents' is not a list")
                all_passed = False
            else:
                expected_docs = [doc[1] for doc in test_docs if doc[0] == index['name']]
                if set(index['documents']) == set(expected_docs):
                    print(f"✅ Index '{index['name']}' has correct documents: {index['documents']}")
                else:
                    print(f"❌ Index '{index['name']}' documents mismatch")
                    print(f"   Expected: {expected_docs}")
                    print(f"   Got: {index['documents']}")
                    all_passed = False
        
        if all_passed:
            print("\n✅ ALL TESTS PASSED!")
            print("\n📋 Summary:")
            print("   - list_indexes() now includes document names")
            print("   - Each index shows which documents have been uploaded")
            print("   - Frontend can display document names for each index")
        else:
            print("\n❌ SOME TESTS FAILED")
        
        return all_passed
        
    finally:
        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"\n🧹 Cleaned up temporary directory: {temp_dir}")

if __name__ == "__main__":
    print("="*70)
    print("Testing list_indexes() with Document Names")
    print("="*70)
    
    success = test_list_indexes_with_documents()
    
    if success:
        print("\n" + "="*70)
        print("API USAGE EXAMPLE:")
        print("="*70)
        print("""
GET /api/rag/indexes

Response:
{
  "indexes": [
    {
      "name": "medical",
      "created_at": "2024-01-15T10:30:00",
      "stats": {
        "total_documents": 2,
        "total_chunks": 15,
        "total_size": 1024
      },
      "documents": [
        "patient_records.txt",
        "treatment_guidelines.pdf"
      ]
    },
    {
      "name": "technology",
      "created_at": "2024-01-15T10:30:00",
      "stats": {
        "total_documents": 2,
        "total_chunks": 12,
        "total_size": 2048
      },
      "documents": [
        "ai_research.pdf",
        "cloud_computing.txt"
      ]
    }
  ]
}
        """)
    
    sys.exit(0 if success else 1)
