"""
Configuration settings for the Local LLM application.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration class."""
    
    # Flask settings
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    
    # Upload settings
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', './models')
    MODELS_JSON_FILE = os.environ.get('MODELS_JSON_FILE', './models/models_list.json')
    ALLOWED_EXTENSIONS = {'gguf'}
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024 * 1024))
    
   
    # LLM settings
    DEFAULT_N_GPU_LAYERS = int(os.environ.get('DEFAULT_N_GPU_LAYERS', 40))
    DEFAULT_N_BATCH = int(os.environ.get('DEFAULT_N_BATCH', 512))
    DEFAULT_TEMPERATURE = float(os.environ.get('DEFAULT_TEMPERATURE', 0.6))
    DEFAULT_VERBOSE = os.environ.get('DEFAULT_VERBOSE', 'True').lower() == 'true'
    
    # DeepSeek specific settings for large context handling
    DEEPSEEK_MAX_CONTEXT = int(os.environ.get('DEEPSEEK_MAX_CONTEXT', 32768))  # Maximum context size
    DEEPSEEK_DEFAULT_CONTEXT = int(os.environ.get('DEEPSEEK_DEFAULT_CONTEXT', 8192))  # Default context size
    DEEPSEEK_CHUNK_SIZE = int(os.environ.get('DEEPSEEK_CHUNK_SIZE', 4096))  # Chunk size for large inputs
    DEEPSEEK_OVERLAP_SIZE = int(os.environ.get('DEEPSEEK_OVERLAP_SIZE', 256))  # Overlap between chunks
    DEEPSEEK_MAX_THREADS = int(os.environ.get('DEEPSEEK_MAX_THREADS', 16))  # Maximum CPU threads
    DEEPSEEK_USE_MMAP = os.environ.get('DEEPSEEK_USE_MMAP', 'True').lower() == 'true'  # Use memory mapping
    DEEPSEEK_STREAMING_ENABLED = os.environ.get('DEEPSEEK_STREAMING_ENABLED', 'True').lower() == 'true'  # Enable streaming
    DEEPSEEK_CACHE_ENABLED = os.environ.get('DEEPSEEK_CACHE_ENABLED', 'True').lower() == 'true'  # Enable model caching
    
    # API settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    API_PREFIX = os.environ.get('API_PREFIX', '/api/v1')
    
    # Logging settings
    LOG_DIR = os.environ.get('LOG_DIR', './logs')
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', 10 * 1024 * 1024))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', 5))
    LOG_API_CALLS = os.environ.get('LOG_API_CALLS', 'True').lower() == 'true'
    
    # Concurrency settings
    MAX_CONCURRENT_REQUESTS = int(os.environ.get('MAX_CONCURRENT_REQUESTS', 10))
    MAX_WORKERS = int(os.environ.get('MAX_WORKERS', 4))
    MODEL_POOL_SIZE = int(os.environ.get('MODEL_POOL_SIZE', 3))
    REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 300))  # 5 minutes
    QUEUE_TIMEOUT = int(os.environ.get('QUEUE_TIMEOUT', 30))  # 30 seconds wait for queue
    
    # Performance settings
    ENABLE_MODEL_PRELOADING = os.environ.get('ENABLE_MODEL_PRELOADING', 'False').lower() == 'true'
    ENABLE_REQUEST_QUEUE = os.environ.get('ENABLE_REQUEST_QUEUE', 'True').lower() == 'true'
    ENABLE_ASYNC_PROCESSING = os.environ.get('ENABLE_ASYNC_PROCESSING', 'True').lower() == 'true'
    
    # Optimized LLM settings
    ENABLE_MODEL_WARMUP = os.environ.get('ENABLE_MODEL_WARMUP', 'True').lower() == 'true'
    MAX_CACHED_MODELS = int(os.environ.get('MAX_CACHED_MODELS', 3))
    ENABLE_MEMORY_MAPPING = os.environ.get('ENABLE_MEMORY_MAPPING', 'True').lower() == 'true'
    ENABLE_MEMORY_LOCK = os.environ.get('ENABLE_MEMORY_LOCK', 'True').lower() == 'true'
    OPTIMIZATION_LEVEL = os.environ.get('OPTIMIZATION_LEVEL', 'high')  # low, medium, high
    
    # RAG Performance settings
    RAG_CHUNK_SIZE = int(os.environ.get('RAG_CHUNK_SIZE', 150))  # Reduced from 256 for faster retrieval
    RAG_CHUNK_OVERLAP = int(os.environ.get('RAG_CHUNK_OVERLAP', 30))  # Reduced from 50
    RAG_DEFAULT_K = int(os.environ.get('RAG_DEFAULT_K', 3))  # Reduced from 5 for faster responses
    RAG_MAX_K = int(os.environ.get('RAG_MAX_K', 10))  # Maximum number of results to retrieve
    RAG_QUERY_TIMEOUT = int(os.environ.get('RAG_QUERY_TIMEOUT', 5))  # Timeout in seconds for RAG queries
    RAG_MAX_CONTEXT_LENGTH = int(os.environ.get('RAG_MAX_CONTEXT_LENGTH', 2000))  # Max context chars to include
    RAG_ENABLE_CACHING = os.environ.get('RAG_ENABLE_CACHING', 'True').lower() == 'true'
    RAG_CACHE_SIZE = int(os.environ.get('RAG_CACHE_SIZE', 100))  # Number of queries to cache
    RAG_MIN_RELEVANCE_SCORE = float(os.environ.get('RAG_MIN_RELEVANCE_SCORE', 0.3))  # Filter low relevance results

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = False  # Disable debug mode to avoid startup issues

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY set for production environment")

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
