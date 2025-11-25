"""
Ollama Teacher Integration for ZEGA
Adds local Ollama models as teachers in the ensemble
"""
import asyncio
import httpx
import json
from typing import Dict, Any, Optional

class OllamaTeacher:
    def __init__(self, model_name: str, base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"
        
    async def generate(self, prompt: str, system: str = None) -> str:
        """
        Generate text using Ollama model.
        
        Args:
            prompt: The user prompt
            system: Optional system message
            
        Returns:
            Generated text content
        """
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "top_k": 40,
                    "num_predict": 2048,  # Max tokens
                }
            }
            
            # Add system message if provided
            if system:
                payload["system"] = system
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
                
        except httpx.TimeoutException:
            raise Exception(f"Ollama timeout for {self.model_name}")
        except httpx.ConnectError:
            raise Exception(f"Cannot connect to Ollama at {self.base_url}. Is Ollama running?")
        except Exception as e:
            raise Exception(f"Ollama error for {self.model_name}: {str(e)}")
    
    async def is_available(self) -> bool:
        """Check if this model is available in Ollama."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return any(m.get("name", "").startswith(self.model_name) for m in models)
        except:
            pass
        return False

