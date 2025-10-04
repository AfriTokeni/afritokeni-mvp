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
      className={`fixed left-0 top-0 h-screen bg-black text-white transition-all duration-300 ease-in-out z-50 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">AT</span>
          </div>
          {isExpanded && (
            <span className="font-bold text-lg whitespace-nowrap">AfriTokeni</span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6">
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
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {route.label}
                    </span>
                  )}
                  {!isExpanded && active && (
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
