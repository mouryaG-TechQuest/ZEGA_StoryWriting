import React, { useState } from 'react';
import { Search, SlidersHorizontal, Filter, X, ChevronDown } from 'lucide-react';

interface Genre {
  id: number;
  name: string;
  description?: string;
}

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  totalResults: number;
  genres: Genre[];
  selectedGenres: number[];
  onGenresChange: (genreIds: number[]) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalResults,
  genres,
  selectedGenres,
  onGenresChange,
}) => {
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<number | null>(null);
  const [sortHoverTimeout, setSortHoverTimeout] = useState<number | null>(null);
  const [sortCloseTimeout, setSortCloseTimeout] = useState<number | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = window.setTimeout(() => {
      setShowGenreDropdown(true);
    }, 300);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    // Delay closing to allow mouse to move into dropdown
    const timeout = window.setTimeout(() => {
      setShowGenreDropdown(false);
    }, 300);
    setCloseTimeout(timeout);
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  };

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
    }, 300);
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

  return (
    <div className="bg-white/70 backdrop-blur-2xl rounded-xl shadow-lg border border-purple-200/30 p-3 sm:p-4 mb-4 space-y-3 relative z-[1000]">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, author, #number..."
          className="block w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-sm placeholder-gray-400 bg-white/80"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters Row - Horizontal Compact Layout */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg">
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="font-semibold">
            {totalResults} {totalResults === 1 ? 'story' : 'stories'}
          </span>
        </div>

        <div className="h-4 w-px bg-purple-200"></div>

        {/* Sort By Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            onMouseEnter={handleSortMouseEnter}
            onMouseLeave={handleSortMouseLeave}
            className="px-3 py-1.5 border border-purple-200 rounded-lg focus:ring-1 focus:ring-purple-400 transition-all text-xs sm:text-sm bg-white/80 cursor-pointer font-medium hover:border-purple-300 flex items-center gap-1.5"
          >
            <span>
              {sortBy === 'newest' && '🆕 Newest'}
              {sortBy === 'oldest' && '📅 Oldest'}
              {sortBy === 'mostLiked' && '❤️ Most Liked'}
              {sortBy === 'mostViewed' && '👁️ Most Viewed'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSortDropdown && (
            <div 
              className="absolute top-full left-0 mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-2xl w-48 overflow-hidden"
              onMouseEnter={handleSortDropdownMouseEnter}
              onMouseLeave={handleSortMouseLeave}
            >
              <button
                onClick={() => { onSortChange('newest'); setShowSortDropdown(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                🆕 Newest
              </button>
              <button
                onClick={() => { onSortChange('oldest'); setShowSortDropdown(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                📅 Oldest
              </button>
              <button
                onClick={() => { onSortChange('mostLiked'); setShowSortDropdown(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                ❤️ Most Liked
              </button>
              <button
                onClick={() => { onSortChange('mostViewed'); setShowSortDropdown(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                👁️ Most Viewed
              </button>
            </div>
          )}
        </div>

        {/* Genre Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowGenreDropdown(!showGenreDropdown)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`px-3 py-1.5 border rounded-lg focus:ring-1 transition-all text-xs sm:text-sm font-medium flex items-center gap-1.5 ${
              selectedGenres.length > 0
                ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                : 'bg-white/80 text-gray-700 border-purple-200 hover:border-purple-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Genre</span>
            {selectedGenres.length > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {selectedGenres.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showGenreDropdown && (
            <div 
              className="absolute top-full left-0 mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-2xl w-full sm:w-80 md:w-96 max-h-80 overflow-y-auto"
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="p-3 border-b border-purple-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-900">Filter by Genre</span>
                {selectedGenres.length > 0 && (
                  <button
                    onClick={() => onGenresChange([])}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {genres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <label
                      key={genre.id}
                      className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
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
                          onGenresChange(newGenres);
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

        {/* Active Search Badge - Inline */}
        {searchQuery && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">Search:</span>
            <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold text-xs border border-purple-200">
              "{searchQuery}"
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
