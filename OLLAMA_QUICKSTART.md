# 🦙 OLLAMA QUICK START COMMANDS

## 🎯 INSTALL MODELS (Run These First!)

### Minimal Setup (Recommended):
```bash
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull mistral:7b-instruct-v0.3-q4_K_M
```

### Full Setup (Best Quality):
```bash
ollama pull llama3.1:8b-instruct-q4_K_M
ollama pull mistral:7b-instruct-v0.3-q4_K_M
ollama pull phi3.5:3.8b-mini-instruct-q4_K_M
ollama pull gemma2:9b-instruct-q4_K_M
```

---

## ✅ VERIFY

```bash
# List installed models
ollama list

# Test Ollama is running
curl http://localhost:11434/api/tags

# Test a model
ollama run llama3.1:8b-instruct-q4_K_M "Write a short fantasy story"
```

---

## 🔄 RESTART ZEGA

```bash
# Install dependencies
cd AIservices
pip install httpx==0.27.0

# Restart ZEGA
taskkill /F /IM python.exe
cd zega
python -m zega.api
```

---

## 🧪 TEST INTEGRATION

```bash
# Check ZEGA loaded Ollama models
curl http://localhost:8002/metrics

# Should show in "active_teachers":
# - gemini-2.0-flash
# - llama3.1:8b-instruct-q4_K_M
# - mistral:7b-instruct-v0.3-q4_K_M
```

---

## 🎨 USE IN APP

1. Open: http://localhost:5173
2. Click: "🤖 AI Story Generator"
3. Click: "🎲 Random Story" or enter prompt
4. Watch console for: `[INFO] Using llama3.1:8b-instruct-q4_K_M (local)`

---

## 📊 MODEL COMPARISON

| Task | Best Model |
|------|-----------|
| **Creative Stories** | Llama 3.1 8B |
| **Structured JSON** | Mistral 7B |
| **Fast Autocomplete** | Phi-3.5 Mini |
| **Quality Judge** | Gemini (API) |

---

## 🐛 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| "No Ollama models found" | Run `ollama list` to verify |
| "Cannot connect to Ollama" | Restart Ollama app |
| Models not in metrics | Restart ZEGA service |
| Slow generation | Use smaller model (phi3.5) |

---

## 💡 PRO TIPS

1. **Llama = Best for creative writing** (stories, descriptions)
2. **Mistral = Best for structured outputs** (JSON, genres)
3. **Phi-3.5 = Ultra-fast** (autocomplete, suggestions)
4. **Gemini = Fallback** (when Ollama fails)

---

## 📏 SYSTEM REQUIREMENTS

- **RAM**: 8GB minimum (12GB+ recommended)
- **Storage**: 10GB for 2 models, 20GB for 4 models
- **CPU**: Modern processor (4+ cores recommended)
- **GPU**: Optional (speeds up inference 3-5x)

---

## 🎓 WHAT YOU GET

✅ **90% requests stay local** (privacy + speed)  
✅ **No API costs** for Ollama generations  
✅ **Works offline** (except Gemini fallback)  
✅ **Better quality** (ensemble of 3-4 models)  
✅ **User personalization** (RAG from ChromaDB)  

---

**Read full guide**: `docs/OLLAMA_SETUP.md`  
**Model details**: `docs/OLLAMA_MODEL_GUIDE.md`  
**Architecture**: `docs/ZEGA_TECHNICAL_OVERVIEW.md`
