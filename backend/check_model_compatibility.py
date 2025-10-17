#!/usr/bin/env python3
"""
Model compatibility checker for the OptimizedLLMService.
This script checks GGUF models for potential issues and provides recommendations.
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelCompatibilityChecker:
    """Check GGUF model compatibility and provide optimization recommendations."""
    
    def __init__(self, models_dir: str = "./models"):
        self.models_dir = Path(models_dir)
        
    def check_model_file(self, model_path: Path) -> Dict[str, Any]:
        """Check a single model file for compatibility issues."""
        
        if not model_path.exists():
            return {"error": "File not found", "compatible": False}
        
        file_size_bytes = model_path.stat().st_size
        file_size_gb = file_size_bytes / (1024**3)
        
        # Basic compatibility assessment
        compatibility = {
            "file_path": str(model_path),
            "file_size_gb": round(file_size_gb, 2),
            "compatible": True,
            "warnings": [],
            "recommendations": [],
            "suggested_params": {}
        }
        
        # Size-based recommendations
        if file_size_gb > 20:
            compatibility["warnings"].append("Very large model (>20GB) - may cause memory issues")
            compatibility["recommendations"].append("Use CPU-only inference (n_gpu_layers=0)")
            compatibility["recommendations"].append("Reduce context size (n_ctx=1024)")
            compatibility["suggested_params"] = {
                "n_gpu_layers": 0,
                "n_ctx": 1024,
                "n_batch": 128,
                "use_mlock": False
            }
        elif file_size_gb > 10:
            compatibility["warnings"].append("Large model (>10GB) - may need memory optimization")
            compatibility["recommendations"].append("Limit GPU layers (n_gpu_layers=10)")
            compatibility["recommendations"].append("Use moderate context size (n_ctx=2048)")
            compatibility["suggested_params"] = {
                "n_gpu_layers": 10,
                "n_ctx": 2048,
                "n_batch": 256,
                "use_mlock": True
            }
        elif file_size_gb > 5:
            compatibility["recommendations"].append("Medium model - partial GPU offload recommended")
            compatibility["suggested_params"] = {
                "n_gpu_layers": 20,
                "n_ctx": 3072,
                "n_batch": 384,
                "use_mlock": True
            }
        else:
            compatibility["recommendations"].append("Small model - full GPU offload safe")
            compatibility["suggested_params"] = {
                "n_gpu_layers": -1,
                "n_ctx": 4096,
                "n_batch": 512,
                "use_mlock": True
            }
        
        # Check for known problematic patterns
        model_name = model_path.name.lower()
        
        if "20b" in model_name or "30b" in model_name:
            compatibility["warnings"].append("Large parameter count model - memory intensive")
            compatibility["recommendations"].append("Consider using CPU-only inference")
        
        if "q2" in model_name:
            compatibility["recommendations"].append("Q2 quantization - very memory efficient")
        elif "q4" in model_name:
            compatibility["recommendations"].append("Q4 quantization - good balance of size/quality")
        elif "q8" in model_name:
            compatibility["warnings"].append("Q8 quantization - high memory usage")
        
        # Memory estimate
        estimated_ram_gb = file_size_gb * 1.2  # Add 20% overhead
        compatibility["estimated_ram_gb"] = round(estimated_ram_gb, 1)
        
        if estimated_ram_gb > 16:
            compatibility["warnings"].append(f"High RAM usage estimated: {estimated_ram_gb}GB")
        
        return compatibility
    
    def check_all_models(self) -> List[Dict[str, Any]]:
        """Check all GGUF models in the models directory."""
        
        if not self.models_dir.exists():
            logger.error(f"Models directory not found: {self.models_dir}")
            return []
        
        gguf_files = list(self.models_dir.glob("*.gguf"))
        
        if not gguf_files:
            logger.warning(f"No GGUF files found in {self.models_dir}")
            return []
        
        logger.info(f"Found {len(gguf_files)} GGUF models to check")
        
        results = []
        for model_file in gguf_files:
            logger.info(f"Checking: {model_file.name}")
            result = self.check_model_file(model_file)
            results.append(result)
        
        return results
    
    def print_compatibility_report(self, results: List[Dict[str, Any]]):
        """Print a formatted compatibility report."""
        
        print("\n" + "="*80)
        print("            MODEL COMPATIBILITY REPORT")
        print("="*80)
        
        compatible_count = sum(1 for r in results if r.get("compatible", False))
        
        print(f"\n📊 Summary: {compatible_count}/{len(results)} models compatible")
        
        for i, result in enumerate(results, 1):
            print(f"\n{i}. {Path(result['file_path']).name}")
            print(f"   📁 Size: {result['file_size_gb']}GB")
            print(f"   💾 Est. RAM: {result.get('estimated_ram_gb', 0)}GB")
            
            if result.get("warnings"):
                print("   ⚠️  Warnings:")
                for warning in result["warnings"]:
                    print(f"      • {warning}")
            
            if result.get("recommendations"):
                print("   💡 Recommendations:")
                for rec in result["recommendations"]:
                    print(f"      • {rec}")
            
            if result.get("suggested_params"):
                print("   ⚙️  Suggested Parameters:")
                for param, value in result["suggested_params"].items():
                    print(f"      {param}: {value}")
        
        print("\n" + "="*80)
        print("🔧 To fix memory issues:")
        print("   1. Use smaller models or CPU-only inference")
        print("   2. Reduce n_ctx (context size)")
        print("   3. Set use_mlock=False for large models")
        print("   4. Monitor memory usage during inference")
        print("="*80)

def main():
    """Main function to run compatibility check."""
    
    import sys
    import os
    
    # Add backend to path
    sys.path.insert(0, str(Path(__file__).parent))
    
    models_dir = "./models"
    if len(sys.argv) > 1:
        models_dir = sys.argv[1]
    
    checker = ModelCompatibilityChecker(models_dir)
    results = checker.check_all_models()
    
    if results:
        checker.print_compatibility_report(results)
        
        # Check for problematic models
        problematic = [r for r in results if r.get("warnings")]
        if problematic:
            print(f"\n⚠️  {len(problematic)} models may have compatibility issues.")
            print("Consider using the suggested parameters to avoid memory errors.")
        else:
            print(f"\n✅ All models appear compatible with default settings.")
    else:
        print("❌ No models found to check.")

if __name__ == "__main__":
    main()