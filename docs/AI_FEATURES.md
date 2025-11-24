# AI-Powered Features Documentation

## Overview
This document describes all the AI-powered features implemented in the Story Writing Project with comprehensive append/replace functionality and intelligent character management.

## 🌟 Features

### 1. **Append/Replace Options for All AI Suggestions**

Every AI-assisted field now provides users with two options:
- **Append**: Add AI suggestion to existing content
- **Replace**: Replace existing content with AI suggestion

This applies to:
- Story Description
- Character Name
- Character Role
- Character Description
- Character Actor Name
- Writers Field

### 2. **Character AI Assistance**

#### Enhanced Character Fields
All character fields now have AI assistance with sparkles (✨) icon:

**Name Field**
- AI suggests appropriate character names based on:
  - Story title and description
  - Story genre
  - Other characters in the story
  - All scenes created so far
- Modal shows suggestion with Replace option

**Role Field**
- AI suggests character archetypes (Protagonist, Antagonist, Supporting, etc.)
- Based on story context and existing characters
- Modal with Replace option

**Description Field**
- AI writes compelling character descriptions
- Considers story context, role, and other characters
- Modal with **Append** and **Replace** options

**Actor Name Field** (NEW)
- AI suggests real actors perfect for the role
- Based on character traits, role, and story genre
- Modal with **Append** and **Replace** options

### 3. **Character Popularity Assessment** (NEW)

**AI-Powered Popularity Analysis**
- Click the sparkles icon next to the Popularity field
- AI analyzes character across ALL scenes considering:
  1. Number of scenes they appear in
  2. Impact on the plot
  3. Character development and arc
  4. Relationships with other characters
  5. Screen time and dialogue presence

**Assessment Modal Features:**
- Displays AI's detailed analysis
- Shows suggested popularity score (1-10)
- "Apply Score" button to use AI's suggestion
- "Close" to dismiss without applying

**Insufficient Information Handling:**
- If no scenes exist yet, AI displays:
  - "Insufficient information: No scenes created yet. Please add scenes to assess character popularity."

### 4. **Writers Field AI Assistance** (NEW)

- Sparkles button next to Writers input field
- AI suggests appropriate writers/screenwriters for the story type
- Based on:
  - Story title and description
  - Genre
  - Story themes

**Modal Options:**
- **Append**: Add suggested writers to existing list
- **Replace**: Replace entire writers list
- **Cancel**: Dismiss without changes

### 5. **Automatic Character Detection from AI Scenes** (NEW)

When AI generates scene content:

**Auto-Detection of Existing Characters:**
- Scans AI-generated text for mentions of existing character names
- Automatically selects those characters in the scene
- Shows toast notification: "Auto-selected characters: [names]"

**Auto-Creation of New Characters:**
- AI identifies new characters in generated scenes
- Automatically creates full character profiles with:
  - Name
  - Role
  - Description
  - Popularity (default: 5)
- Adds new characters to the story
- Automatically selects them in the scene
- Shows toast: "New character '[name]' added to story!"

### 6. **Scene Context Awareness**

All character AI suggestions now include:
- Full story description
- All scenes created so far
- Scene titles and descriptions
- Timeline context

This ensures AI suggestions are:
- Contextually relevant
- Story-consistent
- Character-appropriate

### 7. **Scene Title AI Generation**

- Already implemented in TimelineManager
- AI suggests scene titles based on content
- Can be extended with append/replace in future updates

## 🎨 UI/UX Features

### Visual Indicators
- **Sparkles Icon (✨)**: Indicates AI assistance available
- **Loading Spinner**: Shows when AI is processing
- **Purple Theme**: All AI features use purple accent color
- **Toast Notifications**: Success/info/error messages

### Modal Design
- Clean, modern modal dialogs
- Clear action buttons
- Syntax-highlighted suggestions
- Responsive on all screen sizes

### Button Placement
- **Inline Icons**: Next to input fields for immediate access
- **Hover Effects**: Purple hover states for consistency
- **Disabled States**: Prevents multiple simultaneous requests

## 🔧 Technical Implementation

### State Management
```typescript
// New state variables
const [characterSuggestion, setCharacterSuggestion] = useState<{
  field: 'name' | 'role' | 'description' | 'actorName', 
  content: string, 
  index: number
} | null>(null);

const [popularityAssessment, setPopularityAssessment] = useState<{
  index: number, 
  assessment: string, 
  suggestedScore?: number
} | null>(null);

const [writersSuggestion, setWritersSuggestion] = useState<string>('');
```

### API Integration
All AI features use:
- Endpoint: `http://localhost:8002/predict`
- Mode: `'general'` for flexible AI responses
- User ID: `'user_1'`
- Context: Comprehensive story and scene information

### Character Detection Algorithm
```typescript
// Auto-detect existing characters in AI-generated text
availableCharacters.forEach(char => {
  const nameRegex = new RegExp(`\\b${char.name}\\b`, 'i');
  if (nameRegex.test(text)) {
    // Auto-select character in scene
    toggleCharacter(activeEntry.id, char.name);
  }
});
```

## 📝 Usage Guide

### For Character Name Suggestion:
1. Click sparkles icon next to Name field
2. Wait for AI to generate suggestion
3. Review suggestion in modal
4. Click "Replace" to use the suggestion
5. Or "Cancel" to dismiss

### For Character Popularity Assessment:
1. Create several scenes with the character
2. Click sparkles icon next to Popularity field
3. AI analyzes character's role across all scenes
4. Review assessment and suggested score
5. Click "Apply Score" to use suggestion
6. Or "Close" to keep current value

### For Writers Suggestion:
1. Enter story title, description, and genre
2. Click sparkles icon next to Writers field
3. Review AI-suggested writers
4. Choose "Append" to add to existing writers
5. Or "Replace" to use only AI suggestions

### For Automatic Character Management:
1. Use AI to generate scene content
2. AI automatically:
   - Detects existing character mentions
   - Selects them in the scene
   - Creates new characters if introduced
   - Adds new characters with full profiles
3. Review and adjust as needed

## 🚀 Benefits

1. **User Control**: Append/replace options give full control
2. **Context Awareness**: All suggestions consider full story context
3. **Time Saving**: Automated character detection and creation
4. **Consistency**: AI ensures character usage is consistent
5. **Quality**: Popularity assessment helps balance character importance
6. **Flexibility**: Can accept, modify, or reject any suggestion

## 🔮 Future Enhancements

Potential additions:
- Genre-specific character templates
- Character relationship suggestions
- Dialogue generation per character
- Character arc tracking
- Conflict suggestion between characters
- Scene-by-scene character development analysis

## 🛠️ Troubleshooting

**AI Not Responding:**
- Ensure AI service is running on port 8002
- Check `.env` file has valid `GOOGLE_API_KEY`
- Verify network connectivity

**Character Not Auto-Detected:**
- Ensure character name is spelled exactly in scene
- Character must exist in story before scene generation
- Check scene was generated via AI (not manually typed)

**Popularity Assessment Shows "Insufficient Info":**
- Create at least 2-3 scenes first
- Mention the character in scene descriptions
- Ensure scenes have substantial content

## 📚 Related Documentation

- See `GETTING_STARTED.md` for basic setup
- See `TROUBLESHOOTING.md` for common issues
- See `FEATURES/CHARACTERS.md` for character system overview
