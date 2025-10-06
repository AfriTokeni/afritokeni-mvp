import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface Route {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavigationProps {
  routes: Route[];
  userType: 'user' | 'agent' | 'admin';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ routes, userType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // For users: show dashboard, send, withdraw, agents, DAO (first 5 routes)
  // For agents: show first 5 routes (no logout)
  const displayRoutes = userType === 'user' 
    ? routes.filter(route => 
        ['home', 'send', 'withdraw', 'agents', 'dao'].includes(route.id)
      ).slice(0, 5)
    : routes.slice(0, 5);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:hidden">
      <div className="flex items-center justify-around">
        {displayRoutes.map((route) => {
          const Icon = route.icon;
          const active = isActive(route.path);
          
          return (
            <button
              key={route.id}
              onClick={() => navigate(route.path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                active
                  ? 'text-black'
                  : 'text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="text-xs sm:text-sm md:text-base font-medium truncate max-w-full">
                {route.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;