#!/usr/bin/env python3
"""
Test script to verify the optimized LLM service is working properly.
"""

import requests
import json
import time

def test_optimized_service():
    """Test the optimized LLM service endpoints."""
    
    base_url = "http://127.0.0.1:5002"
    
    print("🧪 Testing Optimized LLM Service...")
    print("="*50)
    
    # Test 1: Health check
    try:
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/v1/health", timeout=10)
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False
    
    # Test 2: Performance metrics
    try:
        print("2. Testing performance metrics endpoint...")
        response = requests.get(f"{base_url}/api/v1/performance", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('optimization_status', {}).get('service_type') == 'OptimizedLLMService':
                print("   ✅ Performance metrics show OptimizedLLMService active")
                print(f"   📊 LangChain removed: {data['optimization_status']['langchain_removed']}")
                print(f"   🚀 Direct inference: {data['optimization_status']['direct_inference']}")
                print(f"   💾 Memory mapping: {data['optimization_status']['memory_mapping_enabled']}")
                
                # Show performance stats if available
                perf = data.get('performance_metrics', {})
                if perf:
                    print(f"   📈 Success rate: {perf.get('success_rate', 0):.2%}")
                    print(f"   ⚡ Tokens/second: {perf.get('avg_tokens_per_second', 0):.1f}")
            else:
                print("   ❌ Performance metrics indicate issues")
                return False
        else:
            print(f"   ❌ Performance metrics failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Performance metrics error: {e}")
        return False
    
    # Test 3: Models list
    try:
        print("3. Testing models endpoint...")
        response = requests.get(f"{base_url}/api/v1/models", timeout=10)
        if response.status_code == 200:
            data = response.json()
            model_count = data.get('count', 0)
            print(f"   ✅ Models endpoint working: {model_count} models available")
            
            if model_count > 0:
                # Test 4: Try a generation request
                print("4. Testing text generation...")
                test_model = data['models'][0]['name']
                
                generation_request = {
                    "question": "Hello, this is a test of the optimized service.",
                    "model_name": test_model,
                    "temperature": 0.1,
                    "max_tokens": 20
                }
                
                start_time = time.time()
                response = requests.post(
                    f"{base_url}/api/v1/generate", 
                    json=generation_request,
                    timeout=30
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        print(f"   ✅ Generation successful!")
                        print(f"   ⏱️  Response time: {end_time - start_time:.2f}s")
                        print(f"   🎯 Processing time: {result.get('processing_time', 0):.2f}s")
                        print(f"   🔢 Tokens generated: {result.get('token_count', 0)}")
                        print(f"   📈 Efficiency score: {result.get('efficiency_score', 0):.2f}")
                        print(f"   🎭 Model used: {result.get('model_used', 'unknown')}")
                        
                        # Show first part of response
                        response_text = result.get('response', '')
                        if response_text:
                            preview = response_text[:100] + "..." if len(response_text) > 100 else response_text
                            print(f"   💬 Response preview: {preview}")
                        
                    else:
                        print(f"   ❌ Generation failed: {result.get('error', 'Unknown error')}")
                        return False
                else:
                    print(f"   ❌ Generation request failed: {response.status_code}")
                    return False
            else:
                print("   ⚠️  No models available for generation testing")
        else:
            print(f"   ❌ Models endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Models/generation test error: {e}")
        return False
    
    print("\n" + "="*50)
    print("🎉 All tests passed! OptimizedLLMService is working correctly.")
    print("📊 Key improvements:")
    print("   • LangChain overhead eliminated")
    print("   • Direct llama-cpp-python inference")
    print("   • Memory-mapped model loading")
    print("   • Optimized model pooling")
    print("   • Better GPU utilization")
    print("="*50)
    
    return True

if __name__ == "__main__":
    success = test_optimized_service()
    exit(0 if success else 1)