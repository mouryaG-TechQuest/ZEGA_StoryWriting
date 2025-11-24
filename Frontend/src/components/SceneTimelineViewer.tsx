import { useState, useEffect, useRef } from 'react';
import { Play, Edit, ChevronLeft, ChevronRight, BookOpen, Users } from 'lucide-react';
import { getCharacterColor, getAllCharacterNames } from '../utils/characterColors.tsx';

interface Character {
  id?: string;
  name: string;
  description: string;
  role: string;
  actorName?: string;
  popularity?: number;
}

interface TimelineEntry {
  id: string;
  event: string;
  description: string;
  characters: string[];
  imageUrls: string[];
  order: number;
}

interface SceneTimelineViewerProps {
  timeline: TimelineEntry[];
  characters: Character[];
  onEditScene?: (sceneIndex: number) => void;
  isEditorView?: boolean; // Show edit controls for story owner
}

const SceneTimelineViewer = ({ 
  timeline, 
  characters, 
  onEditScene,
  isEditorView = false 
}: SceneTimelineViewerProps) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [hoveredScene, setHoveredScene] = useState<number | null>(null);
  const [selectedSceneForEdit, setSelectedSceneForEdit] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const allCharacterNames = getAllCharacterNames(characters);

  const sortedTimeline = [...timeline].sort((a, b) => a.order - b.order);
  const currentScene = sortedTimeline[currentSceneIndex];

  useEffect(() => {
    // Auto-scroll timeline bar when scene changes
    if (timelineRef.current && currentSceneIndex >= 0) {
      const sceneWidth = timelineRef.current.scrollWidth / sortedTimeline.length;
      const scrollPosition = sceneWidth * currentSceneIndex - timelineRef.current.clientWidth / 2 + sceneWidth / 2;
      timelineRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentSceneIndex, sortedTimeline.length]);

  const goToScene = (index: number) => {
    if (index >= 0 && index < sortedTimeline.length) {
      setCurrentSceneIndex(index);
    }
  };

  const nextScene = () => goToScene(currentSceneIndex + 1);
  const prevScene = () => goToScene(currentSceneIndex - 1);

  const renderFormattedDescription = (text: string, sceneCharacters: string[]) => {
    if (!text || sceneCharacters.length === 0) return text;
    
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    
    // Match ***name*** pattern for formatted character names
    const pattern = sceneCharacters
      .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const regex = new RegExp(`\\*\\*\\*(${pattern})\\*\\*\\*`, 'gi');
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const matchedName = match[1];
      const normalizedName = sceneCharacters.find(n => n.toLowerCase() === matchedName.toLowerCase()) || matchedName;
      const color = getCharacterColor(normalizedName, allCharacterNames);
      parts.push(
        <span
          key={`${match.index}-${matchedName}`}
          className={`font-bold italic ${color.text} px-1.5 py-0.5 rounded`}
          style={{ backgroundColor: color.hex ? `${color.hex}20` : 'transparent' }}
        >
          {matchedName}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };

  const getSceneColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  if (sortedTimeline.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No scenes in this story yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scene Timeline Bar (YouTube-style) */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">
              Scene {currentSceneIndex + 1} of {sortedTimeline.length}
            </span>
          </div>
          {isEditorView && onEditScene && (
            <button
              onClick={() => onEditScene(selectedSceneForEdit !== null ? selectedSceneForEdit : currentSceneIndex)}
              className="flex items-center space-x-1 bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition font-semibold text-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit {selectedSceneForEdit !== null ? `Scene ${selectedSceneForEdit + 1}` : 'Current Scene'}</span>
            </button>
          )}
        </div>

        {/* Timeline Progress Bar */}
        <div 
          ref={timelineRef}
          className="relative h-12 bg-gray-700 rounded-lg overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
        >
          <div className="flex h-full min-w-full">
            {sortedTimeline.map((scene, index) => {
              const isActive = index === currentSceneIndex;
              const isHovered = index === hoveredScene;
              const sceneWidth = `${100 / sortedTimeline.length}%`;
              const colorClass = getSceneColor(index);

              return (
                <div
                  key={scene.id}
                  style={{ width: sceneWidth, minWidth: '50px' }}
                  className={`relative cursor-pointer transition-all duration-200 border-r border-gray-800 group ${
                    isActive ? 'transform scale-y-110' : ''
                  } ${
                    isEditorView && selectedSceneForEdit === index ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  onClick={() => {
                    if (isEditorView) {
                      setSelectedSceneForEdit(index);
                    }
                    goToScene(index);
                  }}
                  onMouseEnter={() => setHoveredScene(index)}
                  onMouseLeave={() => setHoveredScene(null)}
                >
                  {/* Scene Bar */}
                  <div 
                    className={`h-full ${colorClass} ${
                      isActive ? 'opacity-100 shadow-lg' : 'opacity-60 hover:opacity-80'
                    } transition-all relative overflow-hidden`}
                  >
                    {/* Scene Number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm drop-shadow-lg">
                        {index + 1}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-white animate-pulse"></div>
                    )}

                    {/* Hover Tooltip */}
                    {isHovered && !isActive && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl z-10 pointer-events-none">
                        {scene.event || `Scene ${index + 1}`}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={prevScene}
            disabled={currentSceneIndex === 0}
            className="flex items-center space-x-1 bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Previous</span>
          </button>

          <div className="text-white text-sm font-medium">
            {currentScene?.event || `Scene ${currentSceneIndex + 1}`}
          </div>

          <button
            onClick={nextScene}
            disabled={currentSceneIndex === sortedTimeline.length - 1}
            className="flex items-center space-x-1 bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="text-sm font-medium">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Scene Content */}
      {currentScene && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
          {/* Scene Header */}
          <div className={`${getSceneColor(currentSceneIndex)} text-white p-6`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {currentScene.event || `Scene ${currentSceneIndex + 1}`}
                </h2>
                {currentScene.characters.length > 0 && (
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <Users className="w-4 h-4" />
                    {currentScene.characters.map((charName, idx) => {
                      const character = characters.find(c => c.name === charName);
                      return (
                        <div
                          key={idx}
                          className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold border border-white/30"
                        >
                          {charName}
                          {character?.actorName && (
                            <span className="text-xs opacity-80 ml-1">({character.actorName})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <span className="font-bold text-lg">{currentSceneIndex + 1}</span>
                <span className="text-sm opacity-80">/{sortedTimeline.length}</span>
              </div>
            </div>
          </div>

          {/* Scene Images */}
          {currentScene.imageUrls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gray-50">
              {currentScene.imageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:8080${url}`}
                  alt={`Scene ${currentSceneIndex + 1} - Image ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-xl transition"
                />
              ))}
            </div>
          )}

          {/* Scene Description */}
          <div className="p-6">
            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
              {renderFormattedDescription(currentScene.description, currentScene.characters)}
            </div>
          </div>
        </div>
      )}

      {/* Scene List - Quick Navigation */}
      <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          All Scenes - Quick Jump
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedTimeline.map((scene, index) => {
            const isActive = index === currentSceneIndex;
            const colorClass = getSceneColor(index);
            
            return (
              <button
                key={scene.id}
                onClick={() => goToScene(index)}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  isActive
                    ? `${colorClass} text-white border-transparent shadow-lg transform scale-105`
                    : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-md'
                }`}
              >
                <div className="font-bold text-sm mb-1">
                  Scene {index + 1}
                </div>
                <div className={`text-xs line-clamp-2 ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                  {scene.event || `Untitled Scene`}
                </div>
                {scene.characters.length > 0 && (
                  <div className="mt-1 flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span className="text-xs opacity-80">{scene.characters.length}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Note (only visible in editor view) */}
      {isEditorView && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Editor Mode:</strong> Click on any scene bar in the timeline or use "Edit Scene" button to modify scenes. 
            Readers will only see the complete story flow without edit controls.
          </p>
        </div>
      )}
    </div>
  );
};

export default SceneTimelineViewer;
