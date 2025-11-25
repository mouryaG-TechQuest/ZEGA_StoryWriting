# ZEGA v2.0 API Reference

## 📡 Endpoints

### Base URL
```
http://localhost:8002
```

---

## 🎯 Prediction Endpoints

### 1. Standard Prediction (Ensemble Voting)

**Endpoint**: `POST /predict`

**Description**: Generate story content using multi-model ensemble voting. All available models generate in parallel, and Gemini judges the best output.

**Request Body**:
```json
{
  "user_id": "string",        // Required: User identifier
  "context": "string",         // Required: Story context/prompt
  "genre": "string",           // Optional: Genre (fantasy, sci-fi, etc.)
  "mode": "string"            // Optional: scene, story, character (default: scene)
}
```

**Response**:
```json
{
  "output": "string",          // Generated text
  "metadata": {
    "model_used": "string",    // Winning model name
    "provider": "string",      // Provider (gemini, groq, hf, ollama)
    "total_candidates": 8,     // Models that generated
    "valid_responses": 7,      // Valid responses received
    "quality_score": 9.2,      // Quality score (1-10)
    "execution_time": 14.3     // Total time in seconds
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:8002/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "context": "A wizard discovers a cursed artifact",
    "genre": "dark_fantasy",
    "mode": "scene"
  }'
```

---

### 2. Agentic Prediction (V2 Only)

**Endpoint**: `POST /predict/agentic`

**Description**: Use full agentic AI workflow with planning, execution, and reflection. The agent creates a multi-step plan, executes it autonomously, and reflects on the output quality.

**Request Body**:
```json
{
  "user_id": "string",        // Required: User identifier
  "context": "string",         // Required: Story context/prompt
  "instruction": "string",     // Optional: Special instructions
  "mode": "string"            // Optional: scene, story, character
}
```

**Response**:
```json
{
  "output": "string",          // Generated text
  "metadata": {
    "model_used": "string",    // Model selected by agent
    "quality_score": 9.2,      // Quality score
    "execution_time": 21.5,    // Total time
    "plan_steps": 5            // Number of plan steps
  },
  "plan": {
    "goal": "string",          // Agent's understanding of task
    "steps": [                 // Execution plan
      {
        "tool": "string",      // Tool used
        "input": {},           // Tool input
        "reason": "string"     // Why this step
      }
    ]
  },
  "reflection": {
    "success": true,           // Did agent succeed?
    "success_rate": 1.0,       // Success rate (0-1)
    "quality_score": 9.2,      // Self-evaluated quality
    "insights": [              // Learned insights
      "string"
    ],
    "improvements": [          // Suggested improvements
      "string"
    ]
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:8002/predict/agentic \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "context": "A wizard discovers a cursed artifact",
    "instruction": "Make it dark and mysterious",
    "mode": "story"
  }'
```

**Difference from `/predict`**:
- `/predict`: Fast, ensemble voting only (~15s)
- `/predict/agentic`: Slower, full planning + reflection (~25s)
- Use `/predict` for quick generation
- Use `/predict/agentic` when you want best quality with insights

---

## 🎓 Learning Endpoint

### 3. Learn from Feedback

**Endpoint**: `POST /learn`

**Description**: Store user feedback to improve future predictions. Collects training data for fine-tuning.

**Request Body**:
```json
{
  "user_id": "string",        // Required: User identifier
  "text": "string",            // Required: Generated text to learn from
  "feedback_score": 8.5        // Required: Quality rating (1-10)
}
```

**Response**:
```json
{
  "status": "learned"
}
```

**Example**:
```bash
curl -X POST http://localhost:8002/learn \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "text": "The wizard gazed at the cursed artifact...",
    "feedback_score": 9.0
  }'
```

**Note**: If V2 is enabled and user has ≥50 examples with score ≥7.0, this will auto-trigger fine-tuning.

---

## 📊 Fine-Tuning Endpoints (V2 Only)

### 4. Get Training Statistics

**Endpoint**: `GET /user/{user_id}/training-stats`

**Description**: Retrieve fine-tuning progress and statistics for a user.

**Path Parameters**:
- `user_id` (string): User identifier

