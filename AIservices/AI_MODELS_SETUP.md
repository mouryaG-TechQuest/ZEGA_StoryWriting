# AI Models Setup & Troubleshooting

## Model Priority Order (Fastest to Slowest)

ZEGA uses 7 AI models with smart fallback:

### Priority 1: Google Gemini ⚡ (FASTEST)
- **Model**: gemini-2.0-flash
- **Speed**: ~1-2 seconds
- **Quota**: 200 requests/day (free tier)
- **Status**: ✅ Working (but quota may be exceeded)

### Priority 2: Groq API 🚀 (ULTRA FAST)
- **Models**: 
  - llama-3.1-70b-versatile
  - mixtral-8x7b-32768
- **Speed**: ~0.5-1 seconds
- **Quota**: Very generous (30,000+ requests/day)
- **Status**: ✅ Fixed - proper message formatting

### Priority 3: HuggingFace 🤗 (FREE)
- **Models**:
  - HuggingFaceH4/zephyr-7b-beta
  - microsoft/DialoGPT-large
- **Speed**: ~3-8 seconds (model loading time)
- **Quota**: Free tier available
- **Status**: ✅ Updated to working models

### Priority 4: Ollama 💻 (LOCAL - NO LIMITS)
- **Models**:
  - llama3.1:8b-instruct-q4_K_M
  - mistral:7b-instruct-v0.3-q4_K_M
- **Speed**: ~2-5 seconds (local inference)
- **Quota**: UNLIMITED (runs on your PC)
- **Status**: ⚠️ Optional (needs Ollama installed)

## Quick Fixes Applied

### ✅ Fixed Issues:
1. **Gemini Quota Exceeded**: System now tries other models when quota hit
2. **Groq 400 Errors**: Fixed message format and added proper error handling
3. **HuggingFace 410 Errors**: Replaced deprecated models with working alternatives
4. **Ollama Timeout**: Reduced from 5s to 3s for faster fallback to cloud APIs
5. **Slow Response**: Now tries Gemini first (fastest), falls back quickly

### 🎯 Performance Optimizations:
- **Gemini First**: Always tries fastest API first
- **Quick Fallback**: 3s timeout for Ollama, 20s for Groq, 30s for HF
- **No Delays**: Removed inter-model delays (was 2s, now 0.2s)
- **Smart Retry**: Max 1 retry per model (was 2)

## Common Errors & Solutions

### "429 Quota Exceeded" (Gemini)
**Problem**: You've used all 200 free requests today
**Solution**: System automatically uses Groq/HF. Wait until tomorrow or upgrade Gemini plan.

### "400 Bad Request" (Groq)
**Status**: ✅ FIXED - Updated API format

### "410 Gone" (HuggingFace)
**Status**: ✅ FIXED - Using working models now

### "Ollama timeout"
**Solution**: Ollama not running or models not installed. System automatically uses cloud APIs.
**Optional Setup**:
```bash
# Install Ollama (optional - for unlimited local inference)
# Download from: https://ollama.ai/download

# Pull models (optional)
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull mistral:7b-instruct-v0.3-q4_K_M
```

## API Keys Required

Check your `.env` file in `AIservices` folder:

```env
# Required (at least ONE of these)
GOOGLE_API_KEY=your_key_here           # Gemini (200/day limit)
GROQ_API_KEY=your_key_here             # Groq (30k+/day limit)
HUGGINGFACEHUB_API_TOKEN=your_key_here # HuggingFace (free tier)

# Optional (for unlimited local inference)
# No key needed - just install Ollama
```

## Testing Your Setup

### 1. Check which models loaded:
Look for startup logs:
```
[ENSEMBLE] ✅ Loaded: Gemini 2.0 Flash
[ENSEMBLE] ✅ Loaded: Groq llama-3.1-70b-versatile
[ENSEMBLE] ✅ Loaded: Groq mixtral-8x7b-32768
[ENSEMBLE] ✅ Loaded: HF zephyr-7b-beta
[ENSEMBLE] ✅ Loaded: HF DialoGPT-large
[ENSEMBLE] ✅ Loaded: Ollama llama3.1:8b-instruct-q4_K_M
[ENSEMBLE] ✅ Loaded: Ollama mistral:7b-instruct-v0.3-q4_K_M
[ENSEMBLE] 🎓 Total teachers loaded: 7
```

### 2. Test API endpoint:
```bash
curl http://localhost:8002/health
```

### 3. Check which model responded:
Look for success logs:
```
[ENSEMBLE] 🎯 Trying priority group 1 (gemini)...
[ENSEMBLE] ✅ Success from gemini-2.0-flash
```

## Performance Expectations

| Scenario | Speed | Notes |
|----------|-------|-------|
| **Gemini Available** | ~1-2s | ⚡ Fastest |
| **Gemini Quota Hit + Groq** | ~2-3s | 🚀 Still very fast |
| **Groq Failed + HuggingFace** | ~5-10s | 🤗 Slower but free |
| **All Cloud Failed + Ollama** | ~3-5s | 💻 Local fallback |
| **All Failed** | Error | 🚨 Check API keys |

## Troubleshooting

### No models loading?
1. Check `.env` file exists in `AIservices/` folder
2. Verify at least one API key is valid
3. Restart ZEGA service: `stop-all.bat` then `run-all.bat`

### Slow responses?
1. **Best**: Ensure Gemini API key is valid (fastest)
2. **Good**: Check Groq API key (2nd fastest)
3. **OK**: HuggingFace works but slower (model loading time)
4. **Local**: Install Ollama for unlimited fast inference

### All models failing?
1. Check internet connection
2. Verify API keys are not expired
3. Check API status pages:
   - Gemini: https://status.cloud.google.com/
   - Groq: https://status.groq.com/
   - HuggingFace: https://status.huggingface.co/

## Getting More Quota

### Gemini (Currently Limited to 200/day)
- **Free Tier**: 200 requests/day
- **Upgrade**: https://ai.google.dev/pricing
- **Paid Tier**: 1,500 requests/minute ($0.002/request)

### Groq (RECOMMENDED - Very Generous)
- **Free Tier**: ~30,000 requests/day
- **Get Key**: https://console.groq.com/
- **Speed**: Ultra fast inference

### HuggingFace (Free Alternative)
- **Free Tier**: Available
- **Get Token**: https://huggingface.co/settings/tokens
- **Note**: Slower but works

## Recommended Setup

**For Best Performance**:
1. ✅ **Gemini** - Fast (until quota)
2. ✅ **Groq** - Very fast backup
3. ✅ **HuggingFace** - Free fallback
4. ⚡ **Ollama** (Optional) - Unlimited local

This gives you:
- **Fast responses** when Gemini available
- **Automatic fallback** to Groq (still very fast)
- **Free backup** with HuggingFace
- **Unlimited** with Ollama (if installed)

**Current Status**: ✅ All fixed! System will automatically use best available model.
