import { useState, useCallback } from 'react';

interface Character {
  name: string;
  role: string;
  description: string;
}

interface SceneContext {
  story_title: string;
  story_description: string;
  current_scene_text: string;
  previous_scene_text?: string;
  all_previous_scenes_summary?: string[];
  characters: Character[];
  genre?: string;
}

interface GenerationResponse {
  content: string;
  title?: string;
  new_characters?: Character[];
}

export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestion = useCallback(async (context: SceneContext) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context: `${context.story_title}\n${context.story_description}\n${context.current_scene_text}`,
          mode: 'continuation'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get suggestion: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;
    } catch (err) {
      console.error('AI Suggestion Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateScene = useCallback(async (context: SceneContext, instruction?: string, structured: boolean = false): Promise<GenerationResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      // Build a rich context including previous scenes
      let contextText = `Title: ${context.story_title}\nDescription: ${context.story_description}\nGenre: ${context.genre || 'General'}\n`;
      
      // Add characters
      if (context.characters && context.characters.length > 0) {
        contextText += `Characters: ${context.characters.map(c => `${c.name} (${c.role}: ${c.description})`).join(', ')}\n`;
      }
      
      // Add previous scenes summary if available
      if (context.all_previous_scenes_summary && context.all_previous_scenes_summary.length > 0) {
        contextText += `\nPrevious Scenes Summary:\n${context.all_previous_scenes_summary.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`;
      }
      
      // Add current scene text if it exists (for continuation) or just as context
      if (context.current_scene_text) {
        contextText += `\nCurrent Scene Draft: ${context.current_scene_text}`;
      }
      
      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context: contextText,
          instruction: instruction || 'Generate the next scene in the story',
          mode: structured ? 'scene_structured' : 'scene'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate scene: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (structured) {
        try {
          // Check if the content is an error message from the backend
          if (typeof data.content === 'string' && (data.content.startsWith('Error') || data.content.startsWith('I\'m having trouble'))) {
             throw new Error(data.content);
          }

          // Clean up potential markdown formatting if the model adds it despite instructions
          let cleanContent = data.content.trim();
          if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          const parsed = JSON.parse(cleanContent);
          return { 
            content: parsed.content, 
            title: parsed.title,
            new_characters: parsed.new_characters || [] 
          } as GenerationResponse;
        } catch (e) {
          console.error("Failed to parse structured AI response", e);
          // If it's a syntax error, it might be the model failed to output JSON.
          // We can try to recover or just throw.
          if (e instanceof SyntaxError) {
             console.warn("Model did not return valid JSON. Raw content:", data.content);
          }
          throw e; // Re-throw to be handled by the caller
        }
      }

      return { content: data.content, new_characters: [] };
    } catch (err) {
      console.error('AI Generation Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateStory = useCallback(async (title: string, description: string, genre: string, numScenes: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context: `Title: ${title}\nDescription: ${description}\nGenre: ${genre}`,
          instruction: `Generate a complete story with ${numScenes} scenes`,
          mode: 'scene'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      return data.content;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendFeedback = useCallback(async (_originalPrompt: string, generatedText: string, rating: number, userEdits?: string) => {
    try {
      await fetch('http://localhost:8002/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: 'user_1',
          text: userEdits || generatedText,
          rating: rating / 5.0 // Normalize rating to 0-1 scale
        }),
      });
    } catch (err) {
      console.error("Failed to send feedback", err);
    }
  }, []);

  return {
    loading,
    error,
    getSuggestion,
    generateScene,
    generateStory,
    sendFeedback
  };
};