**Response**:
```json
{
  "user_id": "string",
  "training_examples": 73,             // Total collected examples
  "examples_until_next_training": 27,  // Examples until auto-trigger
  "last_fine_tune": "2024-01-15T10:30:00Z",  // Last training date
  "quality_scores": {
    "average": 8.3,
    "highest": 9.7,
    "lowest": 7.1
  },
  "genre_preferences": {               // Genre distribution
    "dark_fantasy": 32,
    "sci_fi": 24,
    "mystery": 12,
    "other": 5
  },
  "total_training_steps": 730,         // Total training iterations
  "custom_model_exists": true,         // Is custom model created?
  "custom_model_name": "zega-user123"  // Custom model name
}
```

**Example**:
```bash
curl http://localhost:8002/user/user123/training-stats
```

---

### 5. Manually Trigger Fine-Tuning

**Endpoint**: `POST /user/{user_id}/trigger-finetuning`

**Description**: Manually trigger fine-tuning for a user (bypasses auto-trigger threshold).

**Path Parameters**:
- `user_id` (string): User identifier

**Response**:
```json
{
  "status": "success",                       // success or failed
  "message": "Fine-tuned model 'zega-user123' created",
  "training_examples_used": 73,              // Examples used in training
  "training_time_seconds": 847,              // Time taken
  "model_size_mb": 156                       // Model size
}
```

**Example**:
```bash
curl -X POST http://localhost:8002/user/user123/trigger-finetuning
```

**Note**: Requires at least 10 examples with quality ≥ 7.0 to succeed.

---

## 🤖 Model Management Endpoints (V2 Only)

### 6. Get Available Models

**Endpoint**: `GET /models/available`

**Description**: List all available teacher models in the ensemble.

**Response**:
```json
{
  "models": [
    {
      "name": "gemini-2.0-flash",
      "provider": "gemini",
      "status": "active",
      "type": "cloud"
    },
    {
      "name": "llama-3.1-70b-versatile",
      "provider": "groq",
      "status": "active",
      "type": "free_api"
    },
    {
      "name": "llama3.1:8b-instruct-q4_K_M",
      "provider": "ollama",
      "status": "active",
      "type": "local"
    }
  ],
  "total": 8
}
```

**Example**:
```bash
curl http://localhost:8002/models/available
```

---

## 👤 User Profile Endpoints

### 7. Get User Profile

**Endpoint**: `GET /user/{user_id}/profile`

**Description**: Retrieve user's writing profile and history statistics.

**Path Parameters**:
- `user_id` (string): User identifier

**Response**:
```json
{
  "user_id": "string",
  "total_stories": 123,
  "favorite_genres": {
    "dark_fantasy": 45,
    "sci_fi": 38,
    "mystery": 28,
    "romance": 12
  },
  "average_quality": 8.4,
  "writing_patterns": {
    "preferred_length": "medium",     // short, medium, long
    "descriptiveness": "high",        // low, medium, high
    "character_focus": "high",
    "pacing": "slow_burn"             // fast, medium, slow_burn
  },
  "top_themes": [
    "forbidden_knowledge",
    "moral_ambiguity",
    "ancient_evil"
  ]
}
```

**Example**:
```bash
curl http://localhost:8002/user/user123/profile
```

---

## 🏥 Health & Metrics Endpoints

### 8. Health Check

**Endpoint**: `GET /health`

**Description**: Check if ZEGA service is running.

**Response**:
```json
{
  "status": "ZEGA is active",
  "version": "0.1.0-MVP",
  "mode": "v2"                    // v1 or v2
}
```

**Example**:
```bash
curl http://localhost:8002/health
```

---

### 9. System Metrics

**Endpoint**: `GET /metrics`

**Description**: Get detailed system metrics and statistics.

**Response**:
```json
{
  "model": {
    "total_predictions": 217,
    "total_learns": 113,
    "average_quality": 8.3,
    "models_loaded": 8,              // V2 only
    "ensemble_enabled": true         // V2 only
  },
  "memory": {
    "total_documents": 113,
    "total_users": 3,
    "storage_size_mb": 45.2
  },
  "status": "healthy"
}
```

