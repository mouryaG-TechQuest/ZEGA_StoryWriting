import { BookOpen, User, LogOut } from 'lucide-react';

// Use Header.tsx for TypeScript version
const Header = ({ user, onLogout }) => {
  return (
    <nav className="bg-white shadow-md p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Story Hub</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-700">
            <User className="w-5 h-5 mr-2" />
            <span className="font-medium">{user.username}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mr-1" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
