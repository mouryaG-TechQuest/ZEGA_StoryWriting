import { useState, useEffect, useMemo } from 'react';
import { Heart, ArrowLeft, Search, SlidersHorizontal, Filter, X, ChevronDown } from 'lucide-react';
import StoryCard from '../../components/StoryCard';
import StoryDetailModal from '../../components/StoryDetailModal';

const API_BASE = '/api';

interface Genre {
  id: number;
  name: string;
  description?: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  description?: string;
  authorUsername: string;
  imageUrls?: string[];
  characters: any[];
  createdAt: string;
  isPublished?: boolean;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  isFavoritedByCurrentUser?: boolean;
  commentCount?: number;
  timelineJson?: string;
  writers?: string;
  viewCount?: number;
  storyNumber?: string;
  totalWatchTime?: number;
  showSceneTimeline?: boolean;
  genres?: Genre[];
}

interface FavoritesPageProps {
  onNavigate?: (page: 'home') => void;
  hideBackButton?: boolean; // Add this prop to hide back button when embedded
}

export default function FavoritesPage({ onNavigate, hideBackButton = false }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailStory, setDetailStory] = useState<Story | null>(null);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'titleAZ' | 'titleZA' | 'authorAZ' | 'authorZA'>('newest');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [sortHoverTimeout, setSortHoverTimeout] = useState<number | null>(null);
  const [sortCloseTimeout, setSortCloseTimeout] = useState<number | null>(null);
  const [genreHoverTimeout, setGenreHoverTimeout] = useState<number | null>(null);
  const [genreCloseTimeout, setGenreCloseTimeout] = useState<number | null>(null);

  useEffect(() => {
    fetchFavorites();
    fetchGenres();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stories/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch(`${API_BASE}/stories/genres`);
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      }
    } catch (err) {
      console.error('Failed to fetch genres:', err);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const story = favorites.find(s => s.id === id);
      const method = story?.isLikedByCurrentUser ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API_BASE}/stories/${id}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updatedStory = await response.json();
        setFavorites(favorites.map(s => s.id === id ? updatedStory : s));
        // Update detail story if it's currently open
        if (detailStory?.id === id) {
          setDetailStory(updatedStory);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stories/${id}/favorite`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setFavorites(favorites.filter(s => s.id !== id));
        // Close detail modal if the unfavorited story is currently open
        if (detailStory?.id === id) {
          setDetailStory(null);
        }
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Filter and sort favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let filtered = [...favorites];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(story => {
        return (
          story.title.toLowerCase().includes(query) ||
          story.authorUsername.toLowerCase().includes(query) ||
          story.description?.toLowerCase().includes(query) ||
          story.storyNumber?.includes(query)
        );
      });
    }

    // Apply genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(story =>
        story.genres?.some(genre => selectedGenres.includes(genre.id))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'titleAZ':
          return a.title.localeCompare(b.title);
        case 'titleZA':
          return b.title.localeCompare(a.title);
        case 'authorAZ':
          return a.authorUsername.localeCompare(b.authorUsername);
        case 'authorZA':
          return b.authorUsername.localeCompare(a.authorUsername);
        default:
          return 0;
      }
    });

    return sorted;
  }, [favorites, searchQuery, selectedGenres, sortBy]);

  // Displayed stories with infinite scroll
  const displayedStories = filteredAndSortedFavorites.slice(0, displayedCount);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(10);
  }, [searchQuery, sortBy, selectedGenres]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        if (displayedCount < filteredAndSortedFavorites.length) {
          setDisplayedCount(prev => Math.min(prev + 10, filteredAndSortedFavorites.length));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedCount, filteredAndSortedFavorites.length]);

  // Hover handlers for Sort dropdown
  const handleSortMouseEnter = () => {
    if (sortCloseTimeout) {
      clearTimeout(sortCloseTimeout);
      setSortCloseTimeout(null);
    }
    if (sortHoverTimeout) {
      clearTimeout(sortHoverTimeout);
    }
    const timeout = window.setTimeout(() => {
      setShowSortDropdown(true);
    }, 200);
    setSortHoverTimeout(timeout);
  };

  const handleSortMouseLeave = () => {
    if (sortHoverTimeout) {
      clearTimeout(sortHoverTimeout);
      setSortHoverTimeout(null);
    }
    const timeout = window.setTimeout(() => {
      setShowSortDropdown(false);
    }, 300);
    setSortCloseTimeout(timeout);
  };

  const handleSortDropdownMouseEnter = () => {
    if (sortHoverTimeout) {
      clearTimeout(sortHoverTimeout);
      setSortHoverTimeout(null);
    }
    if (sortCloseTimeout) {
      clearTimeout(sortCloseTimeout);
      setSortCloseTimeout(null);
    }
  };

  // Hover handlers for Genre dropdown
  const handleGenreMouseEnter = () => {
    if (genreCloseTimeout) {
      clearTimeout(genreCloseTimeout);
      setGenreCloseTimeout(null);
    }
    if (genreHoverTimeout) {
      clearTimeout(genreHoverTimeout);
    }
    const timeout = window.setTimeout(() => {
      setShowGenreDropdown(true);
    }, 200);
    setGenreHoverTimeout(timeout);
  };

  const handleGenreMouseLeave = () => {
    if (genreHoverTimeout) {
      clearTimeout(genreHoverTimeout);
      setGenreHoverTimeout(null);
    }
    const timeout = window.setTimeout(() => {
      setShowGenreDropdown(false);
    }, 300);
    setGenreCloseTimeout(timeout);
  };

  const handleGenreDropdownMouseEnter = () => {
    if (genreHoverTimeout) {
      clearTimeout(genreHoverTimeout);
      setGenreHoverTimeout(null);
    }
    if (genreCloseTimeout) {
      clearTimeout(genreCloseTimeout);
      setGenreCloseTimeout(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          {!hideBackButton && (
            <button
              onClick={() => onNavigate?.('home')}
              className="flex items-center text-purple-600 hover:text-purple-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Home</span>
            </button>
          )}
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                My Favorite Stories
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredAndSortedFavorites.length} {filteredAndSortedFavorites.length === 1 ? 'story' : 'stories'} found
              </p>
            </div>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center border border-purple-100">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
              <Heart className="w-16 h-16 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">No favorites yet</h2>
            <p className="text-gray-600 text-lg mb-8">Start exploring amazing stories and save your favorites!</p>
            <button
              onClick={() => onNavigate?.('home')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Explore Stories
            </button>
          </div>
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-2xl shadow-lg border border-purple-200/30 p-4 mb-6 space-y-4 relative z-[100]">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-purple-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search favorites by title, author, #number..."
                  className="block w-full pl-12 pr-12 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm placeholder-gray-400 bg-white/80"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-purple-700 bg-purple-50 px-3 py-2 rounded-lg font-semibold">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{filteredAndSortedFavorites.length} results</span>
                </div>

                <div className="h-5 w-px bg-purple-200"></div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onMouseEnter={handleSortMouseEnter}
                    onMouseLeave={handleSortMouseLeave}
                    className="px-4 py-2 border border-purple-200 rounded-lg hover:border-purple-300 transition-all bg-white/80 font-medium flex items-center gap-2"
                  >
                    <span>
                      {sortBy === 'newest' && '🆕 Newest'}
                      {sortBy === 'oldest' && '📅 Oldest'}
                      {sortBy === 'titleAZ' && '📖 Title A-Z'}
                      {sortBy === 'titleZA' && '📖 Title Z-A'}
                      {sortBy === 'authorAZ' && '✍️ Author A-Z'}
                      {sortBy === 'authorZA' && '✍️ Author Z-A'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showSortDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl w-56 overflow-hidden z-[200]"
                      onMouseEnter={handleSortDropdownMouseEnter}
                      onMouseLeave={handleSortMouseLeave}
                    >
                      <button
                        onClick={() => { setSortBy('newest'); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                      >
                        🆕 Newest First
                      </button>
                      <button
                        onClick={() => { setSortBy('oldest'); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                      >
                        📅 Oldest First
                      </button>
                      <div className="h-px bg-purple-100"></div>
                      <button
                        onClick={() => { setSortBy('titleAZ'); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                      >
                        📖 Title (A-Z)
                      </button>
                      <button
                        onClick={() => { setSortBy('titleZA'); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                      >
                        📖 Title (Z-A)
                      </button>
                      <div className="h-px bg-purple-100"></div>
                      <button
                        onClick={() => { setSortBy('authorAZ'); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                      >
                        ✍️ Author (A-Z)
                      </button>
                      <button
                        onClick={() => { setSortBy('authorZA'); setShowSortDropdown(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
                      >
                        ✍️ Author (Z-A)
                      </button>
                    </div>
                  )}
                </div>

                {/* Genre Filter */}
                {genres.length > 0 && (
                  <div className="relative">
                    <button
                      onMouseEnter={handleGenreMouseEnter}
                      onMouseLeave={handleGenreMouseLeave}
                      className={`px-4 py-2 border rounded-lg transition-all font-medium flex items-center gap-2 ${
                        selectedGenres.length > 0
                          ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                          : 'bg-white/80 text-gray-700 border-purple-200 hover:border-purple-300'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Genre</span>
                      {selectedGenres.length > 0 && (
                        <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                          {selectedGenres.length}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {showGenreDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl w-96 max-h-96 overflow-y-auto z-[200]"
                        onMouseEnter={handleGenreDropdownMouseEnter}
                        onMouseLeave={handleGenreMouseLeave}
                      >
                        <div className="p-3 border-b border-purple-100 flex items-center justify-between sticky top-0 bg-white">
                          <span className="font-semibold text-purple-900">Filter by Genre</span>
                          {selectedGenres.length > 0 && (
                            <button
                              onClick={() => setSelectedGenres([])}
                              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="p-2 grid grid-cols-2 gap-1">
                          {genres.map((genre) => {
                            const isSelected = selectedGenres.includes(genre.id);
                            return (
                              <label
                                key={genre.id}
                                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-purple-100 text-purple-900'
                                    : 'hover:bg-purple-50 text-gray-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newGenres = e.target.checked
                                      ? [...selectedGenres, genre.id]
                                      : selectedGenres.filter(id => id !== genre.id);
                                    setSelectedGenres(newGenres);
                                  }}
                                  className="w-4 h-4 rounded border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium">{genre.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Search Badge */}
                {searchQuery && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Search:</span>
                    <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-semibold text-xs border border-purple-200">
                      "{searchQuery}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stories Grid */}
            {filteredAndSortedFavorites.length > 0 ? (
              <>
                <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {displayedStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      storyNumber={story.storyNumber}
                      isOwner={false}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onView={() => setDetailStory(story)}
                      onToggleLike={handleToggleLike}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>

                {/* Loading indicator for infinite scroll */}
                {displayedCount < filteredAndSortedFavorites.length && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600 mb-3"></div>
                    <p className="text-gray-600 font-medium">Loading more favorites...</p>
                  </div>
                )}

                {/* End of results */}
                {displayedCount >= filteredAndSortedFavorites.length && filteredAndSortedFavorites.length > 10 && (
                  <div className="text-center py-8">
                    <div className="inline-block p-3 bg-purple-100 rounded-full mb-3">
                      <Heart className="w-6 h-6 text-purple-600 fill-purple-600" />
                    </div>
                    <p className="text-gray-600 font-medium">You've reached the end of your favorites!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 text-center border border-purple-100">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Favorites Found</h3>
                <p className="text-gray-600 text-lg mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenres([]);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <X className="w-5 h-5 mr-2" />
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Story Detail Modal */}
      {detailStory && (
        <StoryDetailModal 
          story={detailStory}
          onClose={() => setDetailStory(null)}
        />
      )}
    </div>
  );
}
