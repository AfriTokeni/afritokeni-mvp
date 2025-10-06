import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';

interface Route {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

interface CollapsibleSidebarProps {
  routes: Route[];
  userType: 'user' | 'agent' | 'admin';
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ routes, userType }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthentication();

  const handleLogout = async () => {
    await logout(userType);
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className={`sticky top-0 h-screen bg-black text-white transition-all duration-300 ease-in-out z-50 hidden md:flex flex-col ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xs sm:text-sm md:text-base">AT</span>
          </div>
          {isExpanded && (
            <span className="font-bold text-sm sm:text-base md:text-lg lg:text-xl whitespace-nowrap">AfriTokeni</span>
          )}
        </div>
      </div>

      {/* Navigation Items - Takes up remaining space */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {routes.map((route) => {
            const Icon = route.icon;
            const active = isActive(route.path);
            
            return (
              <li key={route.id}>
                <button
                  onClick={() => navigate(route.path)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">
                      {route.label}
                    </span>
                  )}
                  {!isExpanded && active && (
                    <ChevronRight className="w-2 h-2 sm:w-3 sm:h-3 ml-auto" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button - Always at bottom */}
      <div className="p-2 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
          {isExpanded && (
            <span className="text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
