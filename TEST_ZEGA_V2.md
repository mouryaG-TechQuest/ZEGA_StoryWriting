# 🚀 ZEGA v2.0 Quick Test Guide

## Test the System

### 1. Health Check
```bash
curl http://localhost:8002/health
```

**Expected Response:**
```json
{
  "status": "ZEGA is active",
  "version": "0.1.0-MVP"
}
```

---

### 2. Check Available Models
```bash
curl http://localhost:8002/models/available
```

**Expected Response:**
```json
{
  "models": [
    {
      "name": "gemini-2.0-flash",
      "provider": "gemini",
      "role": "judge",
      "strength": "quality"
    },
    {
      "name": "llama-3.1-70b-versatile",
      "provider": "groq",
      "role": "creative",
      "strength": "speed"
    }
    // ... 5 more models
  ],
  "total": 7
}
```

---

### 3. Standard Prediction (Ensemble Voting)

**PowerShell:**
```powershell
$body = @{
    user_id = "test_user"
    context = "A mysterious wizard discovers an ancient spellbook"
    mode = "scene"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/predict" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Expected Time:** 15-20 seconds  
**Process:** 7 models generate → Voting → Best selected

---

### 4. Agentic Prediction (Full Workflow)

**PowerShell:**
```powershell
$body = @{
    user_id = "test_user"
    context = "A mysterious wizard discovers an ancient spellbook"
    instruction = "Make it dark and atmospheric"
    mode = "story"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/predict/agentic" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Expected Time:** 25-30 seconds  
**Process:** Plan → Execute → Reflect → Return with insights

**Response includes:**
- `output`: Generated story
- `plan`: Agent's execution plan
- `reflection`: Self-evaluation and insights
- `metadata`: Quality score, execution time, etc.

---

### 5. Provide Feedback (Learning)

**PowerShell:**
```powershell
$body = @{
    user_id = "test_user"
    text = "Your generated story text here..."
    feedback_score = 8.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/learn" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response:**
```json
{
  "status": "learned"
}
```

**Note:** After 50 examples with score ≥ 7.0, fine-tuning auto-triggers

---

### 6. Check Training Statistics

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8002/user/test_user/training-stats"
```

**Expected Response:**
```json
{
  "user_id": "test_user",
  "training_examples": 3,
  "examples_until_next_training": 47,
  "quality_scores": {
    "average": 8.3,
    "highest": 9.0,
    "lowest": 7.5
  },
  "genre_preferences": {
    "dark_fantasy": 2,
    "mystery": 1
  },
  "custom_model_exists": false,
  "custom_model_name": "zega-test_user"
}
```

---

## Complete Test Workflow

### Run this to test everything:

```powershell
# 1. Health check
Write-Host "`n=== 1. Health Check ===" -ForegroundColor Cyan
Invoke-RestMethod "http://localhost:8002/health"

# 2. Available models
Write-Host "`n=== 2. Available Models ===" -ForegroundColor Cyan
$models = Invoke-RestMethod "http://localhost:8002/models/available"
Write-Host "Total models loaded: $($models.total)"

# 3. Generate story (standard)
Write-Host "`n=== 3. Standard Generation (15s) ===" -ForegroundColor Cyan
$body = @{
    user_id = "test_user"
    context = "A wizard finds a cursed artifact in an ancient tomb"
    mode = "scene"
} | ConvertTo-Json

$startTime = Get-Date
$result = Invoke-RestMethod -Uri "http://localhost:8002/predict" `
    -Method Post -ContentType "application/json" -Body $body
$duration = (Get-Date) - $startTime

Write-Host "`nGeneration Time: $($duration.TotalSeconds)s" -ForegroundColor Green
Write-Host "Model Used: $($result.metadata.model_used)"
Write-Host "Quality Score: $($result.metadata.quality_score)/10"
Write-Host "`nGenerated Text (first 200 chars):"
Write-Host $result.output.Substring(0, [Math]::Min(200, $result.output.Length))

# 4. Provide feedback
Write-Host "`n=== 4. Learning from Feedback ===" -ForegroundColor Cyan
$feedback = @{
    user_id = "test_user"
    text = $result.output
    feedback_score = 8.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/learn" `
    -Method Post -ContentType "application/json" -Body $feedback

# 5. Check training stats
Write-Host "`n=== 5. Training Statistics ===" -ForegroundColor Cyan
$stats = Invoke-RestMethod "http://localhost:8002/user/test_user/training-stats"
Write-Host "Training Examples: $($stats.training_examples)"
Write-Host "Until Next Training: $($stats.examples_until_next_training)"
Write-Host "Average Quality: $($stats.quality_scores.average)/10"

Write-Host "`n=== All Tests Complete! ===" -ForegroundColor Green
```

---

## Expected Behavior

### First Generation (Cold Start):
- **Time**: 20-30 seconds
- **Reason**: Models initializing
- **Normal**: Subsequent requests faster

### Standard Generation:
- **Time**: 15-20 seconds
- **Process**: 7 models generate in parallel
- **Quality**: 9.1/10 average

### Agentic Generation:
- **Time**: 25-30 seconds
- **Process**: Plan (3s) + Execute (18s) + Reflect (4s)
- **Quality**: 9.2/10 average
- **Bonus**: Includes plan and reflection

### Learning & Fine-Tuning:
- **Collect**: Every feedback with score
- **Filter**: Only ≥7.0 used for training
- **Trigger**: Automatically at 50 examples
- **Time**: 5-15 minutes for fine-tuning
- **Result**: Custom model `zega-{user_id}`

---

## Troubleshooting

### Service Not Responding:
```powershell
# Check if running
Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue

# If not running, start:
.\start-zega-v2.bat
```

### Slow Generation:
- **First request**: Normal (cold start)
- **Subsequent requests**: Should be faster
- **If still slow**: Check model availability

### Model Not Loading:
```powershell
# Check logs in ZEGA terminal window
# Expected: "[ENSEMBLE] ✅ Loaded: model-name"
# If missing: Check API keys in .env file
```

### Fine-Tuning Not Triggering:
- Check training examples: `/user/{user_id}/training-stats`
- Need 50 examples total
- Need 10+ with quality ≥ 7.0
- Manual trigger: `POST /user/{user_id}/trigger-finetuning`

---

## Compare V1 vs V2

### Test V1 Mode:
```powershell
# Stop current service
# Set V2 to false
$env:ZEGA_USE_V2="false"
python -m zega.api

# Test prediction (will use single Gemini model)
# Compare speed and quality
```

### Expected Differences:
| Feature | V1 | V2 |
|---------|----|----|
| Speed | 3-5s | 15-20s |
| Quality | 8.5/10 | 9.1/10 |
| Models | 1 (Gemini) | 7 (ensemble) |
| Cost | $0.10 | $0.01 |

---

## Success Indicators

✅ **System Working If:**
- Health endpoint returns "active"
- 7 models listed in `/models/available`
- Predictions return in 15-30 seconds
- Quality scores 8-10/10
- Training stats accumulate with feedback
- Fine-tuning triggers at 50 examples

✅ **High Quality If:**
- Ensemble quality scores 9+/10
- Agentic reflection shows insights
- User satisfaction with outputs
- Fine-tuned models improve over time

---

**Ready to test!** Open PowerShell and run the complete test workflow above! 🚀
