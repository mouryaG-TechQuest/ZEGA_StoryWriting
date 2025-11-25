"""
ZEGA Document Parser API
FastAPI microservice for document to scene conversion
"""

import os
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

from zega_docparser.parser import ZegaDocParser, ParsedScene

app = FastAPI(
    title="ZEGA Document Parser Service",
    description="AI-powered document to scene conversion for story creation",
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

# Initialize parser
parser = ZegaDocParser(
    training_data_path=str(Path(__file__).parent / "training_data")
)

# Request/Response Models
class ParseTextRequest(BaseModel):
    text: str
    title: str = "Untitled Document"

class SceneResponse(BaseModel):
    scene_number: int
    title: str
    content: str
    characters: List[str]
    location: str
    time_of_day: str
    mood: str
    summary: str

class ParseResponse(BaseModel):
    success: bool
    filename: str = ""
    total_scenes: int = 0
    scenes: List[SceneResponse] = []
    characters_found: List[str] = []
    genre_hints: List[str] = []
    word_count: int = 0
    error: Optional[str] = None

class StoryFormatResponse(BaseModel):
    success: bool
    story_scenes: List[Dict[str, Any]] = []
    total_scenes: int = 0
    error: Optional[str] = None

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZEGA_DocParser",
        "supported_formats": parser.get_supported_formats()
    }

@app.post("/parse/file", response_model=ParseResponse)
async def parse_file(file: UploadFile = File(...)):
    """
    Parse uploaded document into structured scenes
    
    Supports: TXT, MD, PDF, DOCX, DOC, RTF, EPUB, HTML
    """
    try:
        data = await file.read()
        result = await parser.parse_bytes(data, file.filename, file.content_type)
        
        scenes = [
            SceneResponse(
                scene_number=s.scene_number,
                title=s.title,
                content=s.content,
                characters=s.characters,
                location=s.location,
                time_of_day=s.time_of_day,
                mood=s.mood,
                summary=s.summary
            )
            for s in result.scenes
        ]
        
        return ParseResponse(
            success=result.success,
            filename=result.filename,
            total_scenes=result.total_scenes,
            scenes=scenes,
            characters_found=result.characters_found,
            genre_hints=result.genre_hints,
            word_count=result.word_count,
            error=result.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse/text", response_model=ParseResponse)
async def parse_text(request: ParseTextRequest):
    """
    Parse raw text into structured scenes
    
    Use this for pasted text content.
    """
    try:
        result = await parser.parse_text_direct(request.text, request.title)
        
        scenes = [
            SceneResponse(
                scene_number=s.scene_number,
                title=s.title,
                content=s.content,
                characters=s.characters,
                location=s.location,
                time_of_day=s.time_of_day,
                mood=s.mood,
                summary=s.summary
            )
            for s in result.scenes
        ]
        
        return ParseResponse(
            success=result.success,
            filename=result.filename,
            total_scenes=result.total_scenes,
            scenes=scenes,
            characters_found=result.characters_found,
            genre_hints=result.genre_hints,
            word_count=result.word_count,
            error=result.error
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse/to-story", response_model=StoryFormatResponse)
async def parse_to_story_format(file: UploadFile = File(...)):
    """
    Parse document directly to story service format
    
    Returns scenes ready to be sent to the Story microservice.
    """
    try:
        data = await file.read()
        result = await parser.parse_bytes(data, file.filename, file.content_type)
        
        if not result.success:
            return StoryFormatResponse(
                success=False,
                error=result.error
            )
        
        story_scenes = parser.scenes_to_story_format(result)
        
        return StoryFormatResponse(
            success=True,
            story_scenes=story_scenes,
            total_scenes=len(story_scenes)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse/text/to-story", response_model=StoryFormatResponse)
async def parse_text_to_story_format(request: ParseTextRequest):
    """
    Parse text directly to story service format
    """
    try:
        result = await parser.parse_text_direct(request.text, request.title)
        
        if not result.success:
            return StoryFormatResponse(
                success=False,
                error=result.error
            )
        
        story_scenes = parser.scenes_to_story_format(result)
        
        return StoryFormatResponse(
            success=True,
            story_scenes=story_scenes,
            total_scenes=len(story_scenes)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/formats")
async def list_formats():
    """List supported document formats"""
    return {
        "formats": parser.get_supported_formats(),
        "descriptions": {
            ".txt": "Plain text files",
            ".md": "Markdown files",
            ".pdf": "PDF documents",
            ".docx": "Microsoft Word documents (2007+)",
            ".doc": "Microsoft Word documents (legacy)",
            ".rtf": "Rich Text Format",
            ".epub": "EPUB e-books",
            ".html": "HTML web pages"
        }
    }

@app.get("/scene/{scene_number}")
async def get_scene_template(scene_number: int):
    """Get a scene template for manual creation"""
    return {
        "scene_number": scene_number,
        "title": f"Scene {scene_number}",
        "content": "",
        "characters": [],
        "location": "",
        "time_of_day": "",
        "mood": "",
        "summary": "",
        "template_fields": [
            "title", "content", "characters", "location",
            "time_of_day", "mood", "summary"
        ]
    }

# MCP Tool Definitions
MCP_TOOLS = {
    "parse_document": {
        "name": "parse_document",
        "description": "Parse a document (PDF, DOCX, TXT, etc.) into structured story scenes",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to the document file"},
                "format": {"type": "string", "description": "Document format (auto-detected if not specified)"}
            },
            "required": ["file_path"]
        }
    },
    "parse_text_to_scenes": {
        "name": "parse_text_to_scenes",
        "description": "Convert raw text into structured story scenes",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Raw text content to parse"},
                "title": {"type": "string", "description": "Document/story title"}
            },
            "required": ["text"]
        }
    },
    "extract_characters": {
        "name": "extract_characters",
        "description": "Extract character names from text or document",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to analyze for characters"}
            },
            "required": ["text"]
        }
    },
    "detect_genre": {
        "name": "detect_genre",
        "description": "Detect probable genre(s) from text content",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to analyze for genre"}
            },
            "required": ["text"]
        }
    }
}

@app.get("/mcp/tools")
async def mcp_tools():
    """Get MCP tool definitions for AI agents"""
    return {"tools": list(MCP_TOOLS.values())}

@app.post("/mcp/execute")
async def mcp_execute(tool_name: str, arguments: Dict[str, Any]):
    """Execute an MCP tool call"""
    if tool_name == "parse_text_to_scenes":
        result = await parser.parse_text_direct(
            arguments.get("text", ""),
            arguments.get("title", "Untitled")
        )
        return {"success": result.success, "scenes": len(result.scenes), "result": result}
    
    elif tool_name == "extract_characters":
        result = await parser.parse_text_direct(arguments.get("text", ""), "temp")
        return {"success": True, "characters": result.characters_found}
    
    elif tool_name == "detect_genre":
        result = await parser.parse_text_direct(arguments.get("text", ""), "temp")
        return {"success": True, "genres": result.genre_hints}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
