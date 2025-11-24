import { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';

interface Character {
  id?: string;
  name: string;
  description: string;
  role: string;
  actorName?: string;
  imageUrls?: string[];
  popularity?: number; // 1-10 scale for sorting
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
  imageUrls?: string[];
  authorUsername: string;
  characters: Character[];
  createdAt: string;
  genres?: Genre[];
  storyNumber?: string;
  totalWatchTime?: number;
  writers?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
}

interface StoryCardTooltipProps {
  story: Story;
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onReadStory?: () => void;
}

const StoryCardTooltip = ({ story, visible, position, onClose, onReadStory }: StoryCardTooltipProps) => {
  const [currentStoryImageIndex, setCurrentStoryImageIndex] = useState(0);
  const [currentCharImageIndex, setCurrentCharImageIndex] = useState(0);

  // Reset indices when story changes
  useEffect(() => {
    setCurrentStoryImageIndex(0);
    setCurrentCharImageIndex(0);
  }, [story.id]);

  // Auto-toggle story images every 3 seconds
  useEffect(() => {
    if (!story.imageUrls || story.imageUrls.length <= 1) return;
    const maxImages = Math.min(story.imageUrls.length, 5);

    const interval = setInterval(() => {
      setCurrentStoryImageIndex((prev) => (prev + 1) % maxImages);
    }, 3000);

    return () => clearInterval(interval);
  }, [story.imageUrls]);

  // Auto-toggle character images every 3 seconds
  const charactersWithPhotos = (story.characters?.filter(c => c.imageUrls && c.imageUrls.length > 0) || [])
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 5);
  
  useEffect(() => {
    if (charactersWithPhotos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentCharImageIndex((prev) => (prev + 1) % charactersWithPhotos.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [charactersWithPhotos.length]);

  if (!visible) return null;

  const nextStoryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const maxImages = Math.min(story.imageUrls?.length || 1, 5);
    setCurrentStoryImageIndex((prev) => (prev + 1) % maxImages);
  };

  const prevStoryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const maxImages = Math.min(story.imageUrls?.length || 1, 5);
    setCurrentStoryImageIndex((prev) => (prev - 1 + maxImages) % maxImages);
  };

  // Format watch time (seconds to hours:minutes)
  const formatWatchTime = (seconds?: number) => {
    if (!seconds || seconds === 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate tooltip position to stay within viewport
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 550),
    top: Math.min(position.y, window.innerHeight - 600),
    zIndex: 10000,
    maxWidth: '520px',
    width: '100%',
    pointerEvents: 'auto', // Allow interaction with tooltip
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-white rounded-xl shadow-2xl border-2 border-purple-200 overflow-hidden animate-fade-in"
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      {/* Header with Story Number and Title */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 text-white rounded-full p-1.5 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center justify-between mb-2 pr-8">
          <div className="flex items-center space-x-2">
            {story.storyNumber && (
              <span className="text-white/90 text-xs font-mono bg-white/20 px-2 py-0.5 rounded">
                #{story.storyNumber}
              </span>
            )}
            <span className="text-white/80 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(story.createdAt)}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-white/90 text-xs">
            <Clock className="w-3 h-3" />
            <span>{formatWatchTime(story.totalWatchTime)}</span>
          </div>
        </div>
        <h3 className="text-white font-bold text-base line-clamp-2">{story.title}</h3>
        
        {/* Read Story Button - Visible on hover */}
        {onReadStory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              onReadStory();
            }}
            className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            <span>📖 Read Story</span>
          </button>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="p-4 space-y-3 max-h-[450px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9333ea #f3f4f6' }}>
        {/* Images Carousel - Full Width */}
        {story.imageUrls && story.imageUrls.length > 0 && story.imageUrls.slice(0, 5).length > 0 && (
          <div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative h-48">
                <img
                  src={story.imageUrls.slice(0, 5)[currentStoryImageIndex].startsWith('http') 
                    ? story.imageUrls.slice(0, 5)[currentStoryImageIndex] 
                    : `http://localhost:8080${story.imageUrls.slice(0, 5)[currentStoryImageIndex]}`}
                  alt={`Story image ${currentStoryImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23667eea" width="400" height="300"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                
                {/* Navigation Arrows */}
                {story.imageUrls.slice(0, 5).length > 1 && (
                  <>
                    <button
                      onClick={prevStoryImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextStoryImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {currentStoryImageIndex + 1} / {story.imageUrls.slice(0, 5).length}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {story.description && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{story.description}</p>
          </div>
        )}

        {/* Writers */}
        {story.writers && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Writers</p>
            <p className="text-xs text-gray-700">{story.writers}</p>
          </div>
        )}

        {/* Genres */}
        {story.genres && story.genres.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Genres</p>
            <div className="flex flex-wrap gap-1">
              {story.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cast - 2 lines max, sorted by popularity */}
        {story.characters && story.characters.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cast ({story.characters.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {story.characters
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, 8)
                .map((character, index) => (
                  <div key={character.id || index} className="flex flex-col items-center text-xs bg-purple-50 rounded px-2 py-1.5 border border-purple-100">
                    <div className="font-semibold text-purple-900 truncate w-full text-center">{character.name}</div>
                    {character.actorName && (
                      <div className="text-purple-600 text-[10px] truncate w-full text-center">{character.actorName}</div>
                    )}
                  </div>
                ))}
            </div>
            {story.characters.length > 8 && (
              <p className="text-xs text-gray-500 mt-2">+{story.characters.length - 8} more cast members</p>
            )}
          </div>
        )}

        {/* Character Photos Carousel - Top 5 by popularity */}
        {charactersWithPhotos.length > 0 && (
          <div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              {/* Current Character Info */}
              <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs z-10 flex items-center gap-1">
                <div className="font-semibold">{charactersWithPhotos[currentCharImageIndex]?.name}</div>
                {/* Popularity removed */}
              </div>

              {/* Image Display */}
              <div className="relative h-48">
                {charactersWithPhotos[currentCharImageIndex]?.imageUrls?.[0] ? (
                  <img
                    src={charactersWithPhotos[currentCharImageIndex].imageUrls[0].startsWith('http') 
                      ? charactersWithPhotos[currentCharImageIndex].imageUrls[0] 
                      : `http://localhost:8080${charactersWithPhotos[currentCharImageIndex].imageUrls[0]}`}
                    alt={charactersWithPhotos[currentCharImageIndex].name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23667eea" width="400" height="300"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No photo available
                  </div>
                )}
                
                {/* Character Counter */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs">
                  {currentCharImageIndex + 1}/{charactersWithPhotos.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="flex items-center justify-around pt-2 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">Views</p>
            <p className="text-sm font-bold text-gray-800">{story.viewCount || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Likes</p>
            <p className="text-sm font-bold text-gray-800">{story.likeCount || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Comments</p>
            <p className="text-sm font-bold text-gray-800">{story.commentCount || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryCardTooltip;
