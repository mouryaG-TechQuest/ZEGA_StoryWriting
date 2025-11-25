"""
ZEGA MCP Server
Model Context Protocol server for AI agent integration
Exposes all ZEGA services as tools for AI assistants
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import base64

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

# MCP Server implementation
@dataclass
class MCPTool:
    """MCP Tool definition"""
    name: str
    description: str
    inputSchema: Dict[str, Any]


@dataclass 
class MCPResource:
    """MCP Resource definition"""
    uri: str
    name: str
    description: str
    mimeType: str = "application/json"


class ZegaMCPServer:
    """
    ZEGA MCP Server
    Provides Model Context Protocol interface for AI agents
    
    Ports:
    - ZEGA Core: 8002
    - ZEGA ImageGen: 8003
    - ZEGA Voice: 8004
    - ZEGA DocParser: 8005
    - MCP Server: 8006
    """
    
    def __init__(self):
        self.base_urls = {
            "core": os.getenv("ZEGA_CORE_URL", "http://localhost:8002"),
            "image": os.getenv("ZEGA_IMAGE_URL", "http://localhost:8003"),
            "voice": os.getenv("ZEGA_VOICE_URL", "http://localhost:8004"),
            "docparser": os.getenv("ZEGA_DOCPARSER_URL", "http://localhost:8005")
        }
        
        self.tools = self._register_tools()
        self.resources = self._register_resources()
    
    def _register_tools(self) -> Dict[str, MCPTool]:
        """Register all available MCP tools"""
        return {
            # === Scene Generation Tools ===
            "generate_scene": MCPTool(
                name="generate_scene",
                description="Generate AI-powered scene content for a story. Creates engaging narrative based on title, genre, and optional context.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Scene title or topic"},
                        "genre": {"type": "string", "description": "Story genre (fantasy, sci-fi, romance, etc.)"},
                        "previous_context": {"type": "string", "description": "Previous scene content for continuity"},
                        "characters": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Character names to include"
                        },
                        "style": {"type": "string", "description": "Writing style preference"},
                        "max_length": {"type": "integer", "description": "Maximum word count"}
                    },
                    "required": ["title", "genre"]
                }
            ),
            
            "expand_scene": MCPTool(
                name="expand_scene",
                description="Expand existing scene content with more details, dialogue, or descriptions.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "content": {"type": "string", "description": "Existing scene content to expand"},
                        "aspect": {"type": "string", "enum": ["dialogue", "description", "action", "emotion"], "description": "What aspect to expand"},
                        "amount": {"type": "string", "enum": ["slight", "moderate", "significant"], "description": "How much to expand"}
                    },
                    "required": ["content"]
                }
            ),
            
            "analyze_scene": MCPTool(
                name="analyze_scene",
                description="Analyze a scene for characters, mood, pacing, and other story elements.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "content": {"type": "string", "description": "Scene content to analyze"}
                    },
                    "required": ["content"]
                }
            ),
            
            # === Image Generation Tools ===
            "generate_scene_image": MCPTool(
                name="generate_scene_image",
                description="Generate an image based on scene description. Uses free AI image generation APIs.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "scene_title": {"type": "string", "description": "Title of the scene"},
                        "scene_description": {"type": "string", "description": "Description of the scene for image generation"},
                        "style": {"type": "string", "description": "Art style (realistic, anime, digital art, etc.)"},
                        "characters": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Characters to include in the image"
                        },
                        "size": {"type": "string", "enum": ["square", "portrait", "landscape"], "description": "Image aspect ratio"}
                    },
                    "required": ["scene_description"]
                }
            ),
            
            "quick_image": MCPTool(
                name="quick_image",
                description="Generate a quick image from a simple text prompt.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "Image description prompt"}
                    },
                    "required": ["prompt"]
                }
            ),
            
            # === Voice Tools ===
            "transcribe_audio": MCPTool(
                name="transcribe_audio",
                description="Convert spoken audio to text using AI speech recognition.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "audio_base64": {"type": "string", "description": "Base64 encoded audio data"},
                        "language": {"type": "string", "description": "Language code (en, es, fr, etc.)"}
                    },
                    "required": ["audio_base64"]
                }
            ),
            
            "text_to_speech": MCPTool(
                name="text_to_speech",
                description="Convert text to spoken audio using AI voice synthesis.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "Text to convert to speech"},
                        "voice": {"type": "string", "description": "Voice to use (e.g., 'en-US-JennyNeural')"},
                        "language": {"type": "string", "description": "Language code"}
                    },
                    "required": ["text"]
                }
            ),
            
            "narrate_scene": MCPTool(
                name="narrate_scene",
                description="Generate audio narration for a story scene.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "scene_title": {"type": "string", "description": "Title of the scene"},
                        "scene_description": {"type": "string", "description": "Scene content to narrate"},
                        "voice": {"type": "string", "description": "Narrator voice"}
                    },
                    "required": ["scene_title", "scene_description"]
                }
            ),
            
            "generate_subtitles": MCPTool(
                name="generate_subtitles",
                description="Generate subtitles/captions from audio in SRT or VTT format.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "audio_base64": {"type": "string", "description": "Base64 encoded audio"},
                        "language": {"type": "string", "description": "Audio language"},
                        "format": {"type": "string", "enum": ["srt", "vtt"], "description": "Subtitle format"}
                    },
                    "required": ["audio_base64"]
                }
            ),
            
            # === Document Parsing Tools ===
            "parse_document": MCPTool(
                name="parse_document",
                description="Parse a document (PDF, DOCX, TXT, etc.) into structured story scenes.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string", "description": "Path to the document file"},
                        "format": {"type": "string", "description": "Document format (auto-detected if not specified)"}
                    },
                    "required": ["file_path"]
                }
            ),
            
            "parse_text_to_scenes": MCPTool(
                name="parse_text_to_scenes",
                description="Convert raw text into structured story scenes with characters, locations, and moods.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "Raw text content to parse"},
                        "title": {"type": "string", "description": "Document/story title"}
                    },
                    "required": ["text"]
                }
            ),
            
            "extract_characters": MCPTool(
                name="extract_characters",
                description="Extract character names from text or document.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "Text to analyze for characters"}
                    },
                    "required": ["text"]
                }
            ),
            
            "detect_genre": MCPTool(
                name="detect_genre",
                description="Detect probable genre(s) from text content.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "text": {"type": "string", "description": "Text to analyze for genre"}
                    },
                    "required": ["text"]
                }
            ),
            
            # === Utility Tools ===
            "get_available_voices": MCPTool(
                name="get_available_voices",
                description="Get list of available TTS voices for narration.",
                inputSchema={
                    "type": "object",
                    "properties": {}
                }
            ),
            
            "get_service_status": MCPTool(
                name="get_service_status",
                description="Check health status of all ZEGA services.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "service": {
                            "type": "string",
                            "enum": ["all", "core", "image", "voice", "docparser"],
                            "description": "Which service to check"
                        }
                    }
                }
            )
        }
    
    def _register_resources(self) -> Dict[str, MCPResource]:
        """Register MCP resources"""
        return {
            "zega://services": MCPResource(
                uri="zega://services",
                name="ZEGA Services",
                description="Information about available ZEGA AI services"
            ),
            "zega://models": MCPResource(
                uri="zega://models",
                name="AI Models",
                description="Available AI models and providers"
            ),
            "zega://voices": MCPResource(
                uri="zega://voices",
                name="TTS Voices",
                description="Available text-to-speech voices"
            ),
            "zega://formats": MCPResource(
                uri="zega://formats",
                name="Document Formats",
                description="Supported document formats for parsing"
            )
        }
    
    def get_tools(self) -> List[Dict[str, Any]]:
        """Get all tools in MCP format"""
        return [asdict(tool) for tool in self.tools.values()]
    
    def get_resources(self) -> List[Dict[str, Any]]:
        """Get all resources in MCP format"""
        return [asdict(resource) for resource in self.resources.values()]
    
    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an MCP tool call"""
        import aiohttp
        
        if name not in self.tools:
            return {"error": f"Unknown tool: {name}"}
        
        try:
            # Route to appropriate service
            if name in ["generate_scene", "expand_scene", "analyze_scene"]:
                url = f"{self.base_urls['core']}/{name.replace('_', '/')}"
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=arguments) as resp:
                        return await resp.json()
            
            elif name in ["generate_scene_image", "quick_image"]:
                endpoint = "generate" if name == "generate_scene_image" else "generate/quick"
                url = f"{self.base_urls['image']}/{endpoint}"
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=arguments) as resp:
                        return await resp.json()
            
            elif name in ["transcribe_audio", "text_to_speech", "narrate_scene", "generate_subtitles"]:
                endpoint_map = {
                    "transcribe_audio": "transcribe",
                    "text_to_speech": "synthesize",
                    "narrate_scene": "narrate",
                    "generate_subtitles": "subtitles"
                }
                url = f"{self.base_urls['voice']}/{endpoint_map[name]}"
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=arguments) as resp:
                        return await resp.json()
            
            elif name in ["parse_text_to_scenes", "extract_characters", "detect_genre"]:
                url = f"{self.base_urls['docparser']}/mcp/execute"
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, params={"tool_name": name}, json=arguments) as resp:
                        return await resp.json()
            
            elif name == "get_available_voices":
                url = f"{self.base_urls['voice']}/voices"
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as resp:
                        return await resp.json()
            
            elif name == "get_service_status":
                return await self._check_services(arguments.get("service", "all"))
            
            else:
                return {"error": f"Tool '{name}' not yet implemented"}
                
        except Exception as e:
            return {"error": str(e)}
    
    async def _check_services(self, service: str = "all") -> Dict[str, Any]:
        """Check health of ZEGA services"""
        import aiohttp
        
        results = {}
        services_to_check = [service] if service != "all" else list(self.base_urls.keys())
        
        async with aiohttp.ClientSession() as session:
            for svc in services_to_check:
                if svc in self.base_urls:
                    try:
                        async with session.get(f"{self.base_urls[svc]}/health", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                            if resp.status == 200:
                                results[svc] = {"status": "healthy", "details": await resp.json()}
                            else:
                                results[svc] = {"status": "unhealthy", "code": resp.status}
                    except Exception as e:
                        results[svc] = {"status": "unreachable", "error": str(e)}
        
        return {"services": results}
    
    async def read_resource(self, uri: str) -> Dict[str, Any]:
        """Read an MCP resource"""
        import aiohttp
        
        if uri == "zega://services":
            return {
                "services": {
                    "core": {
                        "name": "ZEGA Core",
                        "description": "Main AI scene generation service",
                        "url": self.base_urls["core"],
                        "capabilities": ["scene_generation", "scene_expansion", "analysis"]
                    },
                    "image": {
                        "name": "ZEGA ImageGen",
                        "description": "AI image generation for scenes",
                        "url": self.base_urls["image"],
                        "capabilities": ["image_generation", "style_transfer"]
                    },
                    "voice": {
                        "name": "ZEGA Voice",
                        "description": "Voice synthesis and recognition",
                        "url": self.base_urls["voice"],
                        "capabilities": ["tts", "stt", "narration", "subtitles"]
                    },
                    "docparser": {
                        "name": "ZEGA DocParser",
                        "description": "Document to scene conversion",
                        "url": self.base_urls["docparser"],
                        "capabilities": ["parsing", "extraction", "genre_detection"]
                    }
                }
            }
        
        elif uri == "zega://voices":
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{self.base_urls['voice']}/voices") as resp:
                        return await resp.json()
            except:
                return {"voices": [], "error": "Voice service unavailable"}
        
        elif uri == "zega://formats":
            return {
                "formats": [
                    {"ext": ".txt", "name": "Plain Text", "description": "Plain text files"},
                    {"ext": ".md", "name": "Markdown", "description": "Markdown documents"},
                    {"ext": ".pdf", "name": "PDF", "description": "PDF documents"},
                    {"ext": ".docx", "name": "Word", "description": "Microsoft Word documents"},
                    {"ext": ".epub", "name": "EPUB", "description": "E-book format"},
                    {"ext": ".html", "name": "HTML", "description": "Web pages"}
                ]
            }
        
        elif uri == "zega://models":
            return {
                "models": {
                    "text_generation": ["ollama/llama3", "groq/llama3", "anthropic/claude"],
                    "image_generation": ["pollinations/flux", "huggingface/sdxl", "stability/sd"],
                    "speech_recognition": ["whisper", "huggingface/wav2vec2"],
                    "speech_synthesis": ["edge-tts", "gtts"]
                }
            }
        
        return {"error": f"Unknown resource: {uri}"}


# Create FastAPI app for HTTP transport
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="ZEGA MCP Server",
    description="Model Context Protocol server for ZEGA AI services",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MCP server
mcp_server = ZegaMCPServer()

class ToolCallRequest(BaseModel):
    name: str
    arguments: Dict[str, Any] = {}

class ResourceRequest(BaseModel):
    uri: str

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "service": "ZEGA_MCP"}

