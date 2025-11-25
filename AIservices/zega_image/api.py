"""
ZEGA Image Generation API
FastAPI microservice for scene image generation
"""

import os
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64
import io
from dotenv import load_dotenv

# Load environment
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

from zega_image.generator import ZegaImageGenerator, SceneContext

app = FastAPI(
    title="ZEGA Image Generation Service",
    description="AI-powered image generation for story scenes",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize generator
generator = ZegaImageGenerator(
    training_data_path=str(Path(__file__).parent / "training_data")
)

# Request/Response Models
class CharacterInfo(BaseModel):
    name: str
    description: str = ""
    role: str = ""
    imageUrl: Optional[str] = None

class GenerateImageRequest(BaseModel):
    scene_title: str
    scene_description: str
    characters: List[CharacterInfo] = []
    previous_scene_description: Optional[str] = None
    previous_scene_images: Optional[List[str]] = None
    user_uploaded_images: Optional[List[str]] = None
    style_preferences: Optional[str] = None
    story_genre: Optional[str] = None
    num_variations: int = 1

class ImageResponse(BaseModel):
    success: bool
    images: List[Dict[str, Any]] = []
    error: Optional[str] = None
    prompt_used: Optional[str] = None

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZEGA_ImageGen",
        "providers": len(generator.providers)
    }

@app.post("/generate", response_model=ImageResponse)
async def generate_image(request: GenerateImageRequest):
    """
    Generate scene image(s) based on context
    
    This endpoint uses multiple AI providers (Pollinations, HuggingFace, Stability AI)
    to generate images that match your scene description and characters.
    """
    try:
        # Build scene context
        context = SceneContext(
            scene_title=request.scene_title,
            scene_description=request.scene_description,
            characters=[c.dict() for c in request.characters],
            previous_scene_description=request.previous_scene_description,
            previous_scene_images=request.previous_scene_images,
            user_uploaded_images=request.user_uploaded_images,
            style_preferences=request.style_preferences,
            story_genre=request.story_genre
        )
        
        # Generate images
        results = await generator.generate_scene_image(
            context=context,
            num_variations=request.num_variations,
            save_for_training=True
        )
        
        # Format response
        images = []
        for result in results:
            if result.success and result.image_data:
                # Convert to base64 for JSON response
                image_b64 = base64.b64encode(result.image_data).decode('utf-8')
                images.append({
                    "data": f"data:image/png;base64,{image_b64}",
                    "provider": result.provider,
                    "model": result.model_used,
                    "generation_time": result.generation_time,
                    "url": result.image_url  # Some providers return URLs
                })
            elif result.image_url:
                images.append({
                    "url": result.image_url,
                    "provider": result.provider,
                    "model": result.model_used,
                    "generation_time": result.generation_time
                })
        
        return ImageResponse(
            success=len(images) > 0,
            images=images,
            prompt_used=results[0].prompt_used if results else None,
            error=results[0].error if not images and results else None
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/generate/quick")
async def generate_quick(
    prompt: str,
    style: str = "cinematic",
    width: int = 1024,
    height: int = 768
):
    """
    Quick image generation with just a prompt
    Returns image directly (not JSON)
    """
    try:
        from zega_image.generator import PollinationsProvider
        provider = PollinationsProvider()
        
        full_prompt = f"{prompt}, {style}, high quality, detailed"
        result = await provider.generate(full_prompt, width, height)
        
        if result.success and result.image_data:
            return Response(
                content=result.image_data,
                media_type="image/png"
            )
        else:
            raise HTTPException(status_code=500, detail=result.error or "Generation failed")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/training/stats")
async def training_stats():
    """Get statistics about collected training data"""
    return generator.get_training_stats()

@app.get("/providers")
async def list_providers():
    """List available image generation providers"""
    return {
        "providers": [
            {
                "name": p.name,
                "available": True
            }
            for p in generator.providers
        ],
        "total": len(generator.providers)
    }

# MCP Tool Definitions for AI Agents
MCP_TOOLS = {
    "generate_scene_image": {
        "name": "generate_scene_image",
        "description": "Generate an AI image for a story scene based on description and characters",
        "inputSchema": {
            "type": "object",
            "properties": {
                "scene_title": {"type": "string", "description": "Title of the scene"},
                "scene_description": {"type": "string", "description": "Detailed description of the scene"},
                "characters": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    },
                    "description": "Characters appearing in the scene"
                },
                "story_genre": {"type": "string", "description": "Genre like Fantasy, Sci-Fi, etc."},
                "style_preferences": {"type": "string", "description": "Visual style preferences"}
            },
            "required": ["scene_title", "scene_description"]
        }
    },
    "quick_image": {
        "name": "quick_image",
        "description": "Generate a quick image from a simple prompt",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Image generation prompt"},
                "style": {"type": "string", "description": "Visual style (cinematic, anime, etc.)"}
            },
            "required": ["prompt"]
        }
    }
}

@app.get("/mcp/tools")
async def mcp_tools():
    """Get MCP tool definitions for AI agents"""
    return {"tools": list(MCP_TOOLS.values())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
