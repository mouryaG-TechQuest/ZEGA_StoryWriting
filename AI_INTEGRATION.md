# AI Integration Guide - ZEGA Service

## Overview
The frontend now integrates directly with the ZEGA AI service running on port 8002 for AI-powered story generation and learning capabilities.

## Service Configuration

### ZEGA AI Service
- **Port:** 8002
- **URL:** http://localhost:8002
- **Health Check:** http://localhost:8002/health
- **CORS:** Enabled for localhost:5173 (Frontend)

## API Endpoints

### 1. `/predict` (POST)
Generate AI content based on context and instruction.

**Request:**
```json
{
  "user_id": "user_1",
  "context": "Story context and previous scenes",
  "instruction": "Optional specific instruction",
  "mode": "scene" | "continuation"
}
```

**Response:**
```json
{
  "content": "Generated story content"
}
```

### 2. `/learn` (POST)
Provide feedback to improve AI generation.

**Request:**
```json
{
  "user_id": "user_1",
  "text": "User-edited or approved text",
  "rating": 0.8
}
```

**Response:**
```json
{
  "status": "learned"
}
```

### 3. `/health` (GET)
Check service health status.

**Response:**
```json
{
  "status": "ZEGA is active",
  "version": "0.1.0-MVP"
}
```

## Frontend Integration

### Hook: `useAI.ts`
Located at: `Frontend/src/hooks/useAI.ts`

**Available Functions:**

1. **`getSuggestion(context)`**
   - Gets AI suggestions for story continuation
   - Uses ZEGA's `/predict` endpoint
   - Mode: `continuation`

2. **`generateScene(context, instruction?)`**
   - Generates a complete scene
   - Uses ZEGA's `/predict` endpoint
   - Mode: `scene`
   - Returns: `{ content, new_characters }`

3. **`generateStory(title, description, genre, numScenes)`**
   - Generates a full story with multiple scenes
   - Uses ZEGA's `/predict` endpoint
   - Mode: `scene`

4. **`sendFeedback(originalPrompt, generatedText, rating, userEdits?)`**
   - Sends user feedback to improve AI
   - Uses ZEGA's `/learn` endpoint
   - Rating normalized to 0-1 scale

## Usage Example

```typescript
import { useAI } from '@/hooks/useAI';

function StoryEditor() {
  const { loading, error, generateScene, sendFeedback } = useAI();

  const handleGenerate = async () => {
    const context = {
      story_title: "The Lost Kingdom",
      story_description: "An epic fantasy adventure",
      current_scene_text: "The hero approached the castle...",
      characters: [
        { name: "Arthur", role: "Hero", description: "A brave knight" }
      ],
      genre: "Fantasy"
    };

    const result = await generateScene(context, "Add dramatic tension");
    if (result) {
      console.log(result.content);
    }
  };

  const handleFeedback = async (generatedText: string, userEdits: string) => {
    await sendFeedback("", generatedText, 4.5, userEdits);
  };

  return (
    <div>
      {loading && <p>Generating...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleGenerate}>Generate Scene</button>
    </div>
  );
}
```

## Configuration Changes Made

### 1. Frontend Updates
- Changed all API calls from port 8001 → 8002
- Updated endpoints to match ZEGA API structure
- Added proper context formatting for ZEGA

### 2. Backend Updates
- Added CORS middleware to ZEGA (`api.py`)
- Allowed origins: `http://localhost:5173`, `http://localhost:3000`
- Fixed module import paths for proper loading

## Testing

### Test ZEGA Health
```bash
curl http://localhost:8002/health
```

### Test Generate Scene
```bash
curl -X POST http://localhost:8002/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "context": "Once upon a time in a magical forest...",
    "instruction": "Continue the story",
    "mode": "scene"
  }'
```

### Test Learning
```bash
curl -X POST http://localhost:8002/learn \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "text": "The hero discovered a hidden treasure.",
    "rating": 0.9
  }'
```

## Troubleshooting

### Issue: Connection Refused on Port 8002
**Solution:** Ensure ZEGA is running
```bash
cd AIservices\zega
python -m uvicorn api:app --host 0.0.0.0 --port 8002
```

### Issue: CORS Errors
**Solution:** Check CORS middleware is enabled in `api.py`
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Module Not Found Error
**Solution:** Ensure sys.path is configured in `api.py`
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
```

## AI Model Configuration

### Teachers (Ensemble)
1. **Google Gemini Pro** - Primary generation model
2. **Llama 3 70B (Groq)** - Fast inference for quick responses

### Memory System
- **Storage:** ChromaDB
- **Purpose:** Style adaptation and user preferences
- **Location:** `AIservices/zega/zega_store/`

## Environment Variables

Required in `AIservices/zega/.env`:
```env
GOOGLE_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

## Performance Notes

- **Response Time:** ~2-5 seconds for scene generation
- **Context Window:** Handles up to 8000 tokens
- **Learning:** Feedback improves future generations
- **Memory:** ~300-500MB RAM usage

## Future Enhancements

1. **Rate Limiting:** Add request throttling for production
2. **Authentication:** Integrate with User Service JWT
3. **Caching:** Implement Redis for frequent requests
4. **Streaming:** Add SSE for real-time generation updates
5. **Analytics:** Track generation quality metrics
