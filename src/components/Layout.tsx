import React, { useState } from 'react';
import { 
  Bell,
  X,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { UserData } from '../types/user_dashboard';
import { Route } from '../routes/userRoutes';
import { useLocation, useNavigate } from 'react-router-dom';
import { Notification } from '../types/notification';
import AfriTokeniLogo from './AfriTokeniLogo';
import { useAuth } from '../contexts/AuthContext';


interface LayoutProps {
  children: React.ReactNode;
  desktop_routes:Route[];
  mobile_routes:Route[];
}


const Layout: React.FC<LayoutProps> = ({children, desktop_routes, mobile_routes}) => {
  
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
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

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Transaction Completed',
      message: 'Your withdrawal of 50,000 UGX has been completed successfully. Agent: Kampala Central Agent.',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      actionUrl: '/transactions'
    },
    {
      id: '2', 
      title: 'Security Alert',
      message: 'New login detected from a different device. If this wasn\'t you, please contact support immediately.',
      type: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false
    },
    {
      id: '3',
      title: 'Account Verification',
      message: 'Your account has been successfully verified. You can now access all features.',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // const handleNotificationClick = (notification: Notification) => {
  //   setSelectedNotification(notification);
  //   // Mark as read
  //   setNotifications(prev => 
  //     prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
  //   );
  // };

  const closeNotificationDetail = () => {
    setSelectedNotification(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

const isActive = (path:string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Brand Header */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center ">
          <AfriTokeniLogo size="md" />
        </div>
      </div>

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
            <div className="relative">
              <button 
                className="relative p-2 text-gray-600 hover:text-gray-800"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600">{unreadCount} unread</p>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          // onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type)}
                  <h3 className="text-lg font-semibold text-gray-800">{selectedNotification.title}</h3>
                </div>
                <button
                  onClick={closeNotificationDetail}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {formatTimestamp(selectedNotification.timestamp)}
                </p>
                <p className="text-gray-800 leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.actionUrl && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigate(selectedNotification.actionUrl!);
                      closeNotificationDetail();
                      setShowNotifications(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

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
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col">
        {/* Brand Section */}
        <div className="p-6 border-b border-gray-200">
          <AfriTokeniLogo size="lg" />
        </div>
        
        {/* Navigation Links */}
        <div className="p-6 flex-1">
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
        
        {/* Logout Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Layout;