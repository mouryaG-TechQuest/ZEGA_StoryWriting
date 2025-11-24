import { Plus, Sparkles } from 'lucide-react';

interface StoryViewToggleProps {
  view: 'all' | 'my';
  onViewChange: (view: 'all' | 'my') => void;
  allStoriesCount: number;
  myStoriesCount: number;
  onNewStory: () => void;
  showForm: boolean;
  onAIGenerate?: () => void;
}

const StoryViewToggle = ({
  view,
  onViewChange,
  allStoriesCount,
  myStoriesCount,
  onNewStory,
  showForm,
  onAIGenerate
}: StoryViewToggleProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
      <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-md p-1 flex space-x-1 border border-purple-100">
        <button
          onClick={() => onViewChange('all')}
          className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
            view === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md transform scale-105'
              : 'bg-transparent text-gray-700 hover:bg-purple-50'
          }`}
        >
          All Stories <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
            view === 'all' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
          }`}>{allStoriesCount}</span>
        </button>
        <button
          onClick={() => onViewChange('my')}
          className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
            view === 'my'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md transform scale-105'
              : 'bg-transparent text-gray-700 hover:bg-purple-50'
          }`}
        >
          My Stories <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
            view === 'my' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
          }`}>{myStoriesCount}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {onAIGenerate && (
          <button
            onClick={onAIGenerate}
            className="flex items-center justify-center px-4 sm:px-5 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105 text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white border border-indigo-400"
            title="Generate complete story with AI"
          >
            <Sparkles className="w-4 h-4 mr-1.5 animate-pulse" />
            <span>AI Generate</span>
          </button>
        )}
        
        <button
          onClick={onNewStory}
          className={`flex items-center justify-center px-4 sm:px-5 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 transform hover:scale-105 text-sm ${
            showForm
              ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
          }`}
        >
          <Plus className={`w-4 h-4 mr-1.5 transition-transform duration-300 ${
            showForm ? 'rotate-45' : 'rotate-0'
          }`} />
          <span>{showForm ? 'Hide' : 'New Story'}</span>
        </button>
      </div>
    </div>
  );
};

export default StoryViewToggle;
