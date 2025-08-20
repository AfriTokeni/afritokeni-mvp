import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, Zap, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleICPLogin = async () => {
    try {
      const success = await login({} as any, 'web');
      if (success) {
        navigate('/users/dashboard');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AfriTokeni</h1>
            </div>
            <button
              onClick={handleICPLogin}
              disabled={isLoading}
              className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Sign in'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Serving 14.6M unbanked Ugandans
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              Banking for everyone,
              <br />
              <span className="text-gray-600">everywhere in Uganda</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Send money, check balances, and manage finances via SMS or web. 
              Built on Internet Computer for maximum security and lowest costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleICPLogin}
                disabled={isLoading}
                className="bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Start banking'}
              </button>
              <Link
                to="/sms"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Try SMS banking
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Built for Uganda's financial future
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combining Internet Computer security with SMS accessibility to serve every Ugandan
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">83% Lower Costs</h3>
              <p className="text-gray-600">
                Blockchain technology reduces transaction fees to just $0.0000022 compared to traditional mobile money
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Bank-Grade Security</h3>
              <p className="text-gray-600">
                Internet Computer Protocol provides cryptographic security with threshold signatures and MPC key management
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Universal Access</h3>
              <p className="text-gray-600">
                Works on any phone - from feature phones to smartphones. 98% coverage across Uganda
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">AfriTokeni</h3>
            <p className="text-gray-400 mb-8">Banking for everyone, everywhere in Uganda</p>
            <div className="text-sm text-gray-500">
              © 2024 AfriTokeni. Built on Internet Computer Protocol.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
