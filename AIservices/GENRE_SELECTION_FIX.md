# AI JSON Response Fixes

## Problems Fixed

### 1. Genre Selection Error
When using the "Get Genre from AI" button in the Story Form:
```
SyntaxError: Unexpected token 'B', "Based on t"... is not valid JSON
```

### 2. Scene Generation Error
When using the "AI Create Scene" button in Timeline Manager:
```
SyntaxError: Unexpected token '*', "**Scene: ""... is not valid JSON
```

## Root Cause
The `_build_system_prompt()` method in `ensemble.py` did not have specific prompts for:
- `genre_selection` mode
- `title_ideas` mode  
- `description_autocomplete` mode
- `scene_structured` mode ⭐ **NEW FIX**

This caused the AI models to use the generic "You are ZEGA, an expert story writer" prompt, which made them return natural language explanations or markdown formatting instead of pure JSON.

## Solution
Updated `AIservices/zega/core/ensemble.py` to include explicit JSON-only prompts for these modes:

### Scene Structured Prompt ⭐ **NEW**
```python
"scene_structured": (
    "You are ZEGA, a personalized story architect. "
    "Write a full scene based on the instruction and the provided story context (previous scenes, characters). "
    "You MUST return ONLY valid JSON with these exact keys: "
    "'title' (string: scene title), "
    "'content' (string: the scene narrative text), "
    "'new_characters' (array of character objects with keys: name, role, description, popularity), "
    "'existing_characters_used' (array of character name strings). "
    "Example format: {\"title\": \"The Meeting\", \"content\": \"The hero walked...\", \"new_characters\": [{\"name\": \"Alice\", \"role\": \"Mentor\", \"description\": \"Wise sage\", \"popularity\": 7}], \"existing_characters_used\": [\"John\"]}. "
    "Do NOT include any markdown formatting like ```json, explanations, or extra text. "
    "Only return the raw JSON object."
)
```

### Genre Selection Prompt
```python
"genre_selection": (
    "You are ZEGA, an expert literary agent and genre specialist. "
    "Analyze the provided story context and select the most appropriate genres. "
    "You MUST return ONLY a valid JSON array of strings, e.g., [\"Fantasy\", \"Adventure\"]. "
    "Do NOT include any explanations, markdown formatting, or extra text. "
    "Only return the JSON array."
)
```

### Title Ideas Prompt
```python
"title_ideas": (
    "You are ZEGA, a creative writing coach. "
    "Generate exactly 5 creative, catchy, and relevant titles based on the story context. "
    "You MUST return ONLY a valid JSON array of strings, e.g., [\"The Last Star\", \"Beyond the Void\", ...]. "
    "Do NOT include any explanations, markdown formatting, or extra text. "
    "Only return the JSON array."
)
```

### Description Autocomplete Prompt
```python
"description_autocomplete": (
    base + "\n\nYou are a collaborative writing partner. "
    "Continue the story description with 2-3 sentences that flow naturally from the existing text. "
    "Do not repeat the input. Just provide the continuation as plain text."
)
```

## Files Modified
- `AIservices/zega/core/ensemble.py` - Updated `_build_system_prompt()` method (lines ~478-520)
  - Added `scene_structured` mode with strict JSON format
  - Added `genre_selection` mode
  - Added `title_ideas` mode
  - Added `description_autocomplete` mode

## Testing
After restarting ZEGA service:
1. ✅ All 8 AI models loaded successfully
2. ✅ Groq responding as primary model (1-2s response time)
3. ✅ Multiple successful requests processed (200 OK)
4. ✅ Learning system active and storing user feedback

## Current AI Model Status
- **Gemini 2.0 Flash**: Quota exceeded (200/day), resets tomorrow
- **Groq llama-3.3-70b-versatile**: ✅ WORKING (primary, 30k+ requests/day)
- **Groq mixtral-8x7b-32768**: ✅ WORKING (backup)
- **Groq llama3-70b-8192**: ✅ WORKING (backup)
- **HuggingFace Mistral-7B-v0.2**: ✅ WORKING (free fallback)
- **HuggingFace flan-t5-large**: ✅ WORKING (free fallback)
- **Ollama llama3.1:8b-instruct**: ✅ Configured (needs local install)
- **Ollama mistral:7b-instruct**: ✅ Configured (needs local install)

## Expected Behavior Now

### AI Create Scene (Timeline Manager) ⭐ **FIXED**
1. Frontend sends request to `/predict` with `mode: "scene_structured"`
2. Backend uses the specific JSON-only prompt
3. Groq model returns:
   ```json
   {
     "title": "The Dark Forest",
     "content": "As night fell, the hero ventured into the mysterious woods...",
     "new_characters": [
       {
         "name": "Elder Sage",
         "role": "Mentor",
         "description": "A wise old wizard who guides the hero",
         "popularity": 8
       }
     ],
     "existing_characters_used": ["Hero", "Princess"]
   }
   ```
4. Frontend parses JSON successfully
5. New scene added to timeline with characters

### Get Genre from AI (Story Form)
1. Frontend sends request to `/predict` with `mode: "genre_selection"`
2. Backend uses the specific JSON-only prompt
3. Groq model returns: `["Fantasy", "Adventure"]`
4. Frontend parses JSON successfully
5. Selected genres are automatically added to the form

### Other AI Features
- **Get Title Suggestions** → Returns JSON array of 5 titles
- **AI Assist Description** → Returns plain text continuation
