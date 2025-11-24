import { useState, useEffect } from 'react';
import { BookOpen, Heart, Settings, ArrowLeft } from 'lucide-react';
import StoryCard from '../../components/StoryCard';
import StoryDetailModal from '../../components/StoryDetailModal';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import Favorites from '../Favorites/Favorites';

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
  viewCount?: number;
  commentCount?: number;
  isLikedByCurrentUser?: boolean;
  isFavoritedByCurrentUser?: boolean;
  genres?: Genre[];
  storyNumber?: string;
  totalWatchTime?: number;
  showSceneTimeline?: boolean;
  writers?: string;
}

interface ProfilePageProps {
  onNavigate?: (page: 'home' | 'settings') => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [username, setUsername] = useState('');
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState<'stories' | 'favorites'>('stories');
  const [loading, setLoading] = useState(true);
  const [detailStory, setDetailStory] = useState<Story | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostLiked' | 'mostViewed'>('newest');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [displayedCount, setDisplayedCount] = useState(12);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername || '');
    fetchMyStories();
    fetchGenres();
  }, []);

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

  const fetchMyStories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stories/my-stories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyStories(data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (storyId: string, isLiked: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE}/stories/${storyId}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updated = await response.json();
        setMyStories(prev => prev.map(s => s.id === storyId ? updated : s));
        if (detailStory && detailStory.id === storyId) {
          setDetailStory(updated);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleFavorite = async (storyId: string, isFavorited: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE}/stories/${storyId}/favorite`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updated = await response.json();
        setMyStories(prev => prev.map(s => s.id === storyId ? updated : s));
        if (detailStory && detailStory.id === storyId) {
          setDetailStory(updated);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const togglePublish = async (storyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stories/${storyId}/toggle-publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchMyStories();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/stories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMyStories(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  // Filter and sort stories
  const filteredAndSortedStories = myStories
    .filter(story => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const numberMatch = query.match(/^#?(\d+)$/);
        if (numberMatch) {
          return story.storyNumber === numberMatch[1];
        }
        return (
          story.title.toLowerCase().includes(query) ||
          story.description?.toLowerCase().includes(query) ||
          story.storyNumber?.includes(query)
        );
      }
      return true;
    })
    .filter(story => {
      if (selectedGenres.length > 0) {
        return story.genres?.some(genre => selectedGenres.includes(genre.id));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostLiked':
          return (b.likeCount || 0) - (a.likeCount || 0);
        case 'mostViewed':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return 0;
      }
    });

  const displayedStories = filteredAndSortedStories.slice(0, displayedCount);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        if (displayedCount < filteredAndSortedStories.length) {
          setDisplayedCount(prev => Math.min(prev + 12, filteredAndSortedStories.length));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedCount, filteredAndSortedStories.length]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(12);
  }, [searchQuery, sortBy, selectedGenres]);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto">
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-purple-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                {username}
              </h1>
              <div className="flex flex-wrap gap-4 sm:gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-semibold">{myStories.length} Stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="font-semibold">{myStories.reduce((sum, s) => sum + (s.likeCount || 0), 0)} Total Likes</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('settings')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 rounded-lg transition font-semibold text-purple-700"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition shadow-md ${
              activeTab === 'stories'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            My Stories
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition shadow-md ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Heart className="w-5 h-5" />
            Favorites
          </button>
        </div>

        {/* Stories Content */}
        {activeTab === 'stories' ? (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                <p className="mt-6 text-gray-600 font-medium">Loading your stories...</p>
              </div>
            </div>
          ) : myStories.length === 0 ? (
            <EmptyState view="my" />
          ) : (
            <>
              {/* Search and Filter Bar */}
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={(value) => setSortBy(value as 'newest' | 'oldest' | 'mostLiked' | 'mostViewed')}
                totalResults={filteredAndSortedStories.length}
                genres={genres}
                selectedGenres={selectedGenres}
                onGenresChange={setSelectedGenres}
              />

              {filteredAndSortedStories.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {displayedStories.map((story) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        storyNumber={story.storyNumber}
                        isOwner={true}
                        onEdit={() => onNavigate?.('home')}
                        onDelete={() => handleDeleteStory(story.id)}
                        onView={() => setDetailStory(story)}
                        onToggleLike={toggleLike}
                        onToggleFavorite={toggleFavorite}
                        onTogglePublish={togglePublish}
                      />
                    ))}
                  </div>

                  {/* Loading indicator for infinite scroll */}
                  {displayedCount < filteredAndSortedStories.length && (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-purple-600 mb-3"></div>
                      <p className="text-gray-600 font-medium">Loading more stories...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 text-center border border-purple-100">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No Stories Found</h3>
                  <p className="text-gray-600 text-lg mb-6">Try adjusting your search or filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenres([]);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          /* Favorites Tab - Embed the Favorites component without back button */
          <Favorites onNavigate={onNavigate} hideBackButton={true} />
        )}
      </div>

      {/* Story Detail Modal */}
      {detailStory && (
        <StoryDetailModal 
          story={detailStory}
          onClose={() => setDetailStory(null)}
          onEdit={() => onNavigate?.('home')}
          currentUsername={username}
        />
      )}
    </div>
  );
}
