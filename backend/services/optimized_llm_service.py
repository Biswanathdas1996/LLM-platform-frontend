"""
Optimized LLM service for handling language model operations without LangChain overhead.
Direct llama-cpp-python implementation for maximum efficiency and performance.
"""
import asyncio
import logging
import time
import gc
import threading
from typing import Dict, Any, Optional, AsyncGenerator
from llama_cpp import Llama
from .model_pool import ModelInstance
import torch

logger = logging.getLogger(__name__)

class OptimizedModelInstance:
    """Optimized model instance without LangChain wrapper."""
    
    def __init__(self, model: Llama, model_path: str):
        self.model = model
        self.model_path = model_path
        self.usage_count = 0
        self.last_used = time.time()
        self.lock = threading.Lock()
    
    def update_usage(self):
        """Update usage statistics."""
        with self.lock:
            self.usage_count += 1
            self.last_used = time.time()

class OptimizedModelPool:
    """Optimized model pool manager for direct llama-cpp-python models."""
    
    def __init__(self, max_models: int = 3):
        self.max_models = max_models
        self.models = {}
        self.model_usage = {}
        self.lock = threading.Lock()
    
    def get_or_load_model(self, model_path: str, **params) -> OptimizedModelInstance:
        """Get existing model or load new one with LRU eviction."""
        with self.lock:
            if model_path in self.models:
                instance = self.models[model_path]
                instance.update_usage()
                return instance
            
            # If at capacity, remove least recently used model
            if len(self.models) >= self.max_models:
                self._evict_lru_model()
            
            # Load new model with optimizations
            model = self._create_optimized_model(model_path, **params)
            instance = OptimizedModelInstance(model, model_path)
            
            self.models[model_path] = instance
            logger.info(f"Loaded optimized model: {model_path}")
            
            return instance
    
    def _create_optimized_model(self, model_path: str, **params) -> Llama:
        """Create optimized Llama model with best performance settings and error handling."""
        # Get file size to estimate memory requirements
        import os
        file_size_gb = os.path.getsize(model_path) / (1024**3)
        
        # Adjust parameters based on model size
        if file_size_gb > 10:  # Large models (>10GB)
            default_params = {
                'n_gpu_layers': 0,       # Use CPU for very large models to avoid memory issues
                'n_ctx': 2048,           # Smaller context for large models
                'n_batch': 256,          # Smaller batch size
                'n_threads': 6,          # Fewer threads
                'verbose': False,
                'use_mmap': True,
                'use_mlock': False,      # Don't lock memory for large models
                'f16_kv': True,
                'logits_all': False,
            }
        elif file_size_gb > 5:  # Medium models (5-10GB)
            default_params = {
                'n_gpu_layers': 10,      # Partial GPU offload
                'n_ctx': 3072,           # Medium context
                'n_batch': 384,          # Medium batch size
                'n_threads': 8,
                'verbose': False,
                'use_mmap': True,
                'use_mlock': True,
                'f16_kv': True,
                'logits_all': False,
            }
        else:  # Small models (<5GB)
            default_params = {
                'n_gpu_layers': -1,      # Use all GPU layers for small models
                'n_ctx': 4096,           # Full context
                'n_batch': 512,          # Full batch size
                'n_threads': 8,
                'verbose': False,
                'use_mmap': True,
                'use_mlock': True,
                'f16_kv': True,
                'logits_all': False,
            }
        
        # Override defaults with provided params
        model_params = {**default_params, **params}
        model_params['model_path'] = model_path
        
        logger.info(f"Creating optimized model ({file_size_gb:.1f}GB) with params: {model_params}")
        
        try:
            return Llama(**model_params)
        except Exception as e:
            # Fallback to safer parameters if initial creation fails
            logger.warning(f"Initial model creation failed: {e}")
            logger.info("Trying with safer parameters...")
            
            fallback_params = {
                'model_path': model_path,
                'n_gpu_layers': 0,       # CPU only
                'n_ctx': 1024,           # Minimal context
                'n_batch': 128,          # Minimal batch
                'n_threads': 4,          # Fewer threads
                'verbose': False,
                'use_mmap': True,
                'use_mlock': False,      # Don't lock memory
                'f16_kv': False,         # Use full precision
                'logits_all': False,
            }
            
            try:
                return Llama(**fallback_params)
            except Exception as fallback_error:
                logger.error(f"Model creation failed even with fallback parameters: {fallback_error}")
                raise
    
    def _evict_lru_model(self):
        """Remove least recently used model to free memory."""
        if not self.models:
            return
        
        lru_path = min(self.models.keys(), 
                      key=lambda path: self.models[path].last_used)
        
        logger.info(f"Evicting LRU model: {lru_path}")
        
        # Cleanup
        del self.models[lru_path]
        
        # Force garbage collection
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def clear_all(self):
        """Clear all loaded models."""
        with self.lock:
            self.models.clear()
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("Cleared all models from optimized pool")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pool statistics."""
        with self.lock:
            return {
                'total_models': len(self.models),
                'max_models': self.max_models,
                'model_paths': list(self.models.keys()),
                'usage_stats': {
                    path: {
                        'usage_count': instance.usage_count,
                        'last_used': instance.last_used
                    }
                    for path, instance in self.models.items()
                }
            }

class OptimizedLLMService:
    """Highly optimized LLM service without LangChain overhead."""
    
    def __init__(self, config):
        self.config = config
        self.model_pool = OptimizedModelPool(max_models=3)
        self._generation_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'concurrent_requests': 0,
            'avg_processing_time': 0.0,
            'total_tokens_generated': 0
        }
        self._warmup_complete = False
    
    def create_optimized_prompt(self, question: str, template: str = None) -> str:
        """Create prompt without LangChain PromptTemplate overhead."""
        if template is None:
            template = "Question: {question}\n\nAnswer:"
        return template.format(question=question)
    
    async def warmup_models(self, model_paths: list[str]):
        """Pre-load and warm up models for faster first response with error handling."""
        logger.info(f"Warming up {len(model_paths)} models...")
        
        successful_warmups = 0
        for model_path in model_paths:
            try:
                # Check if model file exists and get size
                import os
                if not os.path.exists(model_path):
                    logger.warning(f"Model file not found: {model_path}")
                    continue
                
                file_size_gb = os.path.getsize(model_path) / (1024**3)
                logger.info(f"Warming up model: {model_path} ({file_size_gb:.1f}GB)")
                
                # Skip very large models during warmup to avoid memory issues
                if file_size_gb > 15:
                    logger.info(f"Skipping warmup for large model ({file_size_gb:.1f}GB): {model_path}")
                    continue
                
                instance = self.model_pool.get_or_load_model(model_path)
                
                # Run a simple dummy inference to warm up GPU kernels
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: instance.model("Test", max_tokens=1, temperature=0.1)
                )
                
                successful_warmups += 1
                logger.info(f"Successfully warmed up model: {model_path}")
                
            except Exception as e:
                logger.warning(f"Failed to warm up model {model_path}: {e}")
                # Continue with other models instead of failing completely
                continue
        
        self._warmup_complete = True
        logger.info(f"Model warmup complete: {successful_warmups}/{len(model_paths)} models warmed up successfully")
    
    async def generate_response(
        self,
        question: str,
        model_name: str,
        model_path: str,
        template: Optional[str] = None,
        **params
    ) -> Dict[str, Any]:
        """Generate response using optimized direct inference."""
        
        start_time = time.time()
        self._generation_stats['total_requests'] += 1
        self._generation_stats['concurrent_requests'] += 1
        
        try:
            # Get or load model from optimized pool
            instance = self.model_pool.get_or_load_model(
                model_path=model_path,
                n_gpu_layers=params.get('n_gpu_layers', -1),
                n_ctx=params.get('n_ctx', 4096),
                n_batch=params.get('n_batch', 512),
                temperature=params.get('temperature', 0.7)
            )
            
            # Create prompt efficiently without LangChain
            prompt = self.create_optimized_prompt(question, template)
            
            # Prepare generation parameters with safety limits
            generation_params = {
                'max_tokens': min(params.get('max_tokens', 200), 1000),  # Cap max tokens
                'temperature': max(0.1, min(params.get('temperature', 0.7), 2.0)),  # Safe temperature range
                'top_p': max(0.1, min(params.get('top_p', 0.9), 1.0)),
                'top_k': max(1, min(params.get('top_k', 40), 100)),
                'repeat_penalty': max(1.0, min(params.get('repeat_penalty', 1.1), 1.5)),
                'echo': False,
                'stop': params.get('stop', ["</s>", "\n\nQuestion:", "\n\nHuman:", "\n\n"])
            }
            
            logger.info(f"Generating response for: {question[:50]}...")
            
            # Generate with optimal performance and timeout protection
            try:
                result = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: instance.model(prompt, **generation_params)
                    ),
                    timeout=7200.0  # 2 hour timeout (7200 seconds)
                )
            except asyncio.TimeoutError:
                raise Exception("Generation timed out after 2 hours")
            
            processing_time = time.time() - start_time
            
            # Extract response and metadata
            response_text = result['choices'][0]['text'].strip()
            tokens_generated = result['usage']['completion_tokens']
            total_tokens = result['usage']['total_tokens']
            
            # Update statistics
            self._update_stats(processing_time, tokens_generated, success=True)
            
            logger.info(f"Response generated in {processing_time:.2f}s, {tokens_generated} tokens")
            
            return {
                "success": True,
                "response": response_text,
                "processing_time": processing_time,
                "token_count": tokens_generated,
                "total_tokens": total_tokens,
                "model_used": model_name,
                "model_path": model_path,
                "efficiency_score": tokens_generated / processing_time if processing_time > 0 else 0,
                "pool_stats": self.model_pool.get_stats()
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            self._update_stats(processing_time, 0, success=False)
            
            logger.error(f"Error in optimized generation: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": processing_time,
                "model_used": model_name,
                "question": question[:100] + "..." if len(question) > 100 else question
            }
        finally:
            self._generation_stats['concurrent_requests'] -= 1
    
    async def generate_stream(
        self,
        question: str,
        model_name: str,
        model_path: str,
        template: Optional[str] = None,
        **params
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate streaming response for real-time output."""
        
        try:
            instance = self.model_pool.get_or_load_model(model_path, **params)
            prompt = self.create_optimized_prompt(question, template)
            
            generation_params = {
                'max_tokens': params.get('max_tokens', 200),
                'temperature': params.get('temperature', 0.7),
                'top_p': params.get('top_p', 0.9),
                'stream': True,  # Enable streaming
                'echo': False
            }
            
            stream = instance.model(prompt, **generation_params)
            
            for output in stream:
                token = output['choices'][0]['text']
                yield {
                    "token": token,
                    "finished": output['choices'][0]['finish_reason'] is not None
                }
                await asyncio.sleep(0)  # Allow other tasks to run
                
        except Exception as e:
            yield {"error": str(e), "finished": True}
    
    async def batch_generate(
        self,
        requests: list[Dict[str, Any]],
        batch_size: int = 4
    ) -> list[Dict[str, Any]]:
        """Process multiple generation requests in batches."""
        
        results = []
        
        for i in range(0, len(requests), batch_size):
            batch = requests[i:i + batch_size]
            
            # Process batch concurrently
            batch_tasks = [
                self.generate_response(**request)
                for request in batch
            ]
            
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Handle exceptions in batch results
            for result in batch_results:
                if isinstance(result, Exception):
                    results.append({"success": False, "error": str(result)})
                else:
                    results.append(result)
        
        return results
    
    def _update_stats(self, processing_time: float, tokens_generated: int, success: bool):
        """Update generation statistics."""
        if success:
            self._generation_stats['successful_requests'] += 1
            self._generation_stats['total_tokens_generated'] += tokens_generated
        else:
            self._generation_stats['failed_requests'] += 1
        
        # Update average processing time
        total_completed = (self._generation_stats['successful_requests'] + 
                          self._generation_stats['failed_requests'])
        
        if total_completed > 0:
            current_avg = self._generation_stats['avg_processing_time']
            self._generation_stats['avg_processing_time'] = (
                (current_avg * (total_completed - 1) + processing_time) / total_completed
            )
    
    def clear_cache(self) -> None:
        """Clear all model pools and reset statistics."""
        self.model_pool.clear_all()
        self._generation_stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'concurrent_requests': 0,
            'avg_processing_time': 0.0,
            'total_tokens_generated': 0
        }
        logger.info("Optimized LLM service cache cleared")
    
    def get_cached_models(self) -> list[str]:
        """Get list of currently cached models."""
        return list(self.model_pool.models.keys())
    
    def get_service_stats(self) -> Dict[str, Any]:
        """Get comprehensive service statistics."""
        pool_stats = self.model_pool.get_stats()
        
        return {
            'generation_stats': self._generation_stats.copy(),
            'pool_stats': pool_stats,
            'service_status': {
                'active': True,
                'optimized': True,
                'warmup_complete': self._warmup_complete,
                'total_cached_models': pool_stats['total_models'],
                'service_type': 'OptimizedLLMService'
            },
            'performance_metrics': {
                'avg_tokens_per_second': (
                    self._generation_stats['total_tokens_generated'] / 
                    self._generation_stats['avg_processing_time']
                    if self._generation_stats['avg_processing_time'] > 0 else 0
                ),
                'success_rate': (
                    self._generation_stats['successful_requests'] / 
                    self._generation_stats['total_requests']
                    if self._generation_stats['total_requests'] > 0 else 0
                )
            }
        }