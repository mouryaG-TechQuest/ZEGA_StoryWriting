"""
ZEGA Image Generation Core
Supports multiple free APIs:
- Stability AI (free tier)
- Hugging Face Inference API (free)
- Pollinations AI (completely free)
- Replicate (free tier)
- Local Stable Diffusion (if available)
"""

import os
import asyncio
import httpx
import base64
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime
import hashlib

@dataclass
class ImageGenerationResult:
    """Result from image generation"""
    success: bool
    image_data: Optional[bytes] = None
    image_url: Optional[str] = None
    provider: str = ""
    prompt_used: str = ""
    error: Optional[str] = None
    generation_time: float = 0.0
    model_used: str = ""

@dataclass
class SceneContext:
    """Context for scene image generation"""
    scene_title: str
    scene_description: str
    characters: List[Dict[str, Any]]  # Character details with images
    previous_scene_description: Optional[str] = None
    previous_scene_images: Optional[List[str]] = None
    user_uploaded_images: Optional[List[str]] = None
    style_preferences: Optional[str] = None
    story_genre: Optional[str] = None

class PollinationsProvider:
    """Pollinations AI - Completely free, no API key needed"""
    
    def __init__(self):
        self.base_url = "https://image.pollinations.ai/prompt"
        self.name = "pollinations"
    
    async def generate(self, prompt: str, width: int = 1024, height: int = 768) -> ImageGenerationResult:
        """Generate image using Pollinations AI"""
        import time
        start_time = time.time()
        
        try:
            # URL encode the prompt
            import urllib.parse
            encoded_prompt = urllib.parse.quote(prompt)
            
            # Pollinations uses a simple URL-based API
            image_url = f"{self.base_url}/{encoded_prompt}?width={width}&height={height}&nologo=true"
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(image_url)
                
                if response.status_code == 200:
                    return ImageGenerationResult(
                        success=True,
                        image_data=response.content,
                        image_url=image_url,
                        provider=self.name,
                        prompt_used=prompt,
                        generation_time=time.time() - start_time,
                        model_used="pollinations-ai"
                    )
                else:
                    return ImageGenerationResult(
                        success=False,
                        provider=self.name,
                        prompt_used=prompt,
                        error=f"HTTP {response.status_code}: {response.text[:200]}"
                    )
        except Exception as e:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error=str(e)
            )

class HuggingFaceImageProvider:
    """Hugging Face Inference API - Free tier available"""
    
    def __init__(self, model: str = "stabilityai/stable-diffusion-xl-base-1.0"):
        self.api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        self.model = model
        self.base_url = f"https://api-inference.huggingface.co/models/{model}"
        self.name = "huggingface"
    
    async def generate(self, prompt: str, negative_prompt: str = "") -> ImageGenerationResult:
        """Generate image using HuggingFace Inference API"""
        import time
        start_time = time.time()
        
        if not self.api_key:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error="HUGGINGFACEHUB_API_TOKEN not set"
            )
        
        try:
            payload = {
                "inputs": prompt,
                "parameters": {
                    "negative_prompt": negative_prompt or "blurry, bad quality, distorted, ugly",
                    "num_inference_steps": 30,
                    "guidance_scale": 7.5
                },
                "options": {
                    "wait_for_model": True,
                    "use_cache": True
                }
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
                
                if response.status_code == 200:
                    return ImageGenerationResult(
                        success=True,
                        image_data=response.content,
                        provider=self.name,
                        prompt_used=prompt,
                        generation_time=time.time() - start_time,
                        model_used=self.model
                    )
                elif response.status_code == 503:
                    return ImageGenerationResult(
                        success=False,
                        provider=self.name,
                        prompt_used=prompt,
                        error="Model is loading, try again in a few seconds"
                    )
                else:
                    return ImageGenerationResult(
                        success=False,
                        provider=self.name,
                        prompt_used=prompt,
                        error=f"HTTP {response.status_code}: {response.text[:200]}"
                    )
        except Exception as e:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error=str(e)
            )

class StabilityAIProvider:
    """Stability AI - Free credits on signup"""
    
    def __init__(self):
        self.api_key = os.getenv("STABILITY_API_KEY")
        self.base_url = "https://api.stability.ai/v1/generation"
        self.name = "stability"
        self.engine = "stable-diffusion-xl-1024-v1-0"
    
    async def generate(self, prompt: str, negative_prompt: str = "") -> ImageGenerationResult:
        """Generate image using Stability AI"""
        import time
        start_time = time.time()
        
        if not self.api_key:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error="STABILITY_API_KEY not set"
            )
        
        try:
            payload = {
                "text_prompts": [
                    {"text": prompt, "weight": 1.0},
                    {"text": negative_prompt or "blurry, bad quality", "weight": -1.0}
                ],
                "cfg_scale": 7,
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/{self.engine}/text-to-image",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    image_data = base64.b64decode(data["artifacts"][0]["base64"])
                    return ImageGenerationResult(
                        success=True,
                        image_data=image_data,
                        provider=self.name,
                        prompt_used=prompt,
                        generation_time=time.time() - start_time,
                        model_used=self.engine
                    )
                else:
                    return ImageGenerationResult(
                        success=False,
                        provider=self.name,
                        prompt_used=prompt,
                        error=f"HTTP {response.status_code}: {response.text[:200]}"
                    )
        except Exception as e:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error=str(e)
            )

