#!/usr/bin/env python3
"""
Simple startup script for testing the optimized LLM service.
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def start_optimized_service():
    """Start the optimized service directly."""
    
    try:
        print("🚀 Starting OptimizedLLMService...")
        
        # Import after adding to path
        from app_factory import create_app
        
        # Create app
        app = create_app('development')
        
        # Check if warmup is enabled
        if hasattr(app, 'warmup_models_background'):
            print("🔥 Starting model warmup...")
            app.warmup_models_background()
        
        print("✅ App created successfully")
        print("🌐 Starting Flask server on http://127.0.0.1:5003")
        print("📚 API documentation available at the root endpoint")
        print("🎮 Test the playground in your frontend")
        print("Press Ctrl+C to stop")
        
        # Start server with explicit settings
        app.run(
            host='127.0.0.1',
            port=5003,
            debug=False,
            use_reloader=False,
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    start_optimized_service()