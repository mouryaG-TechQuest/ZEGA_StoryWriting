import { Edit, Trash2, ThumbsUp, Heart, Eye, EyeOff, MessageCircle, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import StoryCardTooltip from './StoryCardTooltip';

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
  commentCount?: number;
  isLikedByCurrentUser?: boolean;
  isFavoritedByCurrentUser?: boolean;
  genres?: Genre[];
  storyNumber?: string;
  totalWatchTime?: number;
  writers?: string;
}

interface StoryCardProps {
  story: Story;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onView?: () => void;
  onToggleLike?: (storyId: string, isLiked: boolean) => void;
  onToggleFavorite?: (storyId: string, isFavorited: boolean) => void;
  onTogglePublish?: (storyId: string) => void;
  storyNumber?: string; // Unique story number from backend
}

const StoryCard = ({ 
  story, 
  isOwner, 
  onEdit, 
  onDelete, 
  onView,
  onToggleLike,
  onToggleFavorite,
  onTogglePublish,
  storyNumber
}: StoryCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<number | null>(null);
  
  const displayCharacters = story.characters?.slice(0, 3) || [];
  const images = story.imageUrls && story.imageUrls.length > 0 ? story.imageUrls : [];
  const hasMultipleImages = images.length > 1;

  // Listen for event to close this tooltip when another card is hovered
  useEffect(() => {
    const handleCloseEvent = (e: CustomEvent) => {
      if (e.detail?.excludeId !== story.id) {
        // Immediately close this tooltip
        setShowTooltip(false);
        if (tooltipTimerRef.current) {
          clearTimeout(tooltipTimerRef.current);
          tooltipTimerRef.current = null;
        }
      }
    };

    window.addEventListener('closeAllTooltips', handleCloseEvent as EventListener);
    return () => {
      window.removeEventListener('closeAllTooltips', handleCloseEvent as EventListener);
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, [story.id]);
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseEnter = () => {
    // Disable tooltip on small screens (mobile/tablet)
    if (window.innerWidth < 1024) return;

    // Close any other open tooltips immediately
    window.dispatchEvent(new CustomEvent('closeAllTooltips', { detail: { excludeId: story.id } }));
    
    // Clear any existing timer
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    // Show tooltip after 300ms delay
    tooltipTimerRef.current = window.setTimeout(() => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPosition({
          x: rect.right + 15,
          y: rect.top,
        });
        setShowTooltip(true);
      }
    }, 300);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Check if mouse is moving to tooltip
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && typeof relatedTarget.closest === 'function' && relatedTarget.closest('.story-tooltip')) {
      return; // Don't hide if moving to tooltip
    }
    
    // Delay hiding to allow moving to tooltip
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    tooltipTimerRef.current = window.setTimeout(() => {
      setShowTooltip(false);
    }, 300);
  };

  const handleTooltipMouseEnter = () => {
    // Keep tooltip visible when hovering over it
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide tooltip when leaving it
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    tooltipTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 300);
  };

  const handleCloseTooltip = () => {
    setShowTooltip(false);
  };
  
  return (
    <>
      {/* Tooltip Overlay - Fixed Position */}
      {showTooltip && (
        <div 
          className="story-tooltip fixed inset-0 z-[999999] hidden lg:block"
          style={{ pointerEvents: 'none' }}
        >
          <div
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            style={{ pointerEvents: 'auto' }}
          >
            <StoryCardTooltip 
              story={story}
              visible={showTooltip}
              position={tooltipPosition}
              onClose={handleCloseTooltip}
              onReadStory={onView}
            />
          </div>
        </div>
      )}

      <div 
        ref={cardRef}
        className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col h-full relative z-10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
      {/* Gradient Header with Title and Story Number */}
      <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-3">
        {/* Story Number Badge - Hidden, moved to inside title area */}
        
        <h3 className="text-white font-bold text-lg sm:text-xl line-clamp-2 drop-shadow-lg pr-16">
          {storyNumber && (
            <span className="inline-flex items-center bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded text-white/60 mr-2 text-[10px] font-normal">
              #{storyNumber}
            </span>
          )}
          {story.title}
        </h3>
        
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {isOwner && onTogglePublish && (
            <button
              onClick={() => onTogglePublish(story.id)}
              className={`${
                story.isPublished 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-400 hover:bg-gray-500'
              } p-1 rounded-md transition text-white backdrop-blur-sm`}
              title={story.isPublished ? 'Published' : 'Draft'}
            >
              {story.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          )}
          {isOwner && (
            <>
              <button
                onClick={onEdit}
                className="bg-white/90 hover:bg-white p-1 rounded-md transition text-blue-600 backdrop-blur-sm"
                aria-label="Edit"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="bg-white/90 hover:bg-white p-1 rounded-md transition text-red-600 backdrop-blur-sm"
                aria-label="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image Section with Toggle */}
      <div className="relative h-32 sm:h-40 overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex].startsWith('http') ? images[currentImageIndex] : `http://localhost:8080${images[currentImageIndex]}`}
              alt={story.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23667eea" width="400" height="300"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18"%3EImage Error%3C/text%3E%3C/svg%3E';
              }}
            />
            
            {/* Image Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <p className="text-white text-sm font-semibold">No Image</p>
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(story.id, story.isFavoritedByCurrentUser || false);
            }}
            className="absolute bottom-2 left-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <Heart
              className={`w-4 h-4 ${story.isFavoritedByCurrentUser ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}
      </div>

      {/* Card Content - Compact */}
      <div className="flex-1 p-3 space-y-2">
        {/* Author Section */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">by</p>
            <p className="font-semibold text-sm text-gray-800 truncate">{story.authorUsername}</p>
          </div>
          {!story.isPublished && isOwner && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              Draft
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-snug">
          {story.description || 'No description available.'}
        </p>

        {/* Cast & Genres - Single Row */}
        <div className="flex flex-wrap gap-1">
          {displayCharacters.filter(c => c.actorName).slice(0, 2).map((character, index) => (
            <span
              key={character.id || index}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200"
            >
              <User className="w-2.5 h-2.5 mr-0.5" />
              <span className="truncate max-w-[80px]">{character.actorName}</span>
            </span>
          ))}
          {story.genres && story.genres.slice(0, 2).map((genre) => (
            <span
              key={genre.id}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200"
            >
              {genre.name}
            </span>
          ))}
        </div>

      </div>

      {/* Stats Bar - No Background */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-around py-1.5">
          {/* Likes */}
          {onToggleLike ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(story.id, story.isLikedByCurrentUser || false);
              }}
              className="flex items-center space-x-1 text-gray-600 hover:text-pink-600 transition-colors"
            >
              <ThumbsUp className={`w-4 h-4 ${story.isLikedByCurrentUser ? 'fill-pink-600 text-pink-600' : ''}`} />
              <span className="font-bold text-xs">{story.likeCount || 0}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-gray-600">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-bold text-xs">{story.likeCount || 0}</span>
            </div>
          )}

          {/* Views */}
          <div className="flex items-center space-x-1 text-gray-600">
            <Eye className="w-4 h-4" />
            <span className="font-bold text-xs">{story.viewCount || 0}</span>
          </div>

          {/* Comments */}
          <div className="flex items-center space-x-1 text-gray-600">
            <MessageCircle className="w-4 h-4" />
            <span className="font-bold text-xs">{story.commentCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Read Button - Compact */}
      {onView && (
        <div className="px-3 pb-3">
          <button
            onClick={onView}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-xl transition-all text-xs sm:text-sm"
          >
            Read Story
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default StoryCard;
