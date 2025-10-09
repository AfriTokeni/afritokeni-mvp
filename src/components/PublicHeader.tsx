import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthentication } from '../context/AuthenticationContext';
import { LoginFormData } from '../types/auth';

const PublicHeader: React.FC = () => {
  const { login } = useAuthentication();
  const location = useLocation();

  const handleICPLogin = async () => {
    try {
      await login({} as LoginFormData, 'web');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <img src="/afriTokeni.svg" alt="AfriTokeni" className="h-5 w-auto" />
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/bitcoin-exchange" 
              className={`font-medium transition-colors ${
                isActive('/bitcoin-exchange') 
                  ? 'text-black font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              How It Works
            </Link>
            <Link 
              to="/tariff" 
              className={`font-medium transition-colors ${
                isActive('/tariff') 
                  ? 'text-black font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pricing
            </Link>
            <Link 
              to="/ussd" 
              className={`font-medium transition-colors ${
                isActive('/ussd') 
                  ? 'text-black font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Try USSD
            </Link>
            <Link 
              to="/about" 
              className={`font-medium transition-colors ${
                isActive('/about') 
                  ? 'text-black font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </Link>
          </nav>

          <button
            onClick={handleICPLogin}
            className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
