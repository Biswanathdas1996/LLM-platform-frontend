"""
Application factory and initialization with concurrency support.
Updated to use OptimizedLLMService for better performance.
"""
import os
import logging
from flask import Flask
from flask_cors import CORS
from config import config
from models.model_manager import ModelManager
from services.optimized_llm_service import OptimizedLLMService
from services.concurrency_manager import ConcurrencyManager
from DeepSeekLLM.deepseek_routes import create_deepseek_routes
from api.routes import create_api_blueprint
from api.rag_routes import create_rag_blueprint
from utils.logger import APILogger

def setup_logging(app):
    """Set up application logging."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Set specific loggers
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

def create_app(config_name=None):
    """Application factory function."""
    
    # Determine configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')
    
    app_config = config[config_name]
    
    # Create Flask app
    app = Flask(__name__)
    app.config.from_object(app_config)
    
    # Set up logging
    setup_logging(app)
    
    # Initialize API logging if enabled
    if app_config.LOG_API_CALLS:
        api_logger = APILogger(app)
    
    # Enable CORS
    CORS(app, origins=app_config.CORS_ORIGINS)
    
    # Initialize services
    model_manager = ModelManager(
        upload_folder=app_config.UPLOAD_FOLDER,
        models_json_file=app_config.MODELS_JSON_FILE
    )
    
    llm_service = OptimizedLLMService(app_config)
    
    # Initialize concurrency manager
    concurrency_manager = ConcurrencyManager(app_config)
    
    # Store services in app context for access in routes
    app.model_manager = model_manager
    app.llm_service = llm_service
    app.concurrency_manager = concurrency_manager
    
    # Warmup models if enabled
    if app_config.ENABLE_MODEL_WARMUP:
        def warmup_models_background():
            """Warmup models on application startup."""
            import asyncio
            import threading
            
            def run_warmup():
                try:
                    # Get available models for warmup
                    models_data = model_manager.update_models_list()
                    available_models = models_data.get('models', [])
                    if available_models:
                        model_paths = [
                            model_manager.get_model_path(model['name']) 
                            for model in available_models[:2]  # Warmup first 2 models
                        ]
                        
                        # Run warmup in background thread
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        loop.run_until_complete(llm_service.warmup_models(model_paths))
                        loop.close()
                        
                        logging.info("Model warmup completed successfully")
                except Exception as e:
                    logging.warning(f"Model warmup failed: {e}")
            
            # Run warmup in background thread to avoid blocking startup
            warmup_thread = threading.Thread(target=run_warmup, daemon=True)
            warmup_thread.start()
        
        # Start warmup in background after app creation
        app.warmup_models_background = warmup_models_background

    # Register blueprints
    api_blueprint = create_api_blueprint(app_config, model_manager, llm_service)
    app.register_blueprint(api_blueprint)
    
    # Register RAG blueprint
    rag_blueprint = create_rag_blueprint(app_config)
    app.register_blueprint(rag_blueprint)
    
    # Register DeepSeek blueprint
    deepseek_blueprint = create_deepseek_routes(app_config)
    app.register_blueprint(deepseek_blueprint)
    
    # Root endpoint with API documentation
    @app.route('/', methods=['GET'])
    def api_info():
        """API information and available endpoints."""
        from flask import jsonify
        return jsonify({
            "service": "Local LLM API",
            "version": "2.0.0",
            "status": "running",
            "api_prefix": app_config.API_PREFIX,
            "endpoints": {
                "models": {
                    "GET /api/v1/models": "List all GGUF models",
                    "POST /api/v1/models": "Upload a new GGUF model",
                    "DELETE /api/v1/models/<n>": "Delete a GGUF model",
                    "POST /api/v1/models/sync": "Sync models with filesystem"
                },
                "deepseek": {
                    "GET /api/deepseek/models": "List all DeepSeek models",
                    "GET /api/deepseek/models/<model_name>": "Get specific DeepSeek model info",
                    "POST /api/deepseek/generate": "Generate text using DeepSeek model",
                    "GET /api/deepseek/health": "DeepSeek service health check",
                    "POST /api/deepseek/test": "Test DeepSeek generation with defaults"
                },
                "generation": {
                    "POST /api/v1/generate": "Generate text using a GGUF model"
                },
                "system": {
                    "GET /api/v1/health": "Health check",
                    "POST /api/v1/cache/clear": "Clear model cache",
                    "GET /api/v1/cache/status": "Get cache status",
                    "GET /api/v1/stats": "Get service statistics",
                    "GET /api/v1/stats/concurrency": "Get concurrency statistics"
                }
            },
            "documentation": {
                "base_url": "http://localhost:5000",
                "content_type": "application/json",
                "example_requests": {
                    "upload_gguf_model": "POST /api/v1/models (with file in form-data)",
                    "list_models": "GET /api/v1/models",
                    "list_deepseek_models": "GET /api/deepseek/models",
                    "generate_text_gguf": "POST /api/v1/generate {\"question\": \"Hello\", \"model_name\": \"model-name\"}",
                    "generate_text_deepseek": "POST /api/deepseek/generate {\"model_name\": \"DeepSeek-R1-q2_k.gguf\", \"prompt\": \"Hello, how are you?\", \"max_tokens\": 200, \"temperature\": 0.7}",
                    "test_deepseek": "POST /api/deepseek/test {\"prompt\": \"What is AI?\"}"
                }
            },
        })
    
    # Cleanup function for graceful shutdown
    @app.teardown_appcontext
    def shutdown_services(error):
        """Clean up services on app shutdown."""
        if hasattr(app, 'concurrency_manager'):
            app.concurrency_manager.shutdown(wait=False)
    
    return app
