# ZEGA AI Services

**Comprehensive AI-powered services for story writing, image generation, voice processing, and document parsing.**

## 🏗️ Architecture

```
AIservices/
├── api.py                    # ZEGA Core Service (Port 8002)
├── zega_image/               # Image Generation Service (Port 8003)
│   ├── generator.py          # Image generation engine
│   └── api.py                # FastAPI endpoints
├── zega_voice/               # Voice Assistant Service (Port 8004)
│   ├── processor.py          # STT/TTS processing engine
│   └── api.py                # FastAPI endpoints
├── zega_docparser/           # Document Parser Service (Port 8005)
│   ├── parser.py             # Document parsing engine
│   └── api.py                # FastAPI endpoints
├── mcp_server/               # MCP Server (Port 8006)
│   └── server.py             # Model Context Protocol server
├── start-all-services.bat    # Start all services
├── stop-all-services.bat     # Stop all services
├── mcp-config.json           # MCP configuration for AI agents
└── requirements.txt          # Python dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd AIservices
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file:

```env
# API Keys (optional - services use free APIs by default)
HUGGINGFACE_API_KEY=your_hf_key
STABILITY_API_KEY=your_stability_key
REPLICATE_API_TOKEN=your_replicate_token

# AI Providers for text generation
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_google_key

# Service URLs (defaults)
ZEGA_CORE_URL=http://localhost:8002
ZEGA_IMAGE_URL=http://localhost:8003
ZEGA_VOICE_URL=http://localhost:8004
ZEGA_DOCPARSER_URL=http://localhost:8005
```

### 3. Start Services

**Windows:**
```batch
start-all-services.bat
```

**Linux/Mac:**
```bash
# Terminal 1
uvicorn api:app --port 8002 --reload

# Terminal 2
cd zega_image && uvicorn api:app --port 8003 --reload

# Terminal 3
cd zega_voice && uvicorn api:app --port 8004 --reload

# Terminal 4
cd zega_docparser && uvicorn api:app --port 8005 --reload

# Terminal 5
cd mcp_server && uvicorn server:app --port 8006 --reload
```

## 📡 Services

### 1. ZEGA Core (Port 8002)
Main AI service for scene generation using ensemble AI providers.

**Endpoints:**
- `POST /generate` - Generate scene content
- `POST /expand` - Expand existing scenes
- `POST /analyze` - Analyze scene content
- `GET /health` - Health check

### 2. ZEGA ImageGen (Port 8003)
AI image generation using free APIs.

**Providers:**
- 🌸 **Pollinations AI** (FREE, no API key needed)
- 🤗 **HuggingFace** (Free tier available)
- 🎨 **Stability AI** (Free credits)
- 🔄 **Replicate** (Free tier)

**Endpoints:**
- `POST /generate` - Generate image from scene
- `POST /generate/quick` - Quick image from prompt
- `GET /providers` - List available providers
- `GET /training/stats` - Training data statistics
- `GET /mcp/tools` - MCP tool definitions

### 3. ZEGA Voice (Port 8004)
Voice processing with STT and TTS capabilities.

**Providers:**
- 🎤 **Whisper** (Free local STT)
- 🤗 **HuggingFace STT** (Free)
- 🔊 **Microsoft Edge TTS** (FREE, high quality)
- 🗣️ **Google TTS** (Free)

**Endpoints:**
- `POST /transcribe` - Audio to text
- `POST /transcribe/file` - Transcribe uploaded audio
- `POST /synthesize` - Text to audio
- `GET /synthesize/direct` - Direct audio response
- `POST /narrate` - Narrate a scene
- `POST /subtitles` - Generate subtitles
- `GET /voices` - List available voices
- `GET /mcp/tools` - MCP tool definitions

### 4. ZEGA DocParser (Port 8005)
Document to scene conversion.

**Supported Formats:**
- 📄 TXT, MD, Markdown
- 📕 PDF
- 📘 DOCX, DOC
- 📗 RTF
- 📚 EPUB
- 🌐 HTML

**Endpoints:**
- `POST /parse/file` - Parse uploaded document
- `POST /parse/text` - Parse raw text
- `POST /parse/to-story` - Parse to story format
- `GET /formats` - List supported formats
- `GET /mcp/tools` - MCP tool definitions

### 5. ZEGA MCP Server (Port 8006)
Model Context Protocol server for AI agent integration.

**Endpoints:**
- `GET /tools` - List all MCP tools
- `GET /resources` - List MCP resources
- `POST /tools/call` - Execute a tool
- `POST /resources/read` - Read a resource
- `POST /mcp` - JSON-RPC handler

## 🤖 MCP Integration

### For Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "zega-story-ai": {
      "url": "http://localhost:8006/mcp"
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `generate_scene` | Generate AI scene content |
| `expand_scene` | Expand existing scenes |
| `analyze_scene` | Analyze scene elements |
| `generate_scene_image` | Create scene illustrations |
| `quick_image` | Quick image from prompt |
| `transcribe_audio` | Speech to text |
| `text_to_speech` | Text to audio |
| `narrate_scene` | Scene narration |
| `generate_subtitles` | Create subtitles |
| `parse_document` | Parse documents to scenes |
| `parse_text_to_scenes` | Text to structured scenes |
| `extract_characters` | Find character names |
| `detect_genre` | Detect story genre |

### MCP Resources

| URI | Description |
|-----|-------------|
| `zega://services` | Service information |
| `zega://models` | Available AI models |
| `zega://voices` | TTS voices list |
| `zega://formats` | Supported doc formats |

