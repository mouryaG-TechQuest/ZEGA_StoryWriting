import { useState, useEffect } from 'react';
import { User, Bell, Lock, Eye, ArrowLeft, Save, Shield, Mail, Smartphone, Globe, Brain } from 'lucide-react';
import AutoTrainModel from '../../components/AutoTrainModel';
import TrainingHistoryComponent from '../../components/TrainingHistory';

interface SettingsPageProps {
  onNavigate?: (page: 'home') => void;
}

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('account');
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    publicProfile: true,
    showEmail: false,
    twoFactorAuth: false,
    loginAlerts: true,
    language: 'English',
    timezone: 'UTC-5'
  });

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    phoneNumber: ''
  });

  const [userId, setUserId] = useState<string>('1');

  useEffect(() => {
    // Load user data from local storage or API
    const storedUsername = localStorage.getItem('username') || '';
    const storedUserId = localStorage.getItem('userId') || '1';
    setUserId(storedUserId);
    // In a real app, fetch this from API
    setProfileData(prev => ({ ...prev, username: storedUsername }));
    
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    // Here you would also save profileData to API
    alert('Settings saved successfully!');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profileData.username}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us a little about yourself..."
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Security & Login</h2>
            
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Lock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Change Password</p>
                      <p className="text-sm text-gray-500">It's a good idea to use a strong password that you're not using elsewhere</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                    Edit
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">We'll ask for a login code if we notice an attempted login from an unrecognized device or browser.</p>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                      className="absolute w-6 h-6 bg-white border-2 rounded-full appearance-none cursor-pointer peer checked:border-purple-600"
                    />
                    <div className={`w-11 h-6 rounded-full peer-checked:bg-purple-600 ${settings.twoFactorAuth ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.twoFactorAuth ? 'translate-x-5' : ''}`}></div>
                  </div>
                </div>
              </div>

              <div className="p-4 hover:bg-gray-50 transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Smartphone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Get alerts about unrecognized logins</p>
                      <p className="text-sm text-gray-500">We'll let you know if anyone logs in from a device or browser you don't usually use.</p>
                    </div>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.loginAlerts}
                      onChange={(e) => setSettings({...settings, loginAlerts: e.target.checked})}
                      className="absolute w-6 h-6 bg-white border-2 rounded-full appearance-none cursor-pointer peer checked:border-purple-600"
                    />
                    <div className={`w-11 h-6 rounded-full peer-checked:bg-purple-600 ${settings.loginAlerts ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.loginAlerts ? 'translate-x-5' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Privacy Settings</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <span className="block font-medium text-gray-800">Public Profile</span>
                    <span className="text-sm text-gray-500">Allow anyone to see your profile and stories</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.publicProfile}
                  onChange={(e) => setSettings({...settings, publicProfile: e.target.checked})}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="block font-medium text-gray-800">Show Email</span>
                    <span className="text-sm text-gray-500">Display your email address on your public profile</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showEmail}
                  onChange={(e) => setSettings({...settings, showEmail: e.target.checked})}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Preferences</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Mail className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <span className="block font-medium text-gray-800">Email Notifications</span>
                    <span className="text-sm text-gray-500">Receive updates and newsletters via email</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Bell className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <span className="block font-medium text-gray-800">Push Notifications</span>
                    <span className="text-sm text-gray-500">Receive real-time updates in your browser</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>
            </div>
          </div>
        );

      case 'aitraining':
        return (
          <div className="space-y-6 pt-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Generate Stories with AI</h2>
              <p className="text-gray-600">
                Train your personal AI model with custom stories. Generate training data automatically 
                without creating stories in your database.
              </p>
            </div>
            <AutoTrainModel userId={userId} />
          </div>
        );

      case 'traininghistory':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Training History</h2>
            <p className="text-gray-600 mb-6">
              View your complete training session history, including quality metrics, model performance, 
              and generated examples.
            </p>
            <TrainingHistoryComponent userId={userId} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('home')}
              className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              <nav className="flex flex-col p-2">
                <button
                  onClick={() => setActiveSection('account')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                    activeSection === 'account'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Account
                </button>
                <button
                  onClick={() => setActiveSection('security')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                    activeSection === 'security'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Security
                </button>
                <button
                  onClick={() => setActiveSection('privacy')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                    activeSection === 'privacy'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                  Privacy
                </button>
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                    activeSection === 'notifications'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveSection('aitraining')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                    activeSection === 'aitraining'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  AI Training
                </button>
                <button
                  onClick={() => setActiveSection('traininghistory')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                    activeSection === 'traininghistory'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Training History
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
