# AI Story Generator - Step-by-Step Implementation

## 🎯 Overview

The AI Story Generator creates complete stories step-by-step using the ZEGA AI model. It generates stories in 5 distinct phases while training the AI and showing real-time progress to users.

## ✨ Key Features

### 1. **Step-by-Step Generation**
- **Step 1 (15%)**: Generate Title & Description
- **Step 2 (30%)**: Create Character Profiles
- **Step 3 (60%)**: Write Detailed Scenes
- **Step 4 (75%)**: Add Writer Credits
- **Step 5 (100%)**: Process & Finalize

### 2. **Real-Time Progress Tracking**
- Percentage-based progress bar (0-100%)
- Visual gradient progress indicator
- Current step description
- Training status notifications

### 3. **Continuous ZEGA Training**
- Trains after each generation step
- Provides feedback for successful operations
- Learns from title, character, scene, and writer generation
- Final training with complete story data

### 4. **Story Length Options**
- **Short**: 3-5 scenes (quick story)
- **Medium**: 8-12 scenes (balanced narrative)
- **Elaborate**: 15-25 scenes (detailed epic)

### 5. **Smart Features**
- Genre selection for tailored content
- Update existing stories
- Auto-character detection from scenes
- Popularity calculation (1-10 scale)
- Draft mode by default (unpublished)

## 🔧 Technical Implementation

### API Endpoints

#### ZEGA Prediction Endpoint
```
POST http://localhost:8002/predict
```
**Request Body:**
```json
{
  "user_id": "string",
  "context": "string",
  "instruction": "string",
  "mode": "scene" | "continuation"
}
```

#### ZEGA Learning Endpoint
```
POST http://localhost:8002/learn
```
**Request Body:**
```json
{
  "user_id": "string",
  "text": "string",
  "rating": 5.0
}
```

#### Health Check
```
GET http://localhost:8002/health
```

### Generation Process

#### Step 1: Title & Description (10-15%)
```typescript
// Generates compelling title and engaging description
const titlePrompt = `Create title and description for: ${userPrompt}`;
const result = await callAI(titlePrompt, context);
await trainZEGA(prompt, result.title);
```

#### Step 2: Characters (20-30%)
```typescript
// Creates 3-8 rich character profiles
const characterPrompt = `Create characters for: ${title}`;
const result = await callAI(characterPrompt, context);
await trainZEGA('Generate characters', `Created ${count} characters`);
```

#### Step 3: Scenes (35-60%)
```typescript
// Generates scenes with complete narrative arc
const scenePrompt = `Create ${sceneCount} scenes for: ${title}`;
const result = await callAI(scenePrompt, context);
await trainZEGA('Generate scenes', `Created ${count} scenes`);
```

#### Step 4: Writers (65-75%)
```typescript
// Suggests appropriate writer names
const writerPrompt = `Suggest writers for: ${title}, ${genres}`;
const result = await callAI(writerPrompt, context);
await trainZEGA('Suggest writers', result.writers);
```

#### Step 5: Finalization (80-100%)
```typescript
// Process, validate, and finalize complete story
- Process scenes (80-85%)
- Process characters (85-90%)
- Ensure consistency (90-95%)
- Final training (95-100%)
```

### JSON Extraction Function
```typescript
const extractJSON = (text: string): string => {
  // Remove ZEGA's narrative prefixes
  text = text.replace(/^.*?(?=\{)/s, '');
  
  // Extract from code blocks
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();
  
  // Extract JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();
  
  return text.trim();
};
```

### Training Function
```typescript
const trainZEGA = async (text: string, rating: number = 5.0) => {
  const userId = localStorage.getItem('userId') || 'default-user';
  
  await fetch('http://localhost:8002/learn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      text: text.slice(0, 500),
      rating: rating
    })
  });
};
```

## 🎨 UI Components

### Progress Display
```tsx
<div className="bg-gradient-to-r from-blue-50 to-purple-50">
  {/* Header with percentage */}
  <div className="flex justify-between">
    <p>{progress}</p>
    <span>{progressPercent}%</span>
  </div>
  
  {/* Progress bar */}
  <div className="bg-gray-200 rounded-full h-3">
    <div style={{ width: `${progressPercent}%` }} />
  </div>
  
  {/* Current step */}
  <p>Current task: {currentStep}</p>
  
  {/* Training indicator */}
  <span>Training ZEGA model as we build your story...</span>
</div>
```

## 📊 Progress Breakdown

| Step | Progress | Task | Duration |
|------|----------|------|----------|
| 1 | 10-15% | Title & Description | ~3-5s |
| 2 | 20-30% | Character Creation | ~5-10s |
| 3 | 35-60% | Scene Generation | ~15-30s |
| 4 | 65-75% | Writer Credits | ~2-3s |
| 5 | 80-100% | Processing & Training | ~5-8s |

**Total Time**: ~30-60 seconds depending on story length

## 🚀 Usage

