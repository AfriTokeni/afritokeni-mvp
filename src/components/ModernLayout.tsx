import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import type { LucideIcon } from 'lucide-react';

interface Route {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

interface ModernLayoutProps {
  children: React.ReactNode;
  routes: Route[];
  userType: 'user' | 'agent' | 'admin';
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children, routes, userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthentication();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  // Load profile image and user name
  useEffect(() => {
    const currentUser = user.user || user.agent;
    if (currentUser?.id) {
      const savedImage = localStorage.getItem(`profile-image-${currentUser.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
      // Get first letter of name for fallback
      const name = currentUser.firstName || currentUser.email || 'U';
      setUserName(name);
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to history page with search query
      navigate(`/${userType}s/history?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAvatarClick = () => {
    navigate(`/${userType}s/profile`);
  };

  // Get page title from current route
  const getPageTitle = () => {
    const currentRoute = routes.find(r => location.pathname.includes(r.path));
    return currentRoute?.label || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar routes={routes} userType={userType} />
      
      {/* Main Content Area */}
      <div className="ml-16 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-black">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </form>
            
            {/* User Avatar - Clickable */}
            <button
              onClick={handleAvatarClick}
              className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-semibold">
                  {userName.charAt(0).toUpperCase() || (userType === 'user' ? 'U' : userType === 'agent' ? 'A' : 'AD')}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ModernLayout;
