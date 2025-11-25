import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

interface AutoTrainModelProps {
  userId: string;
}

interface TrainingResult {
  total_requested: number;
  successful: number;
  failed: number;
  genre_distribution: { [key: string]: number };
  average_quality: number;
  total_time: number;
  stored_in_memory: boolean;
  saved_to_database: boolean;
  stories_saved: number;
  model_performance: { [key: string]: { count: number; avg_quality: number } };
  training_stats: {
    training_examples: number;
    examples_until_next_training: number;
    custom_model_exists: boolean;
  };
  ready_for_finetuning: boolean;
}

interface TrainingProgress {
  current: number;
  total: number;
  currentGenre: string;
  currentQuality: number;
  phase: 'generating' | 'evaluating' | 'storing' | 'complete';
  timeElapsed: number;
}

const AutoTrainModel: React.FC<AutoTrainModelProps> = ({ userId }) => {
  const [numExamples, setNumExamples] = useState(50);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [storeInMemory, setStoreInMemory] = useState(false);
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [trainingLog, setTrainingLog] = useState<string[]>([]);

  // All 25 database genres
  const availableGenres = [
    'adventure', 'biography', 'comedy', 'contemporary', 'crime',
    'drama', 'dystopian', 'epic', 'fairy tale', 'fantasy',
    'historical fiction', 'horror', 'literary fiction', 'memoir', 'mystery',
    'mythology', 'paranormal', 'poetry', 'romance', 'science fiction',
    'short story', 'thriller', 'urban fantasy', 'western', 'young adult'
  ];

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleAutoTrain = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setIsTraining(true);
    setError(null);
    setResult(null);
    setProgress(null);
    setTrainingLog([]);

    const startTime = Date.now();

    try {
      // Try Server-Sent Events for real-time progress, fallback to regular endpoint
      let response;
      let useStreaming = true;
      
      try {
        response = await fetch('http://localhost:8002/auto-train-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            num_examples: numExamples,
            genres: selectedGenres.length > 0 ? selectedGenres : null,
            store_in_memory: storeInMemory,
            save_to_database: saveToDatabase,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Streaming not available');
        }
      } catch (streamError) {
        // Fallback to regular endpoint without streaming
        console.log('Streaming not available, using regular endpoint');
        useStreaming = false;
        
        response = await fetch('http://localhost:8002/auto-train', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            num_examples: numExamples,
            genres: selectedGenres.length > 0 ? selectedGenres : null,
            store_in_memory: storeInMemory,
            save_to_database: saveToDatabase,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Training failed');
        }
      }

      if (useStreaming && response.ok) {

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response stream available');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                // Training complete
                setResult(data.result);
                setProgress({
                  current: numExamples,
                  total: numExamples,
                  currentGenre: '',
                  currentQuality: data.result.average_quality,
                  phase: 'complete',
                  timeElapsed: Math.floor((Date.now() - startTime) / 1000)
                });
              } else if (data.type !== 'heartbeat') {
                // Progress update
                setProgress({
                  current: data.current || 0,
                  total: data.total || numExamples,
                  currentGenre: data.current_genre || '',
                  currentQuality: data.latest_quality || 0,
                  phase: 'generating',
                  timeElapsed: Math.floor((Date.now() - startTime) / 1000)
                });

                // Add to training log
                if (data.current && data.latest_quality) {
                  const logEntry = `[${new Date().toLocaleTimeString()}] Sample ${data.current}/${data.total} - ${data.current_genre} - Quality: ${data.latest_quality.toFixed(1)}/10 - Model: ${data.best_model || 'ensemble'}`;
                  setTrainingLog(prev => [...prev, logEntry]);
                }
              }
            }
          }
        }
      } else {
        // Non-streaming response - show indeterminate progress
        setProgress({
          current: 0,
          total: numExamples,
          currentGenre: 'Training in progress...',
          currentQuality: 0,
          phase: 'generating',
          timeElapsed: 0
        });
        
        setTrainingLog(['🚀 Training started (non-streaming mode)', '⏳ Please wait while AI generates stories...']);
        
        const data = await response.json();
        setResult(data);
        setProgress({
          current: numExamples,
          total: numExamples,
          currentGenre: '',
          currentQuality: data.average_quality,
          phase: 'complete',
          timeElapsed: Math.floor((Date.now() - startTime) / 1000)
        });
        
        setTrainingLog(prev => [...prev, `✅ Training complete! Generated ${data.successful}/${data.total_requested} stories`]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How Auto-Training Works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Uses all 7 AI models (Gemini, Groq, HuggingFace, Ollama) with ensemble voting</li>
            <li>Automatically stores best parameters from the highest-performing models</li>
            <li>Generates training data without cluttering your story database</li>
            <li>Option to save high-quality stories (≥8.0/10) for your use</li>
            <li>After 50 examples, your personalized AI model can be fine-tuned</li>
          </ul>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="space-y-6 mb-6">
        {/* Number of Examples */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Training Examples
          </label>
          <input
            type="range"
            min="1"
            max="1000"
            value={numExamples}
            onChange={(e) => setNumExamples(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isTraining}
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>1</span>
            <span className="font-bold text-blue-600">{numExamples} stories</span>
            <span>1000</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ⏱️ Estimated time: ~{Math.ceil(numExamples * 3)} seconds ({(numExamples * 3 / 60).toFixed(1)} min) with ensemble voting
          </p>
        </div>

        {/* Genre Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Genres (optional - balanced across all 25 genres if none selected)
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  disabled={isTraining}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors capitalize ${
                    selectedGenres.includes(genre)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isTraining ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {genre.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedGenres.length > 0 
              ? `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`
              : 'All 25 genres will be used randomly'}
          </p>
        </div>

        {/* Save to Database Option */}
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <input
            type="checkbox"
            id="saveToDatabase"
            checked={saveToDatabase}
            onChange={(e) => setSaveToDatabase(e.target.checked)}
            disabled={isTraining}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="saveToDatabase" className="text-sm text-gray-700">
            💾 <span className="font-semibold">Save best stories to database</span> (quality ≥8.0/10) - Stories will be accessible in your account for reading and use
          </label>
        </div>

        {/* Store in Memory Option */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="storeInMemory"
            checked={storeInMemory}
            onChange={(e) => setStoreInMemory(e.target.checked)}
            disabled={isTraining}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="storeInMemory" className="text-sm text-gray-700">
            Store high-quality examples in RAG memory (for enhanced AI context)
          </label>
        </div>
      </div>

      {/* Train Button */}
      <button
        onClick={handleAutoTrain}
        disabled={isTraining}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
          isTraining
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
        }`}
      >
        {isTraining ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Training in progress... ({numExamples} examples)
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Start Auto-Training ({numExamples} examples)
          </>
        )}
      </button>

      {/* Real-Time Progress Display */}
      {isTraining && progress && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Training Progress</h3>
            <span className="text-sm text-gray-600">
              ⏱️ {progress.timeElapsed}s elapsed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>
                {progress.current > 0 ? `Sample ${progress.current} of ${progress.total}` : 'Training in progress...'}
              </span>
              <span className="font-semibold">
                {progress.current > 0 ? `${progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%` : 'Processing...'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              {progress.current > 0 ? (
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 animate-pulse bg-[length:200%_100%]"></div>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Current Phase</p>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <p className="font-semibold text-gray-800 capitalize">{progress.phase}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Current Genre</p>
              <p className="font-semibold text-gray-800 capitalize">{progress.currentGenre || 'Random'}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Latest Quality</p>
              <p className="font-semibold text-gray-800">
                {progress.currentQuality > 0 ? `${progress.currentQuality.toFixed(1)}/10` : 'Evaluating...'}
              </p>
            </div>
          </div>

          {/* Training Log */}
          {trainingLog.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2 font-mono">📝 Training Log:</p>
              {trainingLog.slice(-10).map((log, idx) => (
                <p key={idx} className="text-xs text-green-400 font-mono">
                  {log}
                </p>
              ))}
            </div>
          )}

          {/* Estimated Time Remaining */}
          {progress.current > 0 && progress.current < progress.total && (
            <div className="mt-4 text-center text-sm text-gray-600">
              ⏳ Estimated time remaining: ~{Math.round(((progress.total - progress.current) * progress.timeElapsed) / progress.current)}s
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Training Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Training Completed!</p>
              <p className="text-sm text-green-700">
                Successfully generated {result.successful} out of {result.total_requested} examples
                in {result.total_time.toFixed(1)} seconds
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-blue-900">
                {((result.successful / result.total_requested) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-medium mb-1">Avg Quality</p>
              <p className="text-2xl font-bold text-purple-900">
                {result.average_quality.toFixed(1)}/10
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium mb-1">💾 Stories Saved</p>
              <p className="text-2xl font-bold text-green-900">
                {result.stories_saved || 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-orange-600 font-medium mb-1">Total Examples</p>
              <p className="text-2xl font-bold text-orange-900">
                {result.training_stats.training_examples}
              </p>
            </div>
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-xs text-teal-600 font-medium mb-1">Until Fine-tune</p>
              <p className="text-2xl font-bold text-teal-900">
                {result.training_stats.examples_until_next_training}
              </p>
            </div>
          </div>

          {/* Model Performance */}
          {result.model_performance && Object.keys(result.model_performance).length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <p className="font-semibold text-gray-800 mb-3">🤖 AI Model Performance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(result.model_performance)
                  .sort(([, a], [, b]) => b.avg_quality - a.avg_quality)
                  .slice(0, 6)
                  .map(([model, perf]) => (
                    <div key={model} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-gray-700">{model}</span>
                        <span className="text-xs font-bold text-purple-600">{perf.avg_quality.toFixed(1)}/10</span>
                      </div>
                      <div className="text-xs text-gray-500">{perf.count} wins</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Genre Distribution */}
          {Object.keys(result.genre_distribution).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-800 mb-3">📚 Genre Distribution</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(result.genre_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([genre, count]) => (
                    <div key={genre} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-40 capitalize">
                        {genre.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / result.successful) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Fine-Tuning Status */}
          {result.ready_for_finetuning ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-800 mb-2">
                🎉 Ready for Fine-Tuning!
              </p>
              <p className="text-sm text-green-700 mb-3">
                You have collected {result.training_stats.training_examples} examples.
                Your personal AI model can now be trained!
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `http://localhost:8002/user/${userId}/trigger-finetuning`,
                      { method: 'POST' }
                    );
                    const data = await response.json();
                    alert(data.message);
                  } catch {
                    alert('Fine-tuning trigger failed');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Trigger Fine-Tuning Now
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Keep training! You need {result.training_stats.examples_until_next_training} more
                examples to reach the auto fine-tuning threshold of 50.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoTrainModel;
