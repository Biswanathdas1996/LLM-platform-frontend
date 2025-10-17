#!/usr/bin/env python3
"""
Quick test for the optimized service - checks basic functionality.
"""

import requests
import json
import time

def quick_test():
    """Quick test of the optimized service."""
    
    print("🧪 Quick test of OptimizedLLMService...")
    
    try:
        # Test health endpoint
        response = requests.get("http://127.0.0.1:5003/api/v1/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
        
        # Test performance metrics
        response = requests.get("http://127.0.0.1:5003/api/v1/performance", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'OptimizedLLMService' in str(data):
                print("✅ OptimizedLLMService is active!")
                print(f"   🚀 LangChain removed: {data.get('optimization_status', {}).get('langchain_removed', False)}")
                print(f"   💾 Memory mapping: {data.get('optimization_status', {}).get('memory_mapping_enabled', False)}")
            else:
                print("⚠️  Service running but optimization status unclear")
        else:
            print(f"❌ Performance metrics failed: {response.status_code}")
            return
        
        print("\n🎉 OptimizedLLMService is running successfully!")
        print("You can now test text generation in the playground.")
        
    except Exception as e:
        print(f"❌ Error testing service: {e}")

if __name__ == "__main__":
    quick_test()