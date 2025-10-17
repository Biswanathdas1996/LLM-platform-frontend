#!/usr/bin/env python3
"""
Optimized startup script for the Local LLM API with performance monitoring.
"""

import asyncio
import logging
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_optimized_dependencies():
    """Check if optimized dependencies are available."""
    missing = []
    
    try:
        import llama_cpp
        logger.info("✓ llama-cpp-python available")
    except ImportError:
        missing.append("llama-cpp-python")
    
    try:
        import torch
        if torch.cuda.is_available():
            logger.info(f"✓ PyTorch with CUDA available ({torch.cuda.device_count()} GPUs)")
        else:
            logger.info("✓ PyTorch available (CPU only)")
    except ImportError:
        missing.append("torch")
    
    try:
        from services.optimized_llm_service import OptimizedLLMService
        logger.info("✓ OptimizedLLMService available")
    except ImportError as e:
        logger.error(f"❌ OptimizedLLMService not available: {e}")
        missing.append("OptimizedLLMService")
    
    if missing:
        logger.error(f"Missing dependencies: {missing}")
        logger.error("Install optimized dependencies with:")
        logger.error("pip install -r requirements_optimized.txt")
        return False
    
    return True

async def test_optimized_service():
    """Quick test of the optimized service."""
    try:
        from config import config
        from models.model_manager import ModelManager
        from services.optimized_llm_service import OptimizedLLMService
        
        app_config = config['default']
        
        # Check for available models
        model_manager = ModelManager(
            upload_folder=app_config.UPLOAD_FOLDER,
            models_json_file=app_config.MODELS_JSON_FILE
        )
        
        models_data = model_manager.update_models_list()
        available_models = models_data.get('models', [])
        if not available_models:
            logger.warning("⚠️  No models available for testing")
            logger.info("Upload a model through the web interface first")
            return True
        
        # Test optimized service
        service = OptimizedLLMService(app_config)
        
        test_model = available_models[0]
        model_path = model_manager.get_model_path(test_model['name'])
        
        logger.info(f"🧪 Testing with model: {test_model['name']}")
        
        result = await service.generate_response(
            question="Hello, this is a test.",
            model_name=test_model['name'],
            model_path=model_path,
            max_tokens=20,
            temperature=0.1
        )
        
        if result.get('success'):
            logger.info("✅ OptimizedLLMService test successful!")
            logger.info(f"Response time: {result.get('processing_time', 0):.3f}s")
            logger.info(f"Tokens generated: {result.get('token_count', 0)}")
            logger.info(f"Efficiency score: {result.get('efficiency_score', 0):.2f}")
        else:
            logger.error(f"❌ Test failed: {result.get('error')}")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Service test failed: {e}")
        return False

def main():
    """Main startup function."""
    
    print("🚀 Starting Local LLM API with OptimizedLLMService...")
    print("="*60)
    
    # Check dependencies
    if not check_optimized_dependencies():
        print("❌ Dependency check failed!")
        sys.exit(1)
    
    # Test service
    print("\n🧪 Testing OptimizedLLMService...")
    test_success = asyncio.run(test_optimized_service())
    
    if not test_success:
        print("❌ Service test failed!")
        sys.exit(1)
    
    print("\n✅ All checks passed! Starting Flask application...")
    print("📊 Performance monitoring available at: /api/v1/performance")
    print("📈 Service stats available at: /api/v1/cache/status")
    print("="*60)
    
    # Start Flask app
    try:
        from app_factory import create_app
        
        app = create_app('development')
        
        print(f"\n🌐 Starting server on http://localhost:5000")
        print(f"📚 API documentation at: http://localhost:5000")
        print(f"🎮 Playground available in frontend")
        
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=False,  # Disable debug for better performance
            threaded=True,
            use_reloader=False  # Disable reloader for production-like performance
        )
        
    except KeyboardInterrupt:
        print(f"\n👋 Shutting down gracefully...")
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()