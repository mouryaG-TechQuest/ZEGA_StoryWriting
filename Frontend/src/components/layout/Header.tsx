import { useState } from 'react';
import { BookOpen, User, LogOut, Heart, Settings, HelpCircle, ShoppingCart, Crown, Home } from 'lucide-react';

interface HeaderProps {
  user: {
    username: string;
    token: string;
  };
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const Header = ({ user, onLogout, onNavigate }: HeaderProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<number | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<number | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    const timeout = window.setTimeout(() => {
      setShowDropdown(true);
    }, 150);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    const timeout = window.setTimeout(() => {
      setShowDropdown(false);
    }, 200);
    setCloseTimeout(timeout);
  };

  return (
    <nav className="sticky top-0 z-[1100] bg-white/90 backdrop-blur-lg shadow-lg border-b border-purple-100 py-2 sm:py-3 px-3 sm:px-6">
      <div className="max-w-[1920px] mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => onNavigate('home')}>
          <div className="p-1.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Story Hub</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => onNavigate('home')}
            className="hidden sm:flex items-center justify-center w-8 h-8 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('favorites')}
            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
            title="Favorites"
          >
            <Heart className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('cart')}
            className="flex items-center justify-center w-8 h-8 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
            title="Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md ring-2 ring-purple-200">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-semibold text-gray-700 text-sm">{user.username}</span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 py-2 z-[1200] animate-fade-in-down">
                <button
                  onClick={() => { onNavigate('profile'); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Profile</span>
                </button>
                <button
                  onClick={() => { onNavigate('favorites'); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Favorites</span>
                </button>
                <button
                  onClick={() => { onNavigate('subscription'); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <Crown className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Subscription</span>
                </button>
                <button
                  onClick={() => { onNavigate('settings'); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Settings</span>
                </button>
                <button
                  onClick={() => { onNavigate('support'); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition"
                >
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Support</span>
                </button>
                <div className="h-px bg-gray-200 my-2"></div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-red-600 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
