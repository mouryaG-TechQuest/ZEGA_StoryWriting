"""
ZEGA Voice Assistant API
FastAPI microservice for voice features
"""

import os
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import base64
from dotenv import load_dotenv

# Load environment
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

from zega_voice.processor import ZegaVoiceProcessor

app = FastAPI(
    title="ZEGA Voice Assistant Service",
    description="AI-powered voice features: STT, TTS, Subtitles, Narration",
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

# Initialize processor
processor = ZegaVoiceProcessor(
    training_data_path=str(Path(__file__).parent / "training_data")
)

# Request/Response Models
class TranscribeRequest(BaseModel):
    audio_base64: str
    language: str = "en"

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-JennyNeural"
    language: str = "en"

class NarrateSceneRequest(BaseModel):
    scene_title: str
    scene_description: str
    voice: str = "en-US-JennyNeural"
    include_title: bool = True

class SubtitleRequest(BaseModel):
    audio_base64: str
    language: str = "en"
    format: str = "srt"  # srt or vtt

class TranscriptionResponse(BaseModel):
    success: bool
    text: str = ""
    language: str = ""
    timestamps: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

class SynthesisResponse(BaseModel):
    success: bool
    audio_base64: Optional[str] = None
    audio_format: str = "mp3"
    duration: float = 0.0
    voice_used: str = ""
    error: Optional[str] = None

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZEGA_Voice",
        "stt_providers": len(processor.stt_providers),
        "tts_providers": len(processor.tts_providers)
    }

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(request: TranscribeRequest):
    """
    Transcribe audio to text
    
    Accepts base64 encoded audio and returns transcription with optional timestamps.
    Supports multiple languages.
    """
    try:
        # Decode audio
        audio_data = base64.b64decode(request.audio_base64)
        
        # Transcribe
        result = await processor.transcribe(audio_data, request.language)
        
        return TranscriptionResponse(
            success=result.success,
            text=result.text,
            language=result.language,
            timestamps=result.timestamps,
            error=result.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe/file")
async def transcribe_file(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Transcribe audio file to text
    
    Upload audio file directly and get transcription.
    """
    try:
        audio_data = await file.read()
        result = await processor.transcribe(audio_data, language)
        
        return TranscriptionResponse(
            success=result.success,
            text=result.text,
            language=result.language,
            timestamps=result.timestamps,
            error=result.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/synthesize", response_model=SynthesisResponse)
async def synthesize_speech(request: SynthesizeRequest):
    """
    Convert text to speech
    
    Returns base64 encoded audio in MP3 format.
    """
    try:
        result = await processor.synthesize(
            text=request.text,
            voice=request.voice,
            language=request.language
        )
        
        audio_b64 = None
        if result.success and result.audio_data:
            audio_b64 = base64.b64encode(result.audio_data).decode('utf-8')
        
        return SynthesisResponse(
            success=result.success,
            audio_base64=audio_b64,
            audio_format=result.audio_format,
            voice_used=result.voice_used,
            error=result.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/synthesize/direct")
async def synthesize_direct(
    text: str = Query(..., description="Text to convert to speech"),
    voice: str = Query("en-US-JennyNeural", description="Voice to use")
):
    """
    Convert text to speech and return audio directly
    
    Returns audio file directly (not base64).
    """
    try:
        result = await processor.synthesize(text=text, voice=voice)
        
        if result.success and result.audio_data:
            return Response(
                content=result.audio_data,
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "attachment; filename=speech.mp3"
                }
            )
        else:
            raise HTTPException(status_code=500, detail=result.error or "Synthesis failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/narrate")
async def narrate_scene(request: NarrateSceneRequest):
    """
    Generate audio narration for a story scene
    
    Combines scene title and description into natural narration.
    """
    try:
        result = await processor.narrate_scene(
            scene_title=request.scene_title,
            scene_description=request.scene_description,
            voice=request.voice,
            include_title=request.include_title
        )
        
        audio_b64 = None
        if result.success and result.audio_data:
            audio_b64 = base64.b64encode(result.audio_data).decode('utf-8')
        
        return SynthesisResponse(
            success=result.success,
            audio_base64=audio_b64,
            audio_format=result.audio_format,
            voice_used=result.voice_used,
            error=result.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/subtitles")
async def generate_subtitles(request: SubtitleRequest):
    """
    Generate subtitles from audio
    
    Returns subtitles in SRT or VTT format.
    """
    try:
        audio_data = base64.b64decode(request.audio_base64)
        
        success, content = await processor.generate_subtitles(
            audio_data=audio_data,
            language=request.language,
            format=request.format
        )
        
        return {
            "success": success,
            "subtitles": content if success else None,
            "format": request.format,
            "error": content if not success else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/subtitles/file")
async def generate_subtitles_file(
    file: UploadFile = File(...),
    language: str = Form("en"),
    format: str = Form("srt")
):
    """
    Generate subtitles from uploaded audio file
    """
    try:
        audio_data = await file.read()
        
        success, content = await processor.generate_subtitles(
            audio_data=audio_data,
            language=language,
            format=format
        )
        
        if success:
            # Return as downloadable file
            return Response(
                content=content,
                media_type="text/plain",
                headers={
                    "Content-Disposition": f"attachment; filename=subtitles.{format}"
                }
            )
        else:
            raise HTTPException(status_code=500, detail=content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices")
async def list_voices():
    """
    List all available TTS voices
    """
    voices = await processor.get_available_voices()
    return {
        "voices": voices,
        "total": len(voices)
    }

@app.get("/providers")
async def list_providers():
    """List available voice providers"""
    return {
        "stt_providers": [p.name for p in processor.stt_providers],
        "tts_providers": [p.name for p in processor.tts_providers]
    }

# MCP Tool Definitions
MCP_TOOLS = {
    "transcribe_audio": {
        "name": "transcribe_audio",
        "description": "Convert spoken audio to text using AI speech recognition",
        "inputSchema": {
            "type": "object",
            "properties": {
                "audio_base64": {"type": "string", "description": "Base64 encoded audio data"},
                "language": {"type": "string", "description": "Language code (e.g., 'en', 'es')"}
            },
            "required": ["audio_base64"]
        }
    },
    "text_to_speech": {
        "name": "text_to_speech",
        "description": "Convert text to spoken audio using AI voice synthesis",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to convert to speech"},
                "voice": {"type": "string", "description": "Voice to use (e.g., 'en-US-JennyNeural')"},
                "language": {"type": "string", "description": "Language code"}
            },
            "required": ["text"]
        }
    },
    "narrate_scene": {
        "name": "narrate_scene",
        "description": "Generate audio narration for a story scene",
        "inputSchema": {
            "type": "object",
            "properties": {
                "scene_title": {"type": "string", "description": "Title of the scene"},
                "scene_description": {"type": "string", "description": "Scene content to narrate"},
                "voice": {"type": "string", "description": "Narrator voice"}
            },
            "required": ["scene_title", "scene_description"]
        }
    },
    "generate_subtitles": {
        "name": "generate_subtitles",
        "description": "Generate subtitles/captions from audio",
        "inputSchema": {
            "type": "object",
            "properties": {
                "audio_base64": {"type": "string", "description": "Base64 encoded audio"},
                "language": {"type": "string", "description": "Audio language"},
                "format": {"type": "string", "enum": ["srt", "vtt"], "description": "Subtitle format"}
            },
            "required": ["audio_base64"]
        }
    }
}

@app.get("/mcp/tools")
async def mcp_tools():
    """Get MCP tool definitions for AI agents"""
    return {"tools": list(MCP_TOOLS.values())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
