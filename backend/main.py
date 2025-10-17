"""
Main application entry point.
"""
import os
import sys
from app_factory import create_app


if __name__ == '__main__':
    try:
        # Get configuration from environment
        config_name = os.environ.get('FLASK_ENV', 'development')
        host = os.environ.get('HOST', '127.0.0.1')
        port = int(os.environ.get('PORT', 5000))
        
        # Create application
        app = create_app(config_name)
        
        # Trigger warmup if enabled
        if hasattr(app, 'warmup_models_background'):
            app.warmup_models_background()
        
        # Run application
        print(f"Starting server on {host}:{port}")
        print("Press Ctrl+C to stop the server")
        
        app.run(
            host=host,
            port=port,
            debug=False,  # Force disable debug mode
            use_reloader=False,
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n👋 Shutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Failed to start application: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
