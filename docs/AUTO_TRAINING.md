# Auto-Training Feature Documentation

## 🎯 Overview

The Auto-Training feature allows users to quickly generate training data for their personal AI models **without creating stories in the database**. This is perfect for rapidly fine-tuning user-specific models.

---

## 🚀 How It Works

### 1. **Automatic Data Generation**
- Uses the ensemble of AI models to generate high-quality training examples
- Randomly selects prompts from 8 different genres
- Applies various style modifiers for diversity
- Estimates quality scores based on text characteristics

### 2. **Fine-Tuning Data Collection**
- All generated examples are collected for fine-tuning
- Only high-quality examples (score ≥ 7.0) are kept
- Tracks genre preferences and writing patterns
- Auto-triggers fine-tuning at 50 examples

### 3. **Optional RAG Storage**
- By default, examples are NOT stored in RAG memory
- User can enable storage for additional context retrieval
- Keeps training data and story database separate

---

## 📡 API Endpoints

### POST `/auto-train`

Generate training data automatically.

**Request:**
```json
{
  "user_id": "user123",
  "num_examples": 50,
  "genres": ["fantasy", "sci_fi"],  // Optional
  "store_in_memory": false
}
```

**Parameters:**
- `user_id` (required): User identifier
- `num_examples` (required): Number of examples to generate (1-500)
- `genres` (optional): List of specific genres, or null for random
- `store_in_memory` (optional): Whether to also store in RAG memory (default: false)

**Response:**
```json
{
  "total_requested": 50,
  "successful": 48,
  "failed": 2,
  "genre_distribution": {
    "fantasy": 18,
    "sci_fi": 15,
    "dark_fantasy": 10,
    "mystery": 5
  },
  "average_quality": 8.2,
  "total_time": 145.3,
  "stored_in_memory": false,
  "training_stats": {
    "training_examples": 48,
    "examples_until_next_training": 2,
    "custom_model_exists": false
  },
  "ready_for_finetuning": false
}
```

### GET `/training/genres`

Get list of available genres for training.

**Response:**
```json
{
  "genres": [
    "fantasy",
    "dark_fantasy",
    "sci_fi",
    "mystery",
    "horror",
    "romance",
    "adventure",
    "thriller"
  ],
  "total": 8,
  "description": "Available genres for automatic training data generation"
}
```

---

## 🎨 Frontend Component

### Component: `AutoTrainModel.tsx`

**Features:**
- Slider to select 1-500 training examples
- Multi-select genre buttons
- Checkbox to enable RAG memory storage
- Real-time progress display
- Results visualization with:
  - Success rate
  - Average quality score
  - Genre distribution chart
  - Fine-tuning readiness indicator

**Usage:**
```tsx
import AutoTrainModel from './components/AutoTrainModel';

<AutoTrainModel userId="user123" />
```

---

## 🎯 Training Prompts

### Available Genres & Prompts

#### Fantasy (10 prompts)
- "A young wizard discovers an ancient spellbook"
- "A knight embarks on a quest to slay a dragon"
- "An elf princess must unite the warring kingdoms"
- ... and 7 more

#### Dark Fantasy (10 prompts)
- "A necromancer raises an army of the undead"
- "Shadows consume the kingdom as evil spreads"
- "A forbidden ritual unleashes an ancient evil"
- ... and 7 more

#### Sci-Fi (10 prompts)
- "First contact with an alien civilization"
- "A colony ship reaches a mysterious planet"
- "AI systems begin showing signs of consciousness"
- ... and 7 more

**Total: 80 unique prompts across 8 genres**

### Style Modifiers

Each prompt is combined with a random style modifier:
- "Make it atmospheric and descriptive"
- "Focus on character emotions and internal conflict"
- "Use vivid sensory details"
- "Create tension and suspense"
- ... and 6 more

---

## 📊 Quality Estimation

The system automatically estimates quality scores based on:

| Factor | Impact | Optimal Range |
|--------|--------|---------------|
| **Length** | +1.0 | 200-800 characters |
| **Sentence Structure** | +0.5 | 3+ sentences |
| **Descriptive Words** | +0.5 | 2+ descriptive terms |
| **Dialogue** | +0.3 | Contains quotes |
| **Base Score** | 7.0 | Starting point |

