import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import './App.css';
import Header from './components/layout/Header.tsx';
import LoadingSpinner from './components/common/Loader.tsx';

// Lazy load all page components for code splitting
const AuthPage = lazy(() => import('./pages/Auth/Auth.tsx'));
const StoryForm = lazy(() => import('./components/StoryForm.tsx'));
const StoryCard = lazy(() => import('./components/StoryCard.tsx'));
const StoryDetailModal = lazy(() => import('./components/StoryDetailModal.tsx'));
const StoryViewToggle = lazy(() => import('./components/StoryViewToggle.tsx'));
const EmptyState = lazy(() => import('./components/EmptyState.tsx'));
const SearchBar = lazy(() => import('./components/SearchBar.tsx'));
const Favorites = lazy(() => import('./pages/Favorites/Favorites.tsx'));
const Profile = lazy(() => import('./pages/Profile/Profile.tsx'));
const Settings = lazy(() => import('./pages/Settings/Settings.tsx'));
const ContactSupport = lazy(() => import('./pages/Support/ContactSupport.tsx'));
const Subscription = lazy(() => import('./pages/Subscription/Subscription.tsx'));
const Cart = lazy(() => import('./pages/Cart/Cart.tsx'));
import AIStoryGenerator from './components/AIStoryGeneratorNew';

const API_BASE = '/api';

interface User {
  username: string;
  token: string;
}

interface Character {
  id?: string;
  name: string;
  description: string;
  role: string;
  actorName?: string;
  popularity?: number;
}

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
  timelineJson?: string;
  imageUrls?: string[];
  authorUsername: string;
  characters: Character[];
  createdAt: string;
  isPublished?: boolean;
  likeCount?: number;
  viewCount?: number;
  isLikedByCurrentUser?: boolean;
  isFavoritedByCurrentUser?: boolean;
  commentCount?: number;
  writers?: string;
  genres?: Genre[];
  storyNumber?: string;
  totalWatchTime?: number;
  showSceneTimeline?: boolean;
}

interface FormData {
  title: string;
  content: string;
  description: string;
  timelineJson: string;
  imageUrls: string[];
  characters: Character[];
  isPublished?: boolean;
  writers?: string;
  genreIds?: number[];
  showSceneTimeline?: boolean;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [view, setView] = useState<'all' | 'my'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailStory, setDetailStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'favorites' | 'profile' | 'settings' | 'support' | 'subscription' | 'cart'>('home');
  const [genres, setGenres] = useState<Genre[]>([]);
  
  // Search, filter, and infinite scroll state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostLiked' | 'mostViewed'>('newest');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [displayedCount, setDisplayedCount] = useState(12); // For infinite scroll

  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    description: '',
    timelineJson: '',
    imageUrls: [],
    characters: [{ name: '', description: '', role: '', actorName: '' }],
    isPublished: false,
    writers: '',
    genreIds: [],
    showSceneTimeline: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    // Fetch genres regardless of login status (public data)
    fetchGenres();
    
