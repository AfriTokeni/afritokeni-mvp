import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import CollapsibleSidebar from './CollapsibleSidebar';
import BottomNavigation from './BottomNavigation';
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
  desktopRoutes: Route[];
  mobileRoutes: Route[];
  userType: 'user' | 'agent' | 'admin';
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children, desktopRoutes, mobileRoutes, userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthentication();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);

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

  const handleMobileAvatarClick = () => {
    setShowMobileProfileMenu(!showMobileProfileMenu);
  };

  const handleMobileProfileClick = () => {
    navigate(`/${userType}s/profile`);
    setShowMobileProfileMenu(false);
  };

  const handleMobileLogout = async () => {
    await logout(userType);
    setShowMobileProfileMenu(false);
    navigate('/');
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMobileProfileMenu(false);
    };

    if (showMobileProfileMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMobileProfileMenu]);

  // Get page title from current route
  const getPageTitle = () => {
    const currentRoute = desktopRoutes.find((r: Route) => location.pathname.includes(r.path));
    return currentRoute?.label || 'Dashboard';
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen bg-white">
        {/* Desktop Sidebar */}
        <div className="flex-shrink-0">
          <CollapsibleSidebar routes={desktopRoutes} userType={userType} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Desktop Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black">{getPageTitle()}</h1>
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
                  className="w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </form>
              
              {/* User Avatar */}
              <button
                onClick={handleAvatarClick}
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs sm:text-sm md:text-base font-semibold">
                    {userName.charAt(0).toUpperCase() || (userType === 'user' ? 'U' : userType === 'agent' ? 'A' : 'AD')}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Desktop Content */}
          <main className="flex-1 p-8 overflow-auto min-h-0">
            {children}
          </main>

          {/* Desktop Footer - Full content with scroll */}
          <footer className="flex-shrink-0">
            <PublicFooter />
          </footer>
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="md:hidden flex flex-col h-screen bg-white">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 relative">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">AT</span>
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-black truncate">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-3 relative">
            {/* Mobile Search - Hidden on very small screens */}
            <form onSubmit={handleSearch} className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </form>
            
            {/* Search Icon for very small screens */}
            <button className="sm:hidden p-2 text-gray-400 hover:text-black">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {/* User Avatar with Profile Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMobileAvatarClick();
                }}
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    {userName.charAt(0).toUpperCase() || (userType === 'user' ? 'U' : userType === 'agent' ? 'A' : 'AD')}
                  </span>
                )}
              </button>

              {/* Profile Menu Dropdown */}
              {showMobileProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <button
                    onClick={handleMobileProfileClick}
                    className="w-full px-4 py-2 text-left text-xs sm:text-sm md:text-base text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <User className="w-4 h-4" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={handleMobileLogout}
                    className="w-full px-4 py-2 text-left text-xs sm:text-sm md:text-base text-red-600 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="flex-1 p-4 overflow-auto pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation routes={mobileRoutes} userType={userType} />
      </div>
    </>
  );
};

export default ModernLayout;
