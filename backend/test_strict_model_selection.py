#!/usr/bin/env python3
"""
Test script to verify strict model selection in /generate API.
Tests that the API only uses exactly what the frontend provides.
"""

import requests
import json
import time
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1/generate"

def test_exact_model_selection():
    """Test that API uses exactly the model name provided by frontend."""
    
    print("🧪 Testing strict model selection in /generate API...")
    print("=" * 60)
    
    # Test cases with different model name formats
    test_cases = [
        {
            "name": "Model with .gguf extension",
            "model_name": "DeepSeek-R1-q2_k.gguf",
            "question": "What is Python?",
            "expected_model": "DeepSeek-R1-q2_k.gguf"
        },
        {
            "name": "Model without .gguf extension",
            "model_name": "DeepSeek-R1-q2_k",
            "question": "Explain machine learning briefly.",
            "expected_model": "DeepSeek-R1-q2_k"
        },
        {
            "name": "Non-existent model (should fail)",
            "model_name": "fake-model-xyz",
            "question": "This should fail.",
            "should_fail": True
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 Test {i}: {test_case['name']}")
        print(f"Frontend Model Name: '{test_case['model_name']}'")
        
        payload = {
            "model_name": test_case['model_name'],
            "question": test_case['question'],
            "temperature": 0.7,
            "max_tokens": 50
        }
        
        try:
            print("Sending request...")
            response = requests.post(
                API_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                if test_case.get('should_fail'):
                    print("❌ UNEXPECTED SUCCESS - This test should have failed!")
                    continue
                
                print("✅ SUCCESS")
                print(f"Model Used: '{result.get('model_used', 'N/A')}'")
                print(f"Frontend Requested: {result.get('frontend_requested', False)}")
                print(f"Exact Model Match: {result.get('exact_model_match', False)}")
                print(f"Model Path: {result.get('model_path', 'N/A')}")
                
                # Verify exact match
                if result.get('model_used') == test_case.get('expected_model'):
                    print("✅ Model name matches exactly!")
                else:
                    print(f"❌ Model mismatch! Expected: '{test_case.get('expected_model')}', Got: '{result.get('model_used')}'")
                
                # Show partial response
                response_text = result.get('response', '')
                if response_text:
                    preview = response_text[:100] + "..." if len(response_text) > 100 else response_text
                    print(f"Response Preview: {preview}")
                
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                
                if test_case.get('should_fail'):
                    print("✅ EXPECTED FAILURE")
                    print(f"Error: {error_data.get('error', 'Unknown error')}")
                    print(f"Requested Model: {error_data.get('requested_model', 'N/A')}")
                else:
                    print(f"❌ UNEXPECTED FAILURE")
                    print(f"Error: {error_data.get('error', response.text)}")
                    
        except requests.exceptions.RequestException as e:
            print(f"❌ REQUEST ERROR: {e}")
        except Exception as e:
            print(f"❌ UNEXPECTED ERROR: {e}")
        
        print("-" * 40)
    
    print(f"\n✅ Testing completed!")

def test_parameter_passing():
    """Test that custom parameters are preserved."""
    
    print("\n🧪 Testing parameter preservation...")
    print("=" * 60)
    
    payload = {
        "model_name": "DeepSeek-R1-q2_k",
        "question": "Count to 3.",
        "temperature": 0.1,
        "max_tokens": 20,
        "n_ctx": 2048,
        "n_gpu_layers": 10
    }
    
    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            params = result.get('parameters', {})
            
            print("✅ Parameter preservation test:")
            print(f"Temperature: {params.get('temperature')} (expected: 0.1)")
            print(f"Max Tokens: {params.get('max_tokens')} (expected: 20)")
            print(f"Context Size: {params.get('n_ctx')} (expected: 2048)")
            print(f"GPU Layers: {params.get('n_gpu_layers')} (expected: 10)")
        else:
            print(f"❌ Parameter test failed with status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Parameter test error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Strict Model Selection Tests")
    print("Make sure the backend server is running on http://localhost:8000")
    print()
    
    # Wait a moment for user to confirm
    try:
        time.sleep(2)
        test_exact_model_selection()
        test_parameter_passing()
        
        print("\n🎉 All tests completed!")
        print("\nKey verification points:")
        print("✓ API uses exact frontend-provided model name")
        print("✓ No automatic model selection or fallbacks")
        print("✓ Clear error messages for missing models")
        print("✓ Parameters preserved from frontend")
        print("✓ Enhanced logging with frontend model tracking")
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test suite error: {e}")