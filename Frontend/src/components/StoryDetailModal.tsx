import { X, Edit, Info, Users, BookOpen, Film, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Character {
  id?: string;
  name: string;
  description: string;
  role: string;
  actorName?: string;
  imageUrls?: string[];  // Changed from imageUrl to imageUrls array
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

interface Story {
  id: string;
  title: string;
  content: string;
  description?: string;
  timelineJson?: string;
  imageUrls?: string[];
  authorUsername: string;
  characters: Character[];
  createdAt: string;
  showSceneTimeline?: boolean; // Option for writer to show/hide scene timeline
  writers?: string;
  viewCount?: number;
  likeCount?: number;
}

interface StoryDetailModalProps {
  story: Story;
  onClose: () => void;
  onEdit?: (story: Story, sceneIndex?: number) => void;
  currentUsername?: string;
  showAsPage?: boolean; // New prop to control if shown as page or modal
}

export default function StoryDetailModal({ 
  story, 
  onClose, 
  onEdit,
  currentUsername,
  showAsPage = false
}: StoryDetailModalProps) {
  const [viewMode, setViewMode] = useState<'intro' | 'timeline' | 'cast' | 'full'>('full');
  const startTimeRef = useRef<number>(Date.now());
  const viewTrackedRef = useRef<boolean>(false);
  
  // Cast pagination and search
  const [castPage, setCastPage] = useState(1);
  const [castSearch, setCastSearch] = useState('');
  const castPerPage = 6;
  
  // Scene pagination and search
  const [scenePage, setScenePage] = useState(1);
  const [sceneSearch, setSceneSearch] = useState('');
  const scenesPerPage = 5;
  
  // Full story pagination and search
  const [storyPage, setStoryPage] = useState(1);
  const [storySearch, setStorySearch] = useState('');
  const [searchType, setSearchType] = useState<'page' | 'scene' | 'title'>('page');
  const wordsPerPage = 500;
  
  // Collapsible scenes state
  const [expandedScenes, setExpandedScenes] = useState<Set<number>>(new Set());

  const toggleScene = (index: number) => {
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAllScenes = () => {
    const allIndices = timeline.map((_, idx) => idx);
    setExpandedScenes(new Set(allIndices));
  };

  const collapseAllScenes = () => {
    setExpandedScenes(new Set());
  };

  // Parse timeline from JSON - MUST be before useEffects that use it
  let timeline: TimelineEntry[] = [];
  try {
    if (story.timelineJson) {
      timeline = JSON.parse(story.timelineJson);
      // Sort by order if available
      timeline.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch {
    timeline = [];
  }

  const isOwner = currentUsername && story.authorUsername === currentUsername;

  // Helper function to highlight character names in text
  const highlightCharacters = (text: string, sceneCharacters?: string[]) => {
    if (!text) return text;
    
    // Get all character names from the story
    const allCharacterNames = story.characters.map(c => c.name);
    
    // Use scene-specific characters if provided, otherwise use all
    const charactersToHighlight = sceneCharacters && sceneCharacters.length > 0 
      ? sceneCharacters 
      : allCharacterNames;
    
    if (charactersToHighlight.length === 0) return text;

    // Sort by length (descending) to match longer names first
    const sortedNames = [...charactersToHighlight].sort((a, b) => b.length - a.length);
    
    // Create regex pattern to match character names (case insensitive, word boundaries)
    const pattern = sortedNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
    
    // Split text and highlight matches
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, idx) => {
          // Check if this part is a character name
          const isCharacterName = sortedNames.some(name => 
            name.toLowerCase() === part.toLowerCase()
          );
          
          if (isCharacterName) {
            return (
              <span
                key={idx}
                className="font-bold text-purple-700 bg-purple-100 px-1 rounded"
              >
                {part}
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  // Keyboard navigation for full story view
  useEffect(() => {
    if (viewMode !== 'full') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Build full story from timeline or content
      let fullStoryText = '';
      if (timeline && timeline.length > 0) {
        // Just concatenate scene descriptions for continuous narrative
        fullStoryText = timeline.map(scene => scene.description).join('\n\n');
      } else if (story.content) {
        fullStoryText = story.content;
      }
      
      const words = fullStoryText.split(/\s+/).filter(word => word.length > 0);
      const totalPages = Math.ceil(words.length / wordsPerPage);

      if (e.key === 'ArrowLeft') {
        setStoryPage(p => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setStoryPage(p => Math.min(totalPages, p + 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, timeline, story.content, wordsPerPage]);
  
  // Prevent viewing timeline when hidden
  useEffect(() => {
    if (viewMode === 'timeline' && story.showSceneTimeline === false && !isOwner) {
      setViewMode('intro'); // Redirect to intro if trying to view hidden timeline
    }
  }, [viewMode, story.showSceneTimeline, isOwner]);
  
  // Track view count when modal opens (only once)
  useEffect(() => {
    const trackView = async () => {
      if (viewTrackedRef.current) return; // Already tracked
      viewTrackedRef.current = true;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        await fetch(`/api/stories/${story.id}/view`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        console.error('Failed to track view:', err);
      }
    };
    
    trackView();
    startTimeRef.current = Date.now();
    
    // Track watch time when modal closes
    return () => {
      const watchTime = Math.floor((Date.now() - startTimeRef.current) / 1000); // in seconds
      if (watchTime > 0) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`/api/stories/${story.id}/watch-time`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ watchTime })
          }).catch(err => console.error('Failed to track watch time:', err));
        }
      }
    };
  }, [story.id]);
  
  const handleEditScene = (sceneIndex: number) => {
    if (onEdit) {
      onClose(); // Close modal before redirecting
      onEdit(story, sceneIndex);
    }
  };

  const handleEditStory = () => {
    if (onEdit) {
      onClose(); // Close modal before redirecting
      onEdit(story);
    }
  };

  // Content card structure
  const contentCard = (
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6 rounded-t-2xl z-50 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{story.title}</h2>
            <p className="text-xs sm:text-sm opacity-90">
              By <span className="font-semibold">{story.authorUsername}</span> · 📅 {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : '-'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isOwner && onEdit && (
              <button
                onClick={handleEditStory}
                className="flex items-center space-x-1 bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg hover:bg-yellow-400 transition font-semibold text-sm"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {!showAsPage && (
              <button
                aria-label="Close"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setViewMode('intro')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-semibold transition whitespace-nowrap text-sm ${
              viewMode === 'intro'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Story Intro</span>
          </button>
          
          {timeline.length > 0 && (story.showSceneTimeline !== false || isOwner) && (
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-semibold transition whitespace-nowrap text-sm ${
                viewMode === 'timeline'
                  ? 'bg-white text-purple-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Scene Timeline</span>
            </button>
          )}
          
          {/* Hidden Timeline Notice for non-owners */}
          {timeline.length > 0 && story.showSceneTimeline === false && !isOwner && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-white/60 text-sm cursor-not-allowed">
              <Film className="w-4 h-4" />
              <span>Scene Timeline (Hidden by Author)</span>
            </div>
          )}
          
          <button
            onClick={() => setViewMode('cast')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-semibold transition whitespace-nowrap text-sm ${
              viewMode === 'cast'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cast</span>
          </button>
          
          <button
            onClick={() => setViewMode('full')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-semibold transition whitespace-nowrap text-sm ${
              viewMode === 'full'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Full Story</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Intro View */}
        {viewMode === 'intro' && (
          <div className="space-y-6">
            {/* Story Image */}
            {story.imageUrls && story.imageUrls.length > 0 && (
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <img
                  src={story.imageUrls[0].startsWith('http') ? story.imageUrls[0] : `http://localhost:8080${story.imageUrls[0]}`}
                  alt={story.title}
                  className="w-full h-64 sm:h-96 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23667eea" width="800" height="400"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="24"%3E${encodeURIComponent(story.title)}%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-3xl sm:text-4xl font-bold drop-shadow-lg">{story.title}</h3>
                </div>
              </div>
            )}

            {/* Description Card */}
            {story.description && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 shadow-md">
                <h4 className="text-xl font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  About This Story
                </h4>
                <p className="text-gray-700 leading-relaxed text-base">{story.description}</p>
                <div className="mt-4 pt-4 border-t border-purple-200 space-y-2">
                  <p className="text-sm text-purple-700">
                    <span className="font-semibold">Published by:</span> {story.authorUsername}
                  </p>
                  {story.writers && (
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Writers:</span> {story.writers}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-purple-100 text-center">
                <div className="text-2xl font-bold text-purple-600">{story.characters.length}</div>
                <div className="text-xs text-gray-600 mt-1">Characters</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-blue-100 text-center">
                <div className="text-2xl font-bold text-blue-600">{timeline.length}</div>
                <div className="text-xs text-gray-600 mt-1">Scenes</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-indigo-100 text-center">
                <div className="text-2xl font-bold text-indigo-600">{story.viewCount || 0}</div>
                <div className="text-xs text-gray-600 mt-1">Views</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-pink-100 text-center">
                <div className="text-2xl font-bold text-pink-600">
                  {(() => {
                    // Calculate from timeline scenes or content
                    let fullText = '';
                    if (timeline && timeline.length > 0) {
                      fullText = timeline.map(scene => scene.description).join(' ');
                    } else if (story.content) {
                      fullText = story.content;
                    }
                    const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
                    // Average reading speed: 238 words/min for adults (based on research)
                    const minutes = Math.ceil(wordCount / 238);
                    return minutes;
                  })()}
                </div>
                <div className="text-xs text-gray-600 mt-1">Minutes to Read</div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white text-center">
              <h4 className="text-xl font-bold mb-2">Ready to dive in?</h4>
              <p className="text-sm opacity-90 mb-4">Explore the cast, scenes, or read the complete story</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setViewMode('cast')}
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Meet the Cast
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-400 transition"
                >
                  Read Full Story
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cast View */}
        {viewMode === 'cast' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Cast & Characters
              </h3>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                {story.characters.length} Characters
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by character name or actor name..."
                value={castSearch}
                onChange={(e) => {
                  setCastSearch(e.target.value);
                  setCastPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
              />
            </div>

            {story.characters.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No characters added yet</p>
              </div>
            ) : (() => {
              // Filter and sort characters
              const filteredCharacters = story.characters
                .filter(char => {
                  const searchLower = castSearch.toLowerCase();
                  return (
                    char.name.toLowerCase().includes(searchLower) ||
                    (char.actorName && char.actorName.toLowerCase().includes(searchLower))
                  );
                })
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

              const totalPages = Math.ceil(filteredCharacters.length / castPerPage);
              const startIdx = (castPage - 1) * castPerPage;
              const paginatedCharacters = filteredCharacters.slice(startIdx, startIdx + castPerPage);

              return (
                <>
                  {filteredCharacters.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No characters found matching "{castSearch}"</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                        {paginatedCharacters.map((character, idx) => (
                          <div
                            key={character.id || idx}
                            className="bg-white rounded-lg shadow-md border-2 border-purple-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-purple-300"
                          >
                            <div className="flex flex-col h-full">
                              {/* Character Image - Full visibility with consistent dimensions */}
                              <div className="w-full h-32 flex-shrink-0 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                                {character.imageUrls && character.imageUrls.length > 0 ? (
                                  <img
                                    src={character.imageUrls[0].startsWith('http') 
                                      ? character.imageUrls[0] 
                                      : `http://localhost:8080${character.imageUrls[0]}`}
                                    alt={character.name}
                                    className="w-full h-full object-contain bg-white"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%239333ea" width="200" height="200"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="48"%3E' + character.name.charAt(0) + '%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-4xl font-bold text-purple-400">
                                      {character.name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Character Info - Compact Layout */}
                              <div className="flex-1 p-3">
                                <div className="mb-1">
                                  <h4 className="text-base font-bold text-gray-900 truncate">{character.name}</h4>
                                  <div className="flex flex-wrap gap-1 items-center mt-1">
                                    {character.actorName && (
                                      <span className="text-xs text-blue-600 font-medium truncate">
                                        🎭 {character.actorName}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 items-center mt-1">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                      {character.role}
                                    </span>
                                    {/* Popularity removed */}
                                  </div>
                                </div>
                                
                                {character.description && (
                                  <p className="text-gray-600 text-xs leading-relaxed line-clamp-1">
                                    {character.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            onClick={() => setCastPage(p => Math.max(1, p - 1))}
                            disabled={castPage === 1}
                            className="p-2 rounded-lg border-2 border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setCastPage(page)}
                                className={`w-10 h-10 rounded-lg font-semibold transition ${
                                  castPage === page
                                    ? 'bg-purple-600 text-white'
                                    : 'border-2 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCastPage(p => Math.min(totalPages, p + 1))}
                            disabled={castPage === totalPages}
                            className="p-2 rounded-lg border-2 border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {/* Results Info */}
                      <div className="text-center text-sm text-gray-500 mt-4">
                        Showing {startIdx + 1}-{Math.min(startIdx + castPerPage, filteredCharacters.length)} of {filteredCharacters.length} characters
                        {castSearch && ` (filtered)`}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Timeline Scene Viewer */}
        {timeline.length > 0 && viewMode === 'timeline' && (story.showSceneTimeline !== false || isOwner) && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Film className="w-6 h-6 text-purple-600" />
                Scene Timeline
              </h3>
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {timeline.length} Scenes
                </span>
                <button
                  onClick={expandAllScenes}
                  className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAllScenes}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search scenes by number, title, or description..."
                value={sceneSearch}
                onChange={(e) => {
                  setSceneSearch(e.target.value);
                  setScenePage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none"
              />
            </div>

            {(() => {
              // Filter scenes
              const filteredScenes = timeline.filter((scene, idx) => {
                const searchLower = sceneSearch.toLowerCase();
                const sceneNumber = (idx + 1).toString();
                return (
                  sceneNumber.includes(searchLower) ||
                  scene.event.toLowerCase().includes(searchLower) ||
                  scene.description.toLowerCase().includes(searchLower)
                );
              });

              const totalPages = Math.ceil(filteredScenes.length / scenesPerPage);
              const startIdx = (scenePage - 1) * scenesPerPage;
              const paginatedScenes = filteredScenes.slice(startIdx, startIdx + scenesPerPage);

              return (
                <>
                  {filteredScenes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No scenes found matching "{sceneSearch}"</p>
                    </div>
                  ) : (
                    <>
                      {/* Scene Cards */}
                      <div className="space-y-4">
                        {paginatedScenes.map((scene, idx) => {
                          const actualIdx = startIdx + idx;
                          const isExpanded = expandedScenes.has(actualIdx);
                          
                          return (
                            <div
                              key={scene.id || actualIdx}
                              className="bg-white rounded-xl shadow-lg border-2 border-purple-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                            >
                              {/* Scene Header - Always Visible */}
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-4 flex items-center justify-between cursor-pointer hover:from-purple-600 hover:to-blue-600 transition"
                                onClick={() => toggleScene(actualIdx)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="bg-white text-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {actualIdx + 1}
                                  </span>
                                  <h4 className="text-lg font-bold">{scene.event}</h4>
                                  {scene.characters && scene.characters.length > 0 && (
                                    <span className="bg-white/20 px-2 py-1 rounded text-xs">
                                      {scene.characters.length} cast
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isOwner && onEdit && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditScene(actualIdx);
                                      }}
                                      className="text-white hover:bg-white/20 rounded-lg px-3 py-1 transition text-sm flex items-center gap-1"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </button>
                                  )}
                                  <button className="text-white">
                                    {isExpanded ? (
                                      <ChevronLeft className="w-5 h-5 rotate-90" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 rotate-90" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Scene Content - Collapsible */}
                              {isExpanded && (
                                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                                  <div className="bg-white rounded-lg p-4 mb-4 border-2 border-purple-200">
                                    <p className="text-gray-700 leading-relaxed text-base">
                                      {highlightCharacters(scene.description, scene.characters)}
                                    </p>
                                  </div>
                                  
                                  {/* Characters in Scene */}
                                  {scene.characters && scene.characters.length > 0 && (
                                    <div className="mb-4">
                                      <p className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Cast in this scene:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {scene.characters.map((charName, i) => {
                                          return (
                                            <span
                                              key={i}
                                              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
                                            >
                                              {/* Popularity removed */}
                                              {charName}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Scene Images */}
                                  {scene.imageUrls && scene.imageUrls.length > 0 && (
                                    <div>
                                      <p className="text-sm font-bold text-purple-700 mb-2">Scene Images:</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {scene.imageUrls.slice(0, 6).map((url, i) => (
                                          <img
                                            key={i}
                                            src={url.startsWith('http') ? url : `http://localhost:8080${url}`}
                                            alt={`Scene ${actualIdx + 1} - Image ${i + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-purple-200 hover:border-purple-400 transition shadow-md hover:shadow-xl"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            onClick={() => setScenePage(p => Math.max(1, p - 1))}
                            disabled={scenePage === 1}
                            className="p-2 rounded-lg border-2 border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => setScenePage(page)}
                                className={`w-10 h-10 rounded-lg font-semibold transition ${
                                  scenePage === page
                                    ? 'bg-purple-600 text-white'
                                    : 'border-2 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setScenePage(p => Math.min(totalPages, p + 1))}
                            disabled={scenePage === totalPages}
                            className="p-2 rounded-lg border-2 border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {/* Results Info */}
                      <div className="text-center text-sm text-gray-500 mt-4">
                        Showing {startIdx + 1}-{Math.min(startIdx + scenesPerPage, filteredScenes.length)} of {filteredScenes.length} scenes
                        {sceneSearch && ` (filtered)`}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </section>
        )}

        {/* Full Story View */}
        {viewMode === 'full' && (
          <>
            {(() => {
              // Build full story from scene timeline descriptions
              let fullStoryText = '';
              
              if (timeline && timeline.length > 0) {
                // Concatenate all scene descriptions for continuous narrative
                fullStoryText = timeline.map(scene => scene.description).join('\n\n');
              } else if (story.content && story.content.trim().length > 0) {
                // Fallback to story.content if no timeline
                fullStoryText = story.content;
              }
              
              if (!fullStoryText || fullStoryText.trim().length === 0) {
                return (
                  <div className="text-center py-20">
                    <BookOpen className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-600 mb-2">No Story Content</h3>
                    <p className="text-gray-500">This story doesn't have any scenes or content yet.</p>
                  </div>
                );
              }

              // Split content into words and create pages
              const words = fullStoryText.split(/\s+/).filter(word => word.length > 0);
              const totalPages = Math.ceil(words.length / wordsPerPage);
              const startIdx = (storyPage - 1) * wordsPerPage;
              const pageWords = words.slice(startIdx, startIdx + wordsPerPage);
              const pageContent = pageWords.join(' ');

              return (
                <section className="space-y-6">
                  {/* Book Header */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-amber-600" />
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Page {storyPage} of {totalPages}</span>
                      </div>
                    </div>
                    
                    {story.description && (
                      <p className="text-gray-600 text-sm italic border-l-4 border-amber-400 pl-4 mb-3">
                        "{story.description}"
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 items-center text-sm mb-4">
                      <span className="text-amber-700 font-semibold">
                        📖 Published by: <span className="text-amber-900">{story.authorUsername}</span>
                      </span>
                      {story.writers && (
                        <span className="text-blue-700 font-semibold">
                          ✍️ Writers: <span className="text-blue-900">{story.writers}</span>
                        </span>
                      )}
                    </div>

                    {/* Search Bar Below Title */}
                    <div className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Type Dropdown */}
                        <select
                          value={searchType}
                          onChange={(e) => {
                            setSearchType(e.target.value as 'page' | 'scene' | 'title');
                            setStorySearch('');
                          }}
                          className="px-4 py-2 border-2 border-amber-300 rounded-lg font-semibold focus:border-amber-500 focus:outline-none bg-white shadow-sm min-w-[140px]"
                        >
                          <option value="page">Page Number</option>
                          <option value="scene">Scene Number</option>
                          <option value="title">Scene Title</option>
                        </select>

                        {/* Search Input or Dropdown based on type */}
                        {searchType === 'page' ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max={totalPages}
                              placeholder="Enter page number..."
                              value={storySearch}
                              onChange={(e) => setStorySearch(e.target.value)}
                              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const pageNum = Number(storySearch);
                                if (pageNum >= 1 && pageNum <= totalPages) {
                                  setStoryPage(pageNum);
                                  setStorySearch('');
                                }
                              }}
                              disabled={!storySearch || Number(storySearch) < 1 || Number(storySearch) > totalPages}
                              className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              Go
                            </button>
                          </div>
                        ) : searchType === 'scene' && timeline && timeline.length > 0 ? (
                          <select
                            value={storySearch}
                            onChange={(e) => {
                              const sceneIndex = Number(e.target.value);
                              if (sceneIndex >= 0) {
                                let wordCount = 0;
                                for (let i = 0; i < sceneIndex; i++) {
                                  wordCount += timeline[i].description.split(/\s+/).filter(w => w.length > 0).length;
                                  if (i < sceneIndex - 1) wordCount += 2;
                                }
                                const targetPage = Math.floor(wordCount / wordsPerPage) + 1;
                                setStoryPage(targetPage);
                                setStorySearch('');
                              }
                            }}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          >
                            <option value="">Select scene number...</option>
                            {timeline.map((_, idx) => (
                              <option key={idx} value={idx}>
                                Scene {idx + 1}
                              </option>
                            ))}
                          </select>
                        ) : searchType === 'title' && timeline && timeline.length > 0 ? (
                          <select
                            value={storySearch}
                            onChange={(e) => {
                              const sceneIndex = Number(e.target.value);
                              if (sceneIndex >= 0) {
                                let wordCount = 0;
                                for (let i = 0; i < sceneIndex; i++) {
                                  wordCount += timeline[i].description.split(/\s+/).filter(w => w.length > 0).length;
                                  if (i < sceneIndex - 1) wordCount += 2;
                                }
                                const targetPage = Math.floor(wordCount / wordsPerPage) + 1;
                                setStoryPage(targetPage);
                                setStorySearch('');
                              }
                            }}
                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
                          >
                            <option value="">Select scene title...</option>
                            {timeline.map((scene, idx) => (
                              <option key={idx} value={idx}>
                                {scene.event.length > 50 ? scene.event.substring(0, 50) + '...' : scene.event}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex-1 text-gray-500 px-4 py-2">
                            No scenes available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Book Content */}
                  <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-xl shadow-2xl border-4 border-amber-200 overflow-hidden">
                    {/* Book Page Effect */}
                    <div className="relative p-8 sm:p-12 min-h-[500px] bg-[linear-gradient(to_right,#fef3e2_1px,transparent_1px),linear-gradient(to_bottom,#fef3e2_1px,transparent_1px)] bg-[size:20px_20px]">
                      {/* Decorative Book Spine */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-600 to-amber-500 opacity-20"></div>
                      
                      {/* Page Number Top */}
                      <div className="absolute top-4 right-8 text-amber-600 font-serif text-sm">
                        {storyPage}
                      </div>

                      {/* Content */}
                      <div className="relative z-10 max-w-3xl mx-auto">
                        <div className="prose prose-lg max-w-none font-serif leading-relaxed text-lg">
                          {/* Drop Cap for first page */}
                          {storyPage === 1 ? (
                            <p className="text-gray-800 text-justify">
                              <span className="float-left text-7xl font-bold text-amber-600 leading-none pr-3 pt-2 font-serif">
                                {pageContent.charAt(0)}
                              </span>
                              {highlightCharacters(pageContent.slice(1))}
                            </p>
                          ) : (
                            <p className="text-gray-800 text-justify leading-relaxed">
                              {highlightCharacters(pageContent)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Decorative Corner */}
                      <div className="absolute bottom-8 right-8 w-16 h-16 opacity-10">
                        <svg viewBox="0 0 100 100" className="text-amber-600 fill-current">
                          <path d="M0,0 L100,0 L100,100 Z" />
                        </svg>
                      </div>

                      {/* Page Number Bottom */}
                      <div className="absolute bottom-6 left-0 right-0 text-center text-amber-600 font-serif text-sm font-semibold">
                        — {storyPage} —
                      </div>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6 border-2 border-amber-200">
                    {/* Page Navigation */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <button
                        onClick={() => setStoryPage(p => Math.max(1, p - 1))}
                        disabled={storyPage === 1}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-700 hover:to-orange-700 transition shadow-md"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                      </button>

                      {/* Page Indicator */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 font-semibold">Jump to page:</span>
                        <select
                          value={storyPage}
                          onChange={(e) => setStoryPage(Number(e.target.value))}
                          className="px-4 py-2 border-2 border-amber-300 rounded-lg font-semibold focus:border-amber-500 focus:outline-none bg-white shadow-md"
                        >
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <option key={page} value={page}>
                              Page {page}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setStoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={storyPage === totalPages}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-700 hover:to-orange-700 transition shadow-md"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-4 bg-amber-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-300 rounded-full shadow-lg"
                        style={{ width: `${(storyPage / totalPages) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-2 font-semibold">
                      {Math.round((storyPage / totalPages) * 100)}% Complete · {words.length.toLocaleString()} words · {Math.ceil(words.length / 238)} minutes to read
                    </div>
                  </div>

                  {/* Reading Tips */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 text-center">
                      💡 <span className="font-semibold">Tip:</span> Use keyboard arrow keys (← →) to navigate between pages. Character names are <span className="font-bold text-purple-700 bg-purple-100 px-1 rounded">highlighted</span> throughout the story.
                    </p>
                  </div>
                </section>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );

  // Return based on showAsPage prop
  if (showAsPage) {
    return contentCard;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000000] overflow-auto">
      {contentCard}
    </div>
  );
}
