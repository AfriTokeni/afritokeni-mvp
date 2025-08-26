import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Zap, Lock } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import { LoginFormData } from '../types/auth';

const LandingPage: React.FC = () => {
  const { login, isLoading } = useAuthentication();

  const handleICPLogin = async () => {
    try {
      const success = await login({} as LoginFormData, 'web');
      // Don't navigate here - let the AuthContext handle role-based routing
      if (!success) {
        console.error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
               <img src="/afriTokeni.svg" alt="AfriTokeni Logo" className="h-4 sm:h-5 w-auto" />
              {/* <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AfriTokeni</h1> */}
            </div>
            <button
              onClick={handleICPLogin}
              disabled={isLoading}
              className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Sign in'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Serving 400M+ unbanked Africans
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight px-2 sm:px-0">
              Banking for everyone,
              <br />
              <span className="text-gray-600">everywhere in Africa</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0">
              Send money, check balances, and manage finances via SMS or web. 
              Built on Internet Computer for maximum security and lowest costs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button
                onClick={handleICPLogin}
                disabled={isLoading}
                className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : 'Start banking'}
              </button>
              <Link
                to="/sms"
                className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Try SMS banking
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SMS Demo Section */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">
              Try SMS Banking Now
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              See how easy it is to bank with just text messages
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Live SMS Demo
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Try these commands:</h3>
                  <p className="text-sm sm:text-base text-gray-600">Click any command to see how SMS banking works</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    to="/sms"
                    state={{ command: '*AFRI#' }}
                    className="text-left p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors group"
                  >
                    <div className="font-mono text-indigo-600 font-medium text-sm group-hover:text-indigo-700">*AFRI#</div>
                    <div className="text-gray-600 text-xs mt-1">Main Menu</div>
                  </Link>
                  
                  <Link
                    to="/sms"
                    state={{ command: 'BAL' }}
                    className="text-left p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors group"
                  >
                    <div className="font-mono text-indigo-600 font-medium text-sm group-hover:text-indigo-700">BAL</div>
                    <div className="text-gray-600 text-xs mt-1">Check Balance</div>
                  </Link>
                  
                  <Link
                    to="/sms"
                    state={{ command: 'AGENTS' }}
                    className="text-left p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors group"
                  >
                    <div className="font-mono text-indigo-600 font-medium text-sm group-hover:text-indigo-700">AGENTS</div>
                    <div className="text-gray-600 text-xs mt-1">Find Agents</div>
                  </Link>
                  
                  <Link
                    to="/sms"
                    state={{ command: 'SEND 10000 256701234567' }}
                    className="text-left p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors group"
                  >
                    <div className="font-mono text-indigo-600 font-medium text-sm group-hover:text-indigo-700">SEND</div>
                    <div className="text-gray-600 text-xs mt-1">Send Money</div>
                  </Link>
                </div>
                
                <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
                  <Link
                    to="/sms"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-xs sm:text-sm"
                  >
                    Try full SMS interface →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">
              Built for Africa&apos;s financial future
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Combining Internet Computer security with SMS accessibility to serve every African
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl p-6 lg:p-8 border border-gray-200 mx-4 sm:mx-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">83% Lower Costs</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Blockchain technology reduces transaction fees to just $0.0000022 compared to traditional mobile money
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 lg:p-8 border border-gray-200 mx-4 sm:mx-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Bank-Grade Security</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Internet Computer Protocol provides cryptographic security with threshold signatures and MPC key management
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 lg:p-8 border border-gray-200 mx-4 sm:mx-0 md:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Universal Access</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Works on any phone - from feature phones to smartphones. 90%+ coverage across Africa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-black font-bold text-xs sm:text-sm">A</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">AfriTokeni</h3>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 px-4 sm:px-0">Banking for everyone, everywhere in Africa</p>
            <div className="text-xs sm:text-sm text-gray-500">
              © 2025 AfriTokeni. Built on Internet Computer Protocol.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