### Basic Usage
1. Click **"AI Generate"** button in Story View Toggle
2. Enter story description
3. Select story length (Short/Medium/Elaborate)
4. (Optional) Select genres
5. Click **"Generate Story"**
6. Watch real-time progress
7. Review generated story in form
8. Edit as needed
9. Publish when ready

### Update Existing Story
1. Open story for editing
2. Click **"AI Generate"**
3. Check "Modify existing story instead of creating new"
4. Enter update instructions
5. Generate
6. Review changes

## 🧪 Example Prompts

### Short Story
```
"A young wizard discovers a hidden portal in his school library 
that leads to a magical realm where books come to life."
```

### Medium Story
```
"In a dystopian future where emotions are illegal, a detective 
falls in love while investigating a resistance movement that 
believes feelings are what make us human."
```

### Elaborate Story
```
"An epic space opera spanning multiple galaxies, following three 
generations of a family as they navigate interstellar politics, 
ancient alien prophecies, and a mysterious cosmic force threatening 
the universe."
```

## ⚙️ Configuration

### Scene Count Mapping
```typescript
const sceneCountMap = {
  short: { min: 3, max: 5, description: '3-5 scenes, quick story' },
  medium: { min: 8, max: 12, description: '8-12 scenes, balanced narrative' },
  elaborate: { min: 15, max: 25, description: '15-25 scenes, detailed epic' }
};
```

### Character Requirements
- Name (required)
- Description (min 100 characters)
- Role: Protagonist/Antagonist/Supporting/Mentor/Comic Relief
- Popularity: 1-10 scale

### Scene Requirements
- Event title (max 8 words)
- Description (min 150 characters with dialogue, action, emotions)
- Character list
- Order number

## 🔍 Error Handling

### Common Errors

**404 Not Found**
- **Cause**: ZEGA service not running
- **Solution**: Run `start-zega-bg.bat` or check port 8002

**Invalid JSON Response**
- **Cause**: AI returned malformed data
- **Solution**: Automatic retry with cleaned response

**Timeout**
- **Cause**: Story too complex or service overloaded
- **Solution**: Try shorter story length or simpler prompt

## 📈 Performance

### Optimization Features
- Step-by-step generation reduces memory usage
- Progressive training improves AI quality
- Real-time feedback enhances user experience
- Automatic retries handle transient failures

### Training Benefits
- Each generation teaches ZEGA
- Quality improves over time
- Better genre understanding
- More coherent character development
- Improved scene pacing

## 🎓 Training Data

### What Gets Trained
1. **Title Generation**: User prompt → Generated title
2. **Character Creation**: Story context → Character profiles
3. **Scene Writing**: Story outline → Detailed scenes
4. **Writer Matching**: Genre + theme → Writer suggestions
5. **Complete Story**: Full prompt → Final story structure

### Training Metadata
```typescript
{
  prompt: string,      // Input (max 200 chars)
  response: string,    // Output (max 200 chars)
  rating: number,      // 1-5 (default: 5)
  model: 'zega'       // Model identifier
}
```

## 🛠️ Troubleshooting

### Service Not Running
```bash
# Start ZEGA service
start-zega-bg.bat

# Verify service
netstat -ano | findstr :8002
```

### Port Already In Use
```bash
# Find process using port 8002
netstat -ano | findstr :8002

# Kill process (replace PID)
taskkill /PID <pid> /F

# Restart service
start-zega-bg.bat
```

### Generation Failures
1. Check service logs: `AIservices/zega.log`
2. Verify prompt length (not too short/long)
3. Ensure genres are valid
4. Check network connectivity
5. Review console for detailed errors

## 📝 Best Practices

### Writing Effective Prompts
- Be specific about themes and setting
- Include character types (hero, villain, sidekick)
- Mention desired tone (dark, comedic, serious)
- Add genre hints if not using genre selector
- Describe key conflicts or goals

### Story Length Selection
- **Short**: Simple plots, 2-3 characters, single location
- **Medium**: Multiple subplots, 4-6 characters, 2-3 locations
- **Elaborate**: Complex narratives, 8+ characters, multiple timelines

### Genre Combinations
- Fantasy + Adventure = Epic quest
- Sci-Fi + Mystery = Tech thriller
- Romance + Drama = Emotional journey
- Horror + Comedy = Dark humor

## 🎯 Future Enhancements

- [ ] Image generation for characters and scenes
- [ ] Voice narration for scenes
- [ ] Multi-language support
- [ ] Custom character templates
- [ ] Scene reordering suggestions
- [ ] Plot hole detection
- [ ] Dialogue enhancement
- [ ] Character relationship mapping
- [ ] Export to various formats (PDF, EPUB, DOCX)
- [ ] Collaborative editing

## 🔗 Related Documentation

- [ZEGA Model Documentation](../AIservices/README.md)
- [Story Creation Guide](./STORY_CARDS.md)
- [Character System](./CHARACTERS.md)
- [Timeline Management](./TIMELINE.md)
- [Troubleshooting](../guides/TROUBLESHOOTING.md)

---

**Last Updated**: November 24, 2025  
**Version**: 2.0 - Step-by-Step with Training