**Example**:
```bash
curl http://localhost:8002/metrics
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ZEGA_USE_V2` | `true` | Enable V2 agentic mode |
| `GOOGLE_API_KEY` | Required | Gemini API key |
| `GROQ_API_KEY` | Required | Groq API key |
| `HUGGINGFACEHUB_API_TOKEN` | Required | HuggingFace token |
| `CHROMA_PATH` | `./chroma_db` | ChromaDB storage path |
| `FINETUNING_DATA_PATH` | `./fine_tune_data` | Fine-tuning data path |

### Request Headers

All endpoints accept:
```
Content-Type: application/json
```

### Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Not Found (user/resource not found) |
| 500 | Internal Server Error |

---

## 📊 Rate Limits

### Free API Limits

| Provider | Limit | Notes |
|----------|-------|-------|
| Gemini | 60 requests/minute | Paid API |
| Groq | 30 requests/minute | Free tier |
| HuggingFace | 1000 requests/day | Free tier |
| Ollama | Unlimited | Local (no API) |

**Recommendation**: Use V2 ensemble voting to distribute load across providers and stay within limits.

---

## 🔍 Error Responses

### Standard Error Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Errors

#### 1. Missing User ID
```json
{
  "detail": "user_id is required"
}
```

#### 2. Invalid Quality Score
```json
{
  "detail": "feedback_score must be between 1 and 10"
}
```

#### 3. Model Not Available
```json
{
  "detail": "Custom model zega-user123 not found"
}
```

#### 4. Insufficient Training Data
```json
{
  "detail": "Need at least 10 examples with quality >= 7.0 for fine-tuning"
}
```

---

## 📝 Example Workflows

### Workflow 1: Generate Story with Feedback

```bash
# Step 1: Generate story
curl -X POST http://localhost:8002/predict \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "context": "A wizard...", "mode": "story"}'

# Step 2: Provide feedback
curl -X POST http://localhost:8002/learn \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "text": "...", "feedback_score": 9.0}'

# Step 3: Check progress
curl http://localhost:8002/user/user123/training-stats
```

### Workflow 2: Manual Fine-Tuning

```bash
# Step 1: Check training stats
curl http://localhost:8002/user/user123/training-stats

# Step 2: Trigger fine-tuning (if >= 10 examples)
curl -X POST http://localhost:8002/user/user123/trigger-finetuning

# Step 3: Generate with custom model
curl -X POST http://localhost:8002/predict \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "context": "...", "use_custom_model": true}'
```

### Workflow 3: Agentic Generation with Insights

```bash
# Step 1: Use agentic mode
curl -X POST http://localhost:8002/predict/agentic \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "context": "A wizard discovers a cursed artifact",
    "instruction": "Make it dark and mysterious",
    "mode": "story"
  }'

# Response includes plan, execution, and reflection
# Use insights to improve future requests
```

---

## 🎯 Best Practices

### 1. Choose the Right Endpoint

- **Quick generation**: Use `/predict` (15s, ensemble voting)
- **Best quality + insights**: Use `/predict/agentic` (25s, full agent)
- **Learning**: Always call `/learn` after generation with user rating

### 2. Provide Quality Feedback

- Rate generated content honestly (1-10)
- Only high-quality examples (≥7.0) are used for fine-tuning
- More feedback = better personalization

### 3. Monitor Training Progress

- Check `/user/{user_id}/training-stats` regularly
- Trigger fine-tuning manually if auto-trigger is slow
- Verify custom model exists before using

### 4. Use Available Models Efficiently

- Check `/models/available` to see which models are loaded
- Ensemble voting automatically uses all available models
- Local Ollama models preferred (faster, free, private)

---

## 🔗 Related Documentation

- **Agentic AI**: See `docs/ZEGA_V2_AGENTIC_AI.md`
- **Ensemble Voting**: See `docs/ENSEMBLE_VOTING.md`
- **Fine-Tuning**: See `docs/FINETUNING_GUIDE.md`
- **Setup**: See `docs/OLLAMA_SETUP.md`

---

**Need help?** Check the troubleshooting section in `docs/guides/TROUBLESHOOTING.md`
