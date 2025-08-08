import React, { useState } from 'react';
import { 
  Bell
} from 'lucide-react';
import { UserData } from '../types/user_dashboard';
import { Route } from '../routes/userRoutes';
import { useLocation, useNavigate } from 'react-router-dom';


interface LayoutProps {
  children: React.ReactNode;
  desktop_routes:Route[];
  mobile_routes:Route[];
}


const Layout: React.FC<LayoutProps> = ({children, desktop_routes, mobile_routes}) => {
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mock user data
  const [user] = useState<UserData>({
    name: 'John Kamau',
    phone: '+256701234567',
    balances: {
      UGX: 850000,
      USDC: 245.50
    },
    isVerified: true
  });


const isActive = (path:string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 md:text-xl">
              Hello, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-gray-600">Welcome back to your wallet</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="relative p-2 text-gray-600 hover:text-gray-800">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 md:px-6 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {mobile_routes.map((route: Route) => {
            const Icon = route.icon;
            const isActiveRoute = isActive(route.path);
            return (
              <button
                key={route.id}
                onClick={() => navigate(route.path)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActiveRoute
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{route.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 pt-20">
        <div className="p-6">
          <div className="space-y-2">
            {desktop_routes.map((route: Route) => {
              const Icon = route.icon;
              const isActiveRoute = isActive(route.path);
              return (
                <button
                  key={route.id}
                  onClick={() => navigate(route.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActiveRoute 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{route.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Layout Adjustment */}
      <style>{`
        @media (min-width: 768px) {
          main {
            margin-left: 16rem;
          }
          header {
            margin-left: 16rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;