    if (token && username) {
      setUser({ username, token });
      fetchStories(token);
    }
  }, []);

  const fetchGenres = useCallback(async () => {
    try {
      // Genre endpoint is public, no auth needed
      const response = await fetch(`${API_BASE}/stories/genres`);
      if (response.ok) {
        const data = await response.json();
        setGenres(data);
      } else {
        console.error('Failed to fetch genres:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to fetch genres:', err);
    }
  }, []);

  const fetchStories = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        fetch(`${API_BASE}/stories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/stories/my-stories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!allRes.ok || !myRes.ok) {
        throw new Error('Failed to fetch stories');
      }

      const allStories = await allRes.json();
      const userStories = await myRes.json();

      setStories(allStories);
      setMyStories(userStories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stories');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmitStory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    
    // Validate title on frontend
    if (!formData.title.trim()) {
      setError('Story title is required');
      return;
    }
    
    console.log('Submitting story with showSceneTimeline:', formData.showSceneTimeline);
    console.log('Submitting story with isPublished:', formData.isPublished);
    console.log('FormData being sent:', {
      ...formData,
      charactersCount: formData.characters?.length,
      timelineLength: formData.timelineJson ? JSON.parse(formData.timelineJson).length : 0,
      isPublished: formData.isPublished,
      showSceneTimeline: formData.showSceneTimeline
    });
    
    setLoading(true);

    try {
      const method = editingStory ? 'PUT' : 'POST';
      const endpoint = editingStory
        ? `${API_BASE}/stories/${editingStory.id}`
        : `${API_BASE}/stories`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          // Check for duplicate title error
          if (errorData.message && errorData.message.includes('already exists')) {
            throw new Error('A story with this title already exists. Please choose a different title.');
          }
          throw new Error(errorData.message || 'Failed to save story');
        } catch (parseError) {
          throw new Error(`Server error: ${errorText.substring(0, 200)}`);
        }
      }

      await fetchStories(user?.token || '');
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      await fetchStories(user?.token || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete story');
    } finally {
      setLoading(false);
    }
  }, [user?.token, fetchStories]);

  const handleEditStory = useCallback((story: Story) => {
    // Close detail modal if open
    setDetailStory(null);
    
    setEditingStory(story);
    console.log('Loading story for editing:', {
      id: story.id,
      title: story.title,
      isPublished: story.isPublished,
      showSceneTimeline: story.showSceneTimeline
    });
    setFormData({
      title: story.title,
      content: story.content,
      description: story.description || '',
      timelineJson: story.timelineJson || '',
      imageUrls: story.imageUrls || [],
      characters: story.characters.length > 0
        ? story.characters
        : [{ name: '', description: '', role: '', actorName: '' }],
      isPublished: story.isPublished ?? false,
      writers: story.writers || '',
      genreIds: story.genres?.map(g => g.id) || [],
      showSceneTimeline: story.showSceneTimeline ?? true
    });
    setShowForm(true);
    
    // TODO: If sceneIndex is provided, scroll to or highlight that scene in the form
    // This can be implemented by passing sceneIndex to StoryForm and having it focus the timeline entry
  }, []);

  const refreshCurrentStory = async () => {
    if (!editingStory || !user?.token) return;
    
    try {
      // Just refresh the story lists, don't overwrite the form being edited
      await fetchStories(user.token);
      
      // Optionally fetch the updated story to update editingStory reference
      const response = await fetch(`${API_BASE}/stories/${editingStory.id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      if (response.ok) {
        const updatedStory = await response.json();
        setEditingStory(updatedStory);
        // Don't update formData here - let the component manage its own state
      }
    } catch (err) {
      console.error('Failed to refresh story', err);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      content: '',
      description: '',
      timelineJson: '',
      imageUrls: [],
      characters: [{ name: '', description: '', role: '', actorName: '' }],
      isPublished: false,
      writers: '',
      genreIds: [],
      showSceneTimeline: true
    });
    setEditingStory(null);
    setShowForm(false);
    setShowAIGenerator(false);
  }, []);

  const handleAIStoryGenerated = useCallback((generatedStory: {
    title: string;
    description: string;
    scenes: Array<{
      id: string;
      event: string;
      description: string;
      characters: string[];
      imageUrls: string[];
      videoUrls?: string[];
      audioUrls?: string[];
      order: number;
    }>;
    characters: Character[];
    writers?: string;
  }) => {
    setFormData({
      title: generatedStory.title,
      content: generatedStory.description,
      description: generatedStory.description,
      timelineJson: JSON.stringify(generatedStory.scenes),
      imageUrls: [],
      characters: generatedStory.characters,
      isPublished: false,
      writers: generatedStory.writers || 'AI Generated',
      genreIds: [],
      showSceneTimeline: true
    });
    setShowAIGenerator(false);
    setShowForm(true);
    setEditingStory(null);
  }, []);



  const toggleLike = useCallback(async (storyId: string, isLiked: boolean) => {
    if (!user) return;
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE}/stories/${storyId}/like`, {
        method,
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Failed to toggle like');
      
      const updated = await response.json();
      
      // Update story in both lists
      setStories(prev => prev.map(s => s.id === storyId ? updated : s));
      setMyStories(prev => prev.map(s => s.id === storyId ? updated : s));
      if (detailStory && detailStory.id === storyId) {
        setDetailStory(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle like');
    }
  }, [user, detailStory]);

  const toggleFavorite = useCallback(async (storyId: string, isFavorited: boolean) => {
    if (!user) return;
    
    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`${API_BASE}/stories/${storyId}/favorite`, {
        method,
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');
      
      const updated = await response.json();
      
      // Update story in both lists
      setStories(prev => prev.map(s => s.id === storyId ? updated : s));
      setMyStories(prev => prev.map(s => s.id === storyId ? updated : s));
      if (detailStory && detailStory.id === storyId) {
        setDetailStory(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  }, [user, detailStory]);

  const togglePublish = useCallback(async (storyId: string) => {
    if (!user) return;
    
    // Optimistic update - update UI immediately
    const updateStoriesOptimistically = (storiesList: Story[]) => {
      return storiesList.map(story => 
        story.id === storyId 
          ? { ...story, isPublished: !story.isPublished }
          : story
      );
    };
    
    setStories(prev => updateStoriesOptimistically(prev));
    setMyStories(prev => updateStoriesOptimistically(prev));
    
    try {
      console.log('Toggling publish status for story:', storyId);
      const response = await fetch(`${API_BASE}/stories/${storyId}/toggle-publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Toggle publish failed:', errorText);
        // Rollback optimistic update
        await fetchStories(user.token);
        throw new Error('Failed to toggle publish status');
      }
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const updatedStory = await response.json();
        console.log('Story publish status toggled:', updatedStory);
      } else {
        console.log('Toggle successful (no JSON response)');
      }
      
      // No need to refetch - optimistic update already applied!
      // Only refetch on error for rollback
    } catch (err) {
      console.error('Toggle publish error:', err);
      // Rollback optimistic update by refetching from server
      await fetchStories(user.token);
      setError(err instanceof Error ? err.message : 'Failed to toggle publish status');
    }
  }, [user, fetchStories]);

  const handleAuth = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('username', userData.username);
    fetchStories(userData.token);
  }, [fetchStories]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
    setStories([]);
    setMyStories([]);
    setCurrentPage('home');
  }, []);

  const handleNavigate = useCallback((page: any) => {
    if (page === 'logout') {
      logout();
    } else {
      setCurrentPage(page);
      setShowForm(false); // Hide form when navigating
    }
  }, [logout]);

  // Prepare data for filtering/sorting (must be before early return to satisfy Rules of Hooks)
  const displayStories = view === 'all' ? stories : myStories;

  // Filter and sort stories based on search and sort criteria
  const filteredAndSortedStories = useMemo(() => {
    let filtered = displayStories;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Check if searching by story number (e.g., "#10000" or "10000")
      const numberMatch = query.match(/^#?(\d+)$/);
      if (numberMatch) {
        const searchNumber = numberMatch[1];
        // Filter stories by storyNumber
        filtered = filtered.filter(story => story.storyNumber === searchNumber);
      } else {
        // Regular text search
        filtered = filtered.filter(story => {
          // Search in title
          if (story.title.toLowerCase().includes(query)) return true;
          
          // Search in author username
          if (story.authorUsername.toLowerCase().includes(query)) return true;
          
          // Search in description
          if (story.description?.toLowerCase().includes(query)) return true;
          
          // Search in character names and actor names
          if (story.characters?.some(char => 
            char.name.toLowerCase().includes(query) || 
            char.actorName?.toLowerCase().includes(query)
          )) return true;

          // Search in genres
          if (story.genres?.some(genre =>
            genre.name.toLowerCase().includes(query)
          )) return true;
          
          // Search in story number
          if (story.storyNumber?.includes(query)) return true;
          
          return false;
        });
      }
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
        case 'mostLiked':
          return (b.likeCount || 0) - (a.likeCount || 0);
        case 'mostViewed':
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [displayStories, searchQuery, sortBy, selectedGenres]);

  // Infinite scroll - display limited items
  const displayedStories = filteredAndSortedStories.slice(0, displayedCount);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(12);
  }, [searchQuery, sortBy, view, selectedGenres]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        // Load more when near bottom
        if (displayedCount < filteredAndSortedStories.length) {
          setDisplayedCount(prev => Math.min(prev + 12, filteredAndSortedStories.length));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedCount, filteredAndSortedStories.length]);

  // Early return AFTER all hooks
  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner isLoading={true} />}>
        <AuthPage onAuth={handleAuth} />
      </Suspense>
    );
  }

  // Render page content based on currentPage
  const renderPage = () => {
    switch (currentPage) {
      case 'favorites':
        return (
          <Suspense fallback={<LoadingSpinner isLoading={true} />}>
            <Favorites onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingSpinner isLoading={true} />}>
            <Profile onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingSpinner isLoading={true} />}>
            <Settings onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'support':
        return (
          <Suspense fallback={<LoadingSpinner isLoading={true} />}>
            <ContactSupport onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'subscription':
        return (
          <Suspense fallback={<LoadingSpinner isLoading={true} />}>
            <Subscription onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'cart':
        return (
          <Suspense fallback={<LoadingSpinner isLoading={true} />}>
            <Cart onNavigate={handleNavigate} />
          </Suspense>
        );
      case 'home':
      default:
        return (
          <>
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-start shadow-lg animate-fade-in">
                <div className="p-2 bg-red-100 rounded-lg mr-3 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Error</h4>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <Suspense fallback={<LoadingSpinner isLoading={true} />}>
              <StoryViewToggle
                view={view}
                onViewChange={(newView) => {
                  setView(newView);
                  setShowForm(false);
                  setShowAIGenerator(false);
                }}
                allStoriesCount={stories.length}
                myStoriesCount={myStories.length}
                onNewStory={() => setShowForm(!showForm)}
                showForm={showForm}
                onAIGenerate={() => {
                  setShowAIGenerator(true);
                  setShowForm(false);
                }}
              />
            </Suspense>

            {showForm ? (
              <Suspense fallback={<LoadingSpinner isLoading={true} />}>
                <StoryForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmitStory}
                onCancel={resetForm}
                loading={loading}
                isEditing={!!editingStory}
                storyId={editingStory?.id}
                onCharacterCountChange={refreshCurrentStory}
                genres={genres}
              />
              </Suspense>
            ) : (
              <>
                {/* Search and Filter Bar */}
                {displayStories.length > 0 && (
                  <Suspense fallback={<div className="h-20 animate-pulse bg-gray-200 rounded-lg" />}>
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
                  </Suspense>
                )}

                {loading ? (
                  <LoadingSpinner isLoading={true} />
                ) : filteredAndSortedStories.length > 0 ? (
                  <>
                    <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      <Suspense fallback={
                        <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-96 animate-pulse bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl" />
                          ))}
                        </div>
                      }>
                        {displayedStories.map((story) => {
                          return (
                            <StoryCard
                            key={story.id}
                            story={story}
                            storyNumber={story.storyNumber}
                            isOwner={story.authorUsername === user!.username}
                            onEdit={() => handleEditStory(story)}
                            onDelete={() => handleDeleteStory(story.id)}
                            onView={() => setDetailStory(story)}
                            onToggleLike={toggleLike}
                            onToggleFavorite={toggleFavorite}
                            onTogglePublish={story.authorUsername === user!.username ? togglePublish : undefined}
                          />
                        );
                      })}
                      </Suspense>
                    </div>

                    {/* Loading indicator for infinite scroll */}
                    {displayedCount < filteredAndSortedStories.length && (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="text-gray-600 mt-2">Loading more stories...</p>
                      </div>
                    )}
                  </>
                ) : displayStories.length > 0 ? (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-12 text-center border border-purple-100 animate-fade-in">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">No Stories Found</h3>
                    <p className="text-gray-600 text-base sm:text-lg mb-2">We couldn't find any stories matching your search.</p>
                    <p className="text-gray-500 text-sm sm:text-base mb-6">Try adjusting your search terms or filters to find what you're looking for.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <Suspense fallback={<LoadingSpinner isLoading={true} />}>
                    <EmptyState view={view} />
                  </Suspense>
                )}
              </>
            )}

            {detailStory && (
              <Suspense fallback={<LoadingSpinner isLoading={true} />}>
                <StoryDetailModal 
                story={detailStory} 
                onClose={() => setDetailStory(null)}
                onEdit={handleEditStory}
                currentUsername={user?.username}
              />
              </Suspense>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative">
      {/* Subtle Pattern Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      <Header user={user} onLogout={logout} onNavigate={handleNavigate} />

      <div className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1920px] mx-auto">
          {renderPage()}
        </div>
      </div>
      
      {showAIGenerator && (
        <AIStoryGenerator
          onStoryGenerated={handleAIStoryGenerated}
          onCancel={() => setShowAIGenerator(false)}
          genres={genres}
          existingStoryTitle={editingStory?.title}
          existingStoryId={editingStory?.id}
        />
      )}
    </div>
  );
};

export default App;
