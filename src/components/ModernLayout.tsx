import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import PublicFooter from './PublicFooter';
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
  const { user, logout } = useAuthentication();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to history page with search query
      navigate(`/${userType}s/history?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAvatarClick = () => {
    // On mobile/tablet, show dropdown. On desktop, navigate directly to profile
    if (window.innerWidth < 1024) { // lg breakpoint
      setShowDropdown(!showDropdown);
    } else {
      navigate(`/${userType}s/${userType === 'agent' ? 'settings' : 'profile'}`);
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate(`/${userType}s/${userType === 'agent' ? 'settings' : 'profile'}`);
  };

  const handleLogoutClick = async () => {
    setShowDropdown(false);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
      <div className="md:ml-16 transition-all duration-300 pb-20 md:pb-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-black">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Bar - Hide on very small screens */}
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-48 md:w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </form>
            
            {/* User Avatar - Clickable with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleAvatarClick}
                className="w-8 h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs md:text-sm font-semibold">
                    {userName.charAt(0).toUpperCase() || (userType === 'user' ? 'U' : userType === 'agent' ? 'A' : 'AD')}
                  </span>
                )}
              </button>

              {/* Dropdown Menu - Only show on mobile/tablet */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 lg:hidden animate-in fade-in duration-200">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>{userType === 'agent' ? 'Settings' : 'Profile'}</span>
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogoutClick}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8">
          {children}
        </main>

        {/* Footer - Hidden on tablet and below */}
        <div className="hidden md:block">
          <PublicFooter />
        </div>
      </div>
    </div>
  );
};

export default ModernLayout;