@app.get("/tools")
async def list_tools():
    """List all available MCP tools"""
    return {"tools": mcp_server.get_tools()}

@app.get("/resources")
async def list_resources():
    """List all available MCP resources"""
    return {"resources": mcp_server.get_resources()}

@app.post("/tools/call")
async def call_tool(request: ToolCallRequest):
    """Execute an MCP tool"""
    result = await mcp_server.execute_tool(request.name, request.arguments)
    return result

@app.post("/resources/read")
async def read_resource(request: ResourceRequest):
    """Read an MCP resource"""
    result = await mcp_server.read_resource(request.uri)
    return result

# MCP Protocol endpoints (JSON-RPC style)
@app.post("/mcp")
async def mcp_handler(request: Dict[str, Any]):
    """
    Main MCP protocol handler
    Supports JSON-RPC style requests
    """
    method = request.get("method")
    params = request.get("params", {})
    request_id = request.get("id")
    
    try:
        if method == "tools/list":
            result = {"tools": mcp_server.get_tools()}
        
        elif method == "tools/call":
            result = await mcp_server.execute_tool(
                params.get("name"),
                params.get("arguments", {})
            )
        
        elif method == "resources/list":
            result = {"resources": mcp_server.get_resources()}
        
        elif method == "resources/read":
            result = await mcp_server.read_resource(params.get("uri"))
        
        elif method == "ping":
            result = {"status": "ok"}
        
        else:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32601, "message": f"Method not found: {method}"}
            }
        
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": result
        }
        
    except Exception as e:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32000, "message": str(e)}
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