class ReplicateProvider:
    """Replicate - Free tier with credits"""
    
    def __init__(self, model: str = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"):
        self.api_key = os.getenv("REPLICATE_API_TOKEN")
        self.model = model
        self.base_url = "https://api.replicate.com/v1/predictions"
        self.name = "replicate"
    
    async def generate(self, prompt: str, negative_prompt: str = "") -> ImageGenerationResult:
        """Generate image using Replicate"""
        import time
        start_time = time.time()
        
        if not self.api_key:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error="REPLICATE_API_TOKEN not set"
            )
        
        try:
            payload = {
                "version": self.model.split(":")[1] if ":" in self.model else self.model,
                "input": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt or "blurry, bad quality",
                    "width": 1024,
                    "height": 768
                }
            }
            
            async with httpx.AsyncClient(timeout=180.0) as client:
                # Create prediction
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers={
                        "Authorization": f"Token {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 201:
                    return ImageGenerationResult(
                        success=False,
                        provider=self.name,
                        prompt_used=prompt,
                        error=f"HTTP {response.status_code}: {response.text[:200]}"
                    )
                
                prediction = response.json()
                prediction_url = prediction["urls"]["get"]
                
                # Poll for completion
                for _ in range(60):  # Max 60 attempts (2 minutes)
                    await asyncio.sleep(2)
                    status_response = await client.get(
                        prediction_url,
                        headers={"Authorization": f"Token {self.api_key}"}
                    )
                    status_data = status_response.json()
                    
                    if status_data["status"] == "succeeded":
                        output = status_data.get("output", [])
                        if output:
                            image_url = output[0] if isinstance(output, list) else output
                            # Download the image
                            image_response = await client.get(image_url)
                            return ImageGenerationResult(
                                success=True,
                                image_data=image_response.content,
                                image_url=image_url,
                                provider=self.name,
                                prompt_used=prompt,
                                generation_time=time.time() - start_time,
                                model_used=self.model
                            )
                    elif status_data["status"] == "failed":
                        return ImageGenerationResult(
                            success=False,
                            provider=self.name,
                            prompt_used=prompt,
                            error=status_data.get("error", "Generation failed")
                        )
                
                return ImageGenerationResult(
                    success=False,
                    provider=self.name,
                    prompt_used=prompt,
                    error="Timeout waiting for generation"
                )
        except Exception as e:
            return ImageGenerationResult(
                success=False,
                provider=self.name,
                prompt_used=prompt,
                error=str(e)
            )

class ZegaImageGenerator:
    """
    Main image generation orchestrator
    Uses ensemble of providers with fallback and quality selection
    """
    
    def __init__(self, training_data_path: str = "zega_image_training"):
        self.providers = []
        self.training_data_path = Path(training_data_path)
        self.training_data_path.mkdir(exist_ok=True)
        
        self._init_providers()
        print(f"[ZEGA_ImageGen] 🎨 Initialized with {len(self.providers)} providers")
    
    def _init_providers(self):
        """Initialize all available image providers"""
        # Always add Pollinations (free, no API key)
        self.providers.append(PollinationsProvider())
        print("[ZEGA_ImageGen] ✅ Loaded: Pollinations AI (free)")
        
        # Add HuggingFace if API key is available
        if os.getenv("HUGGINGFACEHUB_API_TOKEN"):
            # Multiple models for variety
            hf_models = [
                "stabilityai/stable-diffusion-xl-base-1.0",
                "runwayml/stable-diffusion-v1-5",
                "prompthero/openjourney"
            ]
            for model in hf_models:
                self.providers.append(HuggingFaceImageProvider(model))
            print(f"[ZEGA_ImageGen] ✅ Loaded: {len(hf_models)} HuggingFace models")
        
        # Add Stability AI if API key is available
        if os.getenv("STABILITY_API_KEY"):
            self.providers.append(StabilityAIProvider())
            print("[ZEGA_ImageGen] ✅ Loaded: Stability AI")
        
        # Add Replicate if API key is available
        if os.getenv("REPLICATE_API_TOKEN"):
            self.providers.append(ReplicateProvider())
            print("[ZEGA_ImageGen] ✅ Loaded: Replicate")
    
    def _build_scene_prompt(self, context: SceneContext) -> str:
        """Build an optimized prompt from scene context"""
        prompt_parts = []
        
        # Style based on genre
        genre_styles = {
            "Fantasy": "fantasy art style, magical, ethereal lighting",
            "Sci-Fi": "futuristic, sci-fi art, cyberpunk aesthetic",
            "Horror": "dark atmospheric, horror movie style, ominous",
            "Romance": "romantic, soft lighting, warm colors, cinematic",
            "Thriller": "suspenseful, noir style, dramatic shadows",
            "Comedy": "bright, colorful, cartoon-like",
            "Drama": "cinematic, emotional, dramatic lighting",
            "Action": "dynamic, action-packed, intense",
            "Mystery": "mysterious, fog, dim lighting",
            "Historical": "period accurate, classical art style"
        }
        
        # Add genre style
        if context.story_genre and context.story_genre in genre_styles:
            prompt_parts.append(genre_styles[context.story_genre])
        else:
            prompt_parts.append("cinematic, high quality, detailed")
        
        # Add scene description
        if context.scene_description:
            # Extract key visual elements
            prompt_parts.append(context.scene_description[:500])
        
        # Add character descriptions
        if context.characters:
            char_descs = []
            for char in context.characters[:3]:  # Limit to 3 characters
                name = char.get("name", "character")
                desc = char.get("description", "")[:100]
                char_descs.append(f"{name}: {desc}")
            if char_descs:
                prompt_parts.append("featuring " + ", ".join(char_descs))
        
        # Add style preferences if provided
        if context.style_preferences:
            prompt_parts.append(context.style_preferences)
        
        # Final quality tags
        prompt_parts.append("masterpiece, best quality, highly detailed, 8k resolution")
        
        return ", ".join(prompt_parts)
    
    async def generate_scene_image(
        self, 
        context: SceneContext,
        num_variations: int = 1,
        save_for_training: bool = True
    ) -> List[ImageGenerationResult]:
        """
        Generate image(s) for a scene using the best available provider
        
        Args:
            context: Scene context with all relevant information
            num_variations: Number of image variations to generate
            save_for_training: Whether to save successful generations for training
            
        Returns:
            List of ImageGenerationResult objects
        """
        prompt = self._build_scene_prompt(context)
        print(f"[ZEGA_ImageGen] 📝 Generated prompt: {prompt[:100]}...")
        
        results = []
        
        # Try providers in priority order
        for provider in self.providers:
            try:
                print(f"[ZEGA_ImageGen] 🎯 Trying {provider.name}...")
                result = await provider.generate(prompt)
                
                if result.success:
                    print(f"[ZEGA_ImageGen] ✅ Success from {provider.name}")
                    results.append(result)
                    
                    # Save for training
                    if save_for_training and result.image_data:
                        await self._save_training_data(context, prompt, result)
                    
                    if len(results) >= num_variations:
                        break
                else:
                    print(f"[ZEGA_ImageGen] ⚠️ {provider.name} failed: {result.error}")
            except Exception as e:
                print(f"[ZEGA_ImageGen] ❌ {provider.name} error: {e}")
        
        if not results:
            # Return a failure result
            results.append(ImageGenerationResult(
                success=False,
                prompt_used=prompt,
                error="All providers failed"
            ))
        
        return results
    
    async def _save_training_data(
        self, 
        context: SceneContext, 
        prompt: str, 
        result: ImageGenerationResult
    ):
        """Save successful generation for future model training"""
        try:
            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:8]
            filename = f"{timestamp}_{prompt_hash}"
            
            # Save image
            if result.image_data:
                image_path = self.training_data_path / f"{filename}.png"
                with open(image_path, "wb") as f:
                    f.write(result.image_data)
            
            # Save metadata
            metadata = {
                "prompt": prompt,
                "scene_title": context.scene_title,
                "scene_description": context.scene_description,
                "story_genre": context.story_genre,
                "characters": [c.get("name", "") for c in (context.characters or [])],
                "provider": result.provider,
                "model": result.model_used,
                "generation_time": result.generation_time,
                "timestamp": timestamp
            }
            
            metadata_path = self.training_data_path / f"{filename}.json"
            with open(metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
            
            print(f"[ZEGA_ImageGen] 💾 Saved training data: {filename}")
        except Exception as e:
            print(f"[ZEGA_ImageGen] ⚠️ Failed to save training data: {e}")
    
    def get_training_stats(self) -> Dict[str, Any]:
        """Get statistics about collected training data"""
        try:
            images = list(self.training_data_path.glob("*.png"))
            metadata_files = list(self.training_data_path.glob("*.json"))
            
            providers = {}
            genres = {}
            
            for meta_file in metadata_files:
                with open(meta_file) as f:
                    meta = json.load(f)
                    provider = meta.get("provider", "unknown")
                    genre = meta.get("story_genre", "unknown")
                    providers[provider] = providers.get(provider, 0) + 1
                    genres[genre] = genres.get(genre, 0) + 1
            
            return {
                "total_images": len(images),
                "total_metadata": len(metadata_files),
                "by_provider": providers,
                "by_genre": genres,
                "path": str(self.training_data_path)
            }
        except Exception as e:
            return {"error": str(e)}