## 💰 Free API Usage

All services are designed to work with **FREE** APIs:

| Service | Free Provider | Notes |
|---------|--------------|-------|
| Image Gen | Pollinations AI | Completely free, no key |
| TTS | Edge TTS | Free Microsoft voices |
| STT | Whisper (local) | Free, runs locally |
| Text AI | Groq/Ollama | Free tiers available |

## 🔧 Training Pipeline

All services collect training data for future model fine-tuning:

```
training_data/
├── image_prompts.jsonl      # Image generation examples
├── voice_transcripts.jsonl  # STT/TTS examples
├── parsing_examples.jsonl   # Document parsing examples
└── scenes.jsonl             # Scene generation examples
```

## 📊 Example Usage

### Generate Scene Image

```python
import requests

response = requests.post("http://localhost:8003/generate", json={
    "scene_title": "Dragon's Lair",
    "scene_description": "A massive dragon guards treasure in a dark cave",
    "style": "fantasy art",
    "characters": ["Dragon", "Knight"]
})

data = response.json()
print(f"Image URL: {data['image_url']}")
```

### Text to Speech

```python
import requests
import base64

response = requests.post("http://localhost:8004/synthesize", json={
    "text": "The knight approached the dragon's lair with caution.",
    "voice": "en-US-GuyNeural"
})

audio_base64 = response.json()['audio_base64']
audio_data = base64.b64decode(audio_base64)

with open("narration.mp3", "wb") as f:
    f.write(audio_data)
```

### Parse Document

```python
import requests

with open("story.pdf", "rb") as f:
    response = requests.post(
        "http://localhost:8005/parse/file",
        files={"file": f}
    )

data = response.json()
print(f"Found {data['total_scenes']} scenes")
for scene in data['scenes']:
    print(f"- {scene['title']}: {scene['summary']}")
```

### MCP Tool Call

```python
import requests

response = requests.post("http://localhost:8006/tools/call", json={
    "name": "generate_scene",
    "arguments": {
        "title": "The Final Battle",
        "genre": "fantasy",
        "characters": ["Aria", "Dark Lord"]
    }
})

result = response.json()
print(result['content'])
```

## 🛠️ Development

### Adding New Providers

Each service uses a provider pattern. Add new providers by:

1. Create provider class inheriting from base
2. Implement required methods
3. Register in the service initialization

### Custom Model Training

Training data is automatically collected. To train:

```bash
# Aggregate training data
python scripts/aggregate_training.py

# Fine-tune models (future)
python scripts/train_model.py --service image
```

## 📝 License

MIT License - Use freely for your projects!