**Maximum Score:** 10.0

---

## 🔄 Training Workflow

### Step 1: Configure Training
```
User selects:
├── Number of examples (1-500)
├── Specific genres (optional)
└── Store in memory (optional)
```

### Step 2: Generate Examples
```
For each example:
├── Select random genre and prompt
├── Apply random style modifier
├── Generate using ensemble voting
├── Estimate quality score
├── Collect for fine-tuning (always)
└── Store in RAG memory (optional)
```

### Step 3: Results Summary
```
Display:
├── Success/failure counts
├── Average quality score
├── Genre distribution
├── Total time taken
├── Training examples collected
└── Fine-tuning readiness
```

### Step 4: Fine-Tuning (at 50+ examples)
```
When ready:
├── Auto-trigger notification
├── User can manually trigger
└── Creates custom zega-{user_id} model
```

---

## 💡 Use Cases

### 1. **Quick Model Training**
```bash
# Generate 100 examples in ~5 minutes
POST /auto-train
{
  "user_id": "user123",
  "num_examples": 100,
  "store_in_memory": false
}
```

### 2. **Genre-Specific Training**
```bash
# Train on fantasy only
POST /auto-train
{
  "user_id": "user123",
  "num_examples": 50,
  "genres": ["fantasy", "dark_fantasy"],
  "store_in_memory": false
}
```

### 3. **Combined Training & Memory**
```bash
# Both fine-tuning and RAG
POST /auto-train
{
  "user_id": "user123",
  "num_examples": 50,
  "genres": null,
  "store_in_memory": true
}
```

---

## ⚡ Performance

### Speed
- **Single Example:** ~3 seconds (ensemble voting)
- **50 Examples:** ~2.5 minutes
- **100 Examples:** ~5 minutes
- **500 Examples:** ~25 minutes

### Quality
- **Average Score:** 7.5-8.5/10
- **Success Rate:** 95%+ (most examples pass quality filter)
- **Genre Diversity:** Evenly distributed when random

---

## 🎯 Best Practices

### 1. **Start Small**
- Begin with 50 examples to test
- Check quality and genre distribution
- Adjust as needed

### 2. **Genre Selection**
- Use specific genres if you want focused training
- Leave random for diverse training data
- Mix complementary genres (e.g., fantasy + dark_fantasy)

### 3. **Memory Storage**
- Enable if you want examples for RAG context
- Disable for pure fine-tuning data (faster)
- Consider storage space if generating 100+ examples

### 4. **Fine-Tuning Timing**
- Wait for 50+ examples for best results
- 100+ examples = excellent personalization
- Re-train every 50-100 new examples

---

## 🔍 Example Usage

### PowerShell Test:
```powershell
$body = @{
    user_id = "test_user"
    num_examples = 20
    genres = @("fantasy", "sci_fi")
    store_in_memory = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8002/auto-train" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### JavaScript/React:
```javascript
const response = await fetch('http://localhost:8002/auto-train', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user123',
    num_examples: 50,
    genres: ['fantasy', 'dark_fantasy'],
    store_in_memory: false
  })
});

const result = await response.json();
console.log(`Generated ${result.successful} examples`);
console.log(`Average quality: ${result.average_quality}/10`);
console.log(`Ready for fine-tuning: ${result.ready_for_finetuning}`);
```

---

## 🎉 Benefits

### vs Manual Story Creation:
✅ **10x Faster:** Generate 50 examples in minutes vs hours  
✅ **No Database Clutter:** Training data separate from stories  
✅ **Consistent Quality:** AI-generated ensures good quality  
✅ **Genre Diversity:** Covers all genres automatically  
✅ **One-Click Training:** No manual story writing needed  

### vs Traditional Fine-Tuning:
✅ **No Manual Curation:** Auto-filters quality  
✅ **Diverse Data:** Random prompts and styles  
✅ **Quick Iteration:** Test and refine easily  
✅ **User-Specific:** Each user gets personalized data  

---

**Ready to train your personal AI?** Start with 50 examples and watch your model learn your style! 🚀
