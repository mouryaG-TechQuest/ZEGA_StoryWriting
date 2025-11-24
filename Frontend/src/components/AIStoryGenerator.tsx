import { useState } from 'react';
import { Sparkles, Wand2, Loader2, BookOpen, Film, AlertCircle } from 'lucide-react';

interface Character {
  name: string;
  description: string;
  role: string;
  actorName?: string;
  popularity?: number;
  imageUrls?: string[];
}

interface TimelineEntry {
  id: string;
  event: string;
  description: string;
  characters: string[];
  imageUrls: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  order: number;
}

interface Genre {
  id: number;
  name: string;
  description?: string;
}

interface GeneratedStory {
  title: string;
  description: string;
  scenes: TimelineEntry[];
  characters: Character[];
  writers?: string;
}

interface AIStoryGeneratorProps {
  onStoryGenerated: (story: GeneratedStory) => void;
  onCancel: () => void;
  genres: Genre[];
  existingStoryTitle?: string;
  existingStoryId?: string;
}

const AIStoryGenerator = ({ onStoryGenerated, onCancel, genres, existingStoryTitle, existingStoryId }: AIStoryGeneratorProps) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'elaborate'>('medium');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [updateInstructions, setUpdateInstructions] = useState('');
  const [currentStep, setCurrentStep] = useState<string>('');

  const sceneCountMap = {
    short: { min: 3, max: 5, description: '3-5 scenes, quick story' },
    medium: { min: 8, max: 12, description: '8-12 scenes, balanced narrative' },
    elaborate: { min: 15, max: 25, description: '15-25 scenes, detailed epic' }
  };

  // Helper function to extract JSON from ZEGA response
  const extractJSON = (text: string): string => {
    // Remove common prefixes that ZEGA adds
    text = text.replace(/^.*?(?=\{)/s, ''); // Remove everything before first {
    
    // Try to find JSON in code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // Try to find JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0].trim();
    }

    return text.trim();
  };

  // Helper function to call AI API
  const callAI = async (prompt: string, context: string, mode: string = 'continuation') => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || 'default-user';
    
    // Enhanced prompt to ensure JSON response
    const enhancedPrompt = `${prompt}\n\nIMPORTANT: You must respond with ONLY the JSON object. Do not include any explanatory text before or after the JSON.`;
    
    const response = await fetch('http://localhost:8002/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId,
        context: context,
        instruction: enhancedPrompt,
        mode: mode
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.content || result.response || '';
    return extractJSON(content);
  };

  // Helper function to train ZEGA
  const trainZEGA = async (text: string, rating: number = 5.0) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || 'default-user';
      
      await fetch('http://localhost:8002/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          text: text.slice(0, 500),
          rating: rating
        })
      });
      console.log('✓ ZEGA trained successfully');
    } catch (err) {
      console.warn('Failed to train ZEGA:', err);
    }
  };

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a story description');
      return;
    }

    setLoading(true);
    setError('');
    setProgressPercent(0);
    setProgress('Initializing AI Story Generator...');

    try {
      const sceneConfig = sceneCountMap[storyLength];
      const selectedGenreNames = selectedGenres.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(', ');

      // STEP 1: Generate Title & Description (15%)
      setCurrentStep('Generating title and description');
      setProgress('📖 Step 1/5: Creating story title and description...');
      setProgressPercent(10);

      const titlePrompt = `You are an expert story writer. Based on this user request, create a compelling story title and engaging 2-3 sentence description.

USER REQUEST: ${userPrompt}
${isUpdateMode && existingStoryTitle ? `\nEXISTING STORY: "${existingStoryTitle}"\nUPDATE INSTRUCTIONS: ${updateInstructions}` : ''}
GENRES: ${selectedGenreNames || 'General Fiction'}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Compelling Story Title",
  "description": "Engaging 2-3 sentence description that hooks the reader"
}`;

      const titleResponse = await callAI(titlePrompt, 'Story title and description generation', 'scene');
      let titleResult;
      try {
        titleResult = JSON.parse(titleResponse);
      } catch {
        console.error('Failed to parse title response:', titleResponse);
        throw new Error('AI returned invalid JSON for title. Please try again.');
      }
      
      await trainZEGA(`Title: ${titleResult.title}\nDescription: ${titleResult.description}`, 5.0);
      setProgressPercent(15);

      // STEP 2: Generate Characters (30%)
      setCurrentStep('Creating characters');
      setProgress('🎭 Step 2/5: Designing main characters...');
      setProgressPercent(20);

      const characterPrompt = `Based on this story, create 3-8 rich character profiles:

STORY TITLE: ${titleResult.title}
STORY DESCRIPTION: ${titleResult.description}
GENRES: ${selectedGenreNames || 'General Fiction'}

Return ONLY valid JSON (no markdown):
{
  "characters": [
    {
      "name": "Character Name",
      "description": "Detailed background, personality traits, motivations (min 100 chars)",
      "role": "Protagonist/Antagonist/Supporting/Mentor/Comic Relief",
      "popularity": 7
    }
  ]
}`;

      const characterResponse = await callAI(characterPrompt, 'Character profile creation', 'scene');
      let characterResult;
      try {
        characterResult = JSON.parse(characterResponse);
      } catch {
        console.error('Failed to parse character response:', characterResponse);
        throw new Error('AI returned invalid JSON for characters. Please try again.');
      }

      const charText = characterResult.characters.map((c: { name: string; description: string }) => 
        `${c.name}: ${c.description}`
      ).join('\n');
      await trainZEGA(charText, 5.0);
      setProgressPercent(30);

      // STEP 3: Generate Scenes (60%)
      setCurrentStep('Writing scenes');
      setProgress(`🎬 Step 3/5: Creating ${sceneConfig.min}-${sceneConfig.max} scenes...`);
      setProgressPercent(35);

      const scenePrompt = `Create ${sceneConfig.min}-${sceneConfig.max} detailed scenes for this story:

TITLE: ${titleResult.title}
DESCRIPTION: ${titleResult.description}
CHARACTERS: ${characterResult.characters.map((c: { name: string }) => c.name).join(', ')}
STORY LENGTH: ${storyLength.toUpperCase()}
GENRES: ${selectedGenreNames || 'General Fiction'}

Create a complete narrative arc with beginning, rising action, climax, falling action, and resolution.

Return ONLY valid JSON (no markdown):
{
  "scenes": [
    {
      "event": "Scene title (max 8 words)",
      "description": "Detailed scene with dialogue, action, emotions, setting (minimum 150 characters)",
      "characters": ["Character1", "Character2"],
      "order": 0
    }
  ]
}`;

      const sceneResponse = await callAI(scenePrompt, 'Scene narrative generation', 'scene');
      let sceneResult;
      try {
        sceneResult = JSON.parse(sceneResponse);
      } catch {
        console.error('Failed to parse scene response:', sceneResponse);
        throw new Error('AI returned invalid JSON for scenes. Please try again.');
      }

      const sceneText = sceneResult.scenes.map((s: { event: string; description: string }) => 
        `${s.event}: ${s.description}`
      ).join('\n\n');
      await trainZEGA(sceneText, 5.0);
      setProgressPercent(60);

      // STEP 4: Generate Writers (75%)
      setCurrentStep('Adding writer credits');
      setProgress('✍️ Step 4/5: Adding writer credits...');
      setProgressPercent(65);

      const writerPrompt = `Suggest 1-2 writer names (real or fictional) that would be appropriate for this story:

TITLE: ${titleResult.title}
GENRES: ${selectedGenreNames || 'General Fiction'}

Return ONLY valid JSON:
{
  "writers": "Writer Name or Writer1 & Writer2"
}`;

      const writerResponse = await callAI(writerPrompt, 'Writer credits suggestion', 'continuation');
      let writerResult;
      try {
        writerResult = JSON.parse(writerResponse);
      } catch {
        console.error('Failed to parse writer response:', writerResponse);
        throw new Error('AI returned invalid JSON for writers. Please try again.');
      }

      await trainZEGA(`Writers for ${selectedGenreNames || 'story'}: ${writerResult.writers}`, 5.0);
      setProgressPercent(75);

      // STEP 5: Process and Finalize (100%)
      setCurrentStep('Finalizing story');
      setProgress('🎨 Step 5/5: Processing and finalizing...');
      setProgressPercent(80);

      // Process scenes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedScenes: TimelineEntry[] = sceneResult.scenes.map((scene: any, index: number) => ({
        id: `scene-${Date.now()}-${index}`,
        event: scene.event || `Scene ${index + 1}`,
        description: scene.description || '',
        characters: Array.isArray(scene.characters) ? scene.characters : [],
        imageUrls: [],
        videoUrls: [],
        audioUrls: [],
        order: index
      }));

      setProgressPercent(85);

      // Process characters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedCharacters: Character[] = characterResult.characters.map((char: any) => ({
        name: char.name || 'Unknown',
        description: char.description || '',
        role: char.role || 'Supporting Character',
        actorName: '',
        popularity: Math.max(1, Math.min(10, char.popularity || 5)),
        imageUrls: []
      }));

      setProgressPercent(90);

      // Ensure all scene characters exist
      const allSceneCharacters = new Set<string>();
      processedScenes.forEach(scene => {
        scene.characters.forEach(charName => allSceneCharacters.add(charName));
      });

      const existingCharNames = new Set(processedCharacters.map(c => c.name.toLowerCase()));
      allSceneCharacters.forEach(charName => {
        if (!existingCharNames.has(charName.toLowerCase())) {
          processedCharacters.push({
            name: charName,
            description: 'Character from scene',
            role: 'Supporting Character',
            actorName: '',
            popularity: 5,
            imageUrls: []
          });
        }
      });

      setProgressPercent(95);

      const generatedStory: GeneratedStory = {
        title: titleResult.title,
        description: titleResult.description,
        scenes: processedScenes,
        characters: processedCharacters,
        writers: writerResult.writers || 'AI Generated'
      };

      // Final training with complete story
      const finalTrainingText = `Story: ${generatedStory.title}\n${generatedStory.description}\nScenes: ${generatedStory.scenes.length}\nCharacters: ${generatedStory.characters.map(c => c.name).join(', ')}`;
      await trainZEGA(finalTrainingText, 5.0);

      setProgressPercent(100);
      setProgress('🎉 Story generated successfully!');
      
      setTimeout(() => {
        onStoryGenerated(generatedStory);
      }, 800);

    } catch (err) {
      console.error('Story generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate story. Please check if the AI service is running on port 8002.');
      setProgress('');
      setProgressPercent(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 animate-fadeIn relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wand2 className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">AI Story Generator</h2>
                <p className="text-purple-100 text-sm mt-1">Create a complete story from your imagination</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-white hover:bg-white/20 rounded-full p-2 transition disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Update Mode Toggle */}
          {existingStoryTitle && existingStoryId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Update Existing Story</p>
                  <p className="text-xs text-blue-700 mt-1">Current story: "{existingStoryTitle}"</p>
                  <label className="flex items-center mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUpdateMode}
                      onChange={(e) => setIsUpdateMode(e.target.checked)}
                      className="mr-2"
                      disabled={loading}
                    />
                    <span className="text-sm text-blue-800">Modify existing story instead of creating new</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Story Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isUpdateMode ? 'Update Instructions' : 'Story Description'} *
            </label>
            <textarea
              value={isUpdateMode ? updateInstructions : userPrompt}
              onChange={(e) => isUpdateMode ? setUpdateInstructions(e.target.value) : setUserPrompt(e.target.value)}
              placeholder={isUpdateMode 
                ? "Describe what you want to change (e.g., 'Add more action scenes', 'Make the ending happier', 'Add a new villain character')"
                : "Describe your story idea (e.g., 'A sci-fi adventure about a young astronaut discovering an alien civilization on Mars')"}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isUpdateMode 
                ? 'Be specific about what you want to modify in the existing story'
                : 'Be as detailed as possible. Include themes, setting, characters, conflicts, etc.'}
            </p>
          </div>

          {!isUpdateMode && userPrompt && (
            <input
              type="hidden"
              value={userPrompt}
              onChange={() => {}}
            />
          )}

          {/* Story Length */}
          {!isUpdateMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Film className="w-4 h-4 inline mr-2" />
                Story Length
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(sceneCountMap) as Array<keyof typeof sceneCountMap>).map((length) => (
                  <button
                    key={length}
                    type="button"
                    onClick={() => setStoryLength(length)}
                    disabled={loading}
                    className={`p-4 rounded-lg border-2 transition ${
                      storyLength === length
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                    } disabled:opacity-50`}
                  >
                    <div className="font-bold capitalize mb-1">{length}</div>
                    <div className="text-xs">{sceneCountMap[length].description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Genre Selection */}
          {!isUpdateMode && genres.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Genres (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => {
                      setSelectedGenres(prev =>
                        prev.includes(genre.id)
                          ? prev.filter(id => id !== genre.id)
                          : [...prev, genre.id]
                      );
                    }}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedGenres.includes(genre.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress with Percentage */}
          {progress && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <p className="text-sm text-blue-900 font-medium">{progress}</p>
                </div>
                <span className="text-lg font-bold text-purple-700">{progressPercent}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-full transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              {/* Current Step */}
              {currentStep && (
                <p className="text-xs text-gray-600 italic">
                  Current task: {currentStep}
                </p>
              )}
              
              {/* Training Indicator */}
              {progressPercent > 0 && progressPercent < 100 && (
                <div className="flex items-center space-x-2 text-xs text-purple-700">
                  <Sparkles className="w-3 h-3" />
                  <span>Training ZEGA model as we build your story...</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-900 font-medium">Generation Failed</p>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    💡 Tip: Make sure ZEGA service is running at http://localhost:8002
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Run: <code className="bg-red-100 px-1 py-0.5 rounded">start-zega-bg.bat</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || (!isUpdateMode && !userPrompt.trim()) || (isUpdateMode && !updateInstructions.trim())}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{isUpdateMode ? 'Update Story' : 'Generate Story'}</span>
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold text-purple-900">What will be generated:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Story title and description</li>
                  <li>Multiple detailed scenes with dialogue and action</li>
                  <li>Character profiles with roles and personalities</li>
                  <li>Automatic character-to-scene assignments</li>
                  <li>Suggested writer names</li>
                </ul>
                <p className="text-xs text-purple-700 mt-2 italic">
                  💡 Story will be saved as draft (unpublished) - you can edit and publish later!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStoryGenerator;
