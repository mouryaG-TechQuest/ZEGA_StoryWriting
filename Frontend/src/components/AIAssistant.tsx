import { useState } from 'react';
import { Sparkles, Wand2, Loader2, MessageSquarePlus, Star } from 'lucide-react';
import { useAI } from '../hooks/useAI';

interface Character {
  name: string;
  role: string;
  description: string;
}

interface AIAssistantProps {
  context: {
    story_title: string;
    story_description: string;
    current_scene_text: string;
    previous_scene_text?: string;
    all_previous_scenes_summary?: string[];
    characters: Character[];
    genre?: string;
  };
  onSuggestionAccepted: (text: string) => void;
  onSceneGenerated: (text: string, newCharacters?: Character[]) => void;
}

const AIAssistant = ({ context, onSuggestionAccepted, onSceneGenerated }: AIAssistantProps) => {
  const { loading, getSuggestion, generateScene, sendFeedback } = useAI();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [generatedScene, setGeneratedScene] = useState<{ content: string, new_characters?: Character[] } | null>(null);
  const [instruction, setInstruction] = useState('');
  const [mode, setMode] = useState<'suggest' | 'generate'>('suggest');
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);

  const handleGetSuggestion = async () => {
    const result = await getSuggestion(context);
    if (result) {
      setSuggestion(result);
      setFeedbackRating(0);
    }
  };

  const handleGenerateScene = async () => {
    const result = await generateScene(context, instruction);
    if (result) {
      setGeneratedScene(result);
      setFeedbackRating(0);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onSuggestionAccepted(suggestion);
      // Send implicit positive feedback (5 stars) if accepted without edits
      // Or we could ask for rating. For flow, let's assume acceptance is good.
      // But to be "self-learning", explicit rating is better.
      // Let's send the current rating if set, or 5 if not set.
      const rating = feedbackRating > 0 ? feedbackRating : 5;
      sendFeedback(
        `Suggest continuation for: ${context.current_scene_text.slice(-100)}`, 
        suggestion, 
        rating
      );
      setSuggestion(null);
      setFeedbackRating(0);
    }
  };

  const handleAcceptScene = () => {
    if (generatedScene) {
      onSceneGenerated(generatedScene.content, generatedScene.new_characters);
      const rating = feedbackRating > 0 ? feedbackRating : 5;
      sendFeedback(
        `Generate scene: ${instruction}`, 
        generatedScene.content, 
        rating
      );
      setGeneratedScene(null);
      setIsOpen(false);
      setFeedbackRating(0);
    }
  };

  const renderRating = () => (
    <div className="flex items-center space-x-1 mt-2 mb-3 justify-center">
      <span className="text-xs text-gray-500 mr-2">Rate result:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFeedbackRating(star);
          }}
          className={`focus:outline-none transition-transform hover:scale-110 ${
            star <= feedbackRating ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 group"
        title="AI Assistant"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          AI Assistant
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-purple-100 z-50 flex flex-col overflow-hidden animate-fadeIn max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold">AI Story Assistant</h3>
        </div>
        <button 
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={() => { setMode('suggest'); setSuggestion(null); setGeneratedScene(null); }}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition ${
            mode === 'suggest' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Suggest Next</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('generate'); setSuggestion(null); setGeneratedScene(null); }}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition ${
            mode === 'generate' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Generate Scene</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 bg-gray-50 overflow-y-auto flex-1">
        {mode === 'suggest' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Get AI suggestions for the next sentence or paragraph based on your current writing.
            </p>
            
            {suggestion ? (
              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                <p className="text-gray-800 text-sm italic mb-3">"{suggestion}"</p>
                
                {renderRating()}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAcceptSuggestion}
                    className="flex-1 bg-purple-600 text-white py-1.5 rounded text-xs font-semibold hover:bg-purple-700 transition"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Send negative feedback (1 star) if discarded? 
                      // Or just discard. Let's just discard for now to avoid noise.
                      setSuggestion(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-semibold hover:bg-gray-300 transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGetSuggestion}
                disabled={loading}
                className="w-full bg-white border-2 border-purple-200 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-50 hover:border-purple-300 transition flex items-center justify-center shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Suggest Continuation
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!generatedScene ? (
              <>
                <p className="text-sm text-gray-600">
                  Generate a full scene draft. Provide specific instructions or let the AI be creative.
                </p>
                <textarea
                  placeholder="E.g., Write a tense dialogue between the hero and the villain about the missing artifact..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateScene}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Writing Scene...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Draft
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                <div className="max-h-60 overflow-y-auto mb-3 text-sm text-gray-800 whitespace-pre-wrap border p-2 rounded bg-gray-50">
                  {generatedScene.content}
                </div>
                
                {generatedScene.new_characters && generatedScene.new_characters.length > 0 && (
                  <div className="mb-3 bg-green-50 p-2 rounded border border-green-100">
                    <p className="text-xs font-bold text-green-800 mb-1">New Characters Detected:</p>
                    <ul className="text-xs text-green-700 list-disc list-inside">
                      {generatedScene.new_characters.map((c, i) => (
                        <li key={i}>{c.name} ({c.role})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {renderRating()}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAcceptScene}
                    className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    Accept & Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedScene(null)}
                    className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs font-semibold hover:bg-gray-300 transition"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
