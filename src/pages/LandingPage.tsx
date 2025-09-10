import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Zap, Lock, Bitcoin, Globe, Mail, CheckCircle } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import { LoginFormData } from '../types/auth';
import { setDoc } from '@junobuild/core';
import { nanoid } from 'nanoid';

const LandingPage: React.FC = () => {
  const { login } = useAuthentication();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const handleEmailSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setSubscriptionStatus('error');
      return;
    }

    setIsSubscribing(true);
    try {
      // Store email subscription in Juno datastore
      await setDoc({
        collection: 'email_subscriptions',
        doc: {
          key: nanoid(),
          data: {
            email: email.toLowerCase().trim(),
            subscribedAt: new Date().toISOString(),
            source: 'landing_page',
            status: 'active'
          }
        }
      });
      
      setSubscriptionStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Subscription failed:', error);
      setSubscriptionStatus('error');
    } finally {
      setIsSubscribing(false);
      // Reset status after 3 seconds
      setTimeout(() => setSubscriptionStatus('idle'), 3000);
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
              className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all duration-200 cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-md"
            >
              Sign in →
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
              Bitcoin meets Africa,
              <br />
              <span className="text-gray-600">everywhere, for everyone</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 leading-relaxed px-4 sm:px-0">
              Exchange Bitcoin for local African currencies via SMS or web. Bitcoin transactions, 
              39 currencies supported, works with or without internet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button
                onClick={handleICPLogin}
                className="bg-black text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-lg sm:text-xl font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start Banking Now
              </button>
              <Link
                to="/bitcoin-exchange"
                className="bg-white text-gray-800 border-2 border-gray-200 px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-lg sm:text-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Learn How It Works
              </Link>
              <Link
                to="/sms"
                className="bg-gray-800 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl text-lg sm:text-xl font-semibold hover:bg-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Try SMS Banking
              </Link>
            </div>
            
            {/* Email Subscription Box */}
            <div className="mt-12 sm:mt-16">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <Mail className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                    Stay Updated
                  </h3>
                  <p className="text-gray-600">
                    Get the latest updates on AfriTokeni's launch and new features
                  </p>
                </div>
                
                <form onSubmit={handleEmailSubscription} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-gray-900"
                      disabled={isSubscribing}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubscribing || !email}
                    className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </form>
                
                {subscriptionStatus === 'success' && (
                  <div className="mt-4 flex items-center justify-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Successfully subscribed! Thank you for your interest.</span>
                  </div>
                )}
                
                {subscriptionStatus === 'error' && (
                  <div className="mt-4 text-center text-red-600">
                    <span>Please enter a valid email address.</span>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bitcoin Banking Section */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Bitcoin className="w-3 h-3 mr-2" />
              Bitcoin Integration
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">
              Bitcoin Banking for Africa
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Exchange Bitcoin for any of 39 African currencies. Works on any phone - SMS or web interface.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* SMS Interface */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-4">
                    <Smartphone className="w-4 h-4 mr-2" />
                    SMS Interface
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Any Phone Works</h3>
                  <p className="text-gray-600">Bitcoin banking via text messages - no internet required</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/sms"
                    state={{ command: '*AFRI#' }}
                    className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors group"
                  >
                    <div className="font-mono text-blue-600 font-medium text-sm group-hover:text-blue-700">*AFRI#</div>
                    <div className="text-gray-600 text-xs mt-1">Main Menu</div>
                  </Link>
                  
                  <Link
                    to="/sms"
                    state={{ command: 'BTC BAL' }}
                    className="text-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-colors group"
                  >
                    <div className="font-mono text-orange-600 font-medium text-sm group-hover:text-orange-700">BTC BAL</div>
                    <div className="text-gray-600 text-xs mt-1">Check Balance</div>
                  </Link>
                  
                  <Link
                    to="/sms"
                    state={{ command: 'BTC RATE UGX' }}
                    className="text-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-colors group"
                  >
                    <div className="font-mono text-orange-600 font-medium text-sm group-hover:text-orange-700">BTC RATE</div>
                    <div className="text-gray-600 text-xs mt-1">Live Rates</div>
                  </Link>
                  
                  <Link
                    to="/sms"
                    state={{ command: 'BTC BUY 50000 UGX' }}
                    className="text-center p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 hover:border-orange-300 transition-colors group"
                  >
                    <div className="font-mono text-orange-600 font-medium text-sm group-hover:text-orange-700">BTC BUY</div>
                    <div className="text-gray-600 text-xs mt-1">Buy Bitcoin</div>
                  </Link>
                </div>
                
                <div className="text-center pt-4 border-t border-gray-200">
                  <Link
                    to="/sms"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Try SMS Banking →
                  </Link>
                </div>
              </div>
            </div>

            {/* Web Interface */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-medium mb-4">
                    <Globe className="w-4 h-4 mr-2" />
                    Web Interface
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Dashboard</h3>
                  <p className="text-gray-600">Complete Bitcoin banking with charts & analytics</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleICPLogin}
                    className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-green-200 transition-colors group"
                  >
                    <div className="font-medium text-green-600 text-sm group-hover:text-green-700">Portfolio</div>
                    <div className="text-gray-600 text-xs mt-1">Balance & assets</div>
                  </button>
                  
                  <button
                    onClick={handleICPLogin}
                    className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-green-200 transition-colors group"
                  >
                    <div className="font-medium text-green-600 text-sm group-hover:text-green-700">Exchange</div>
                    <div className="text-gray-600 text-xs mt-1">Live trading</div>
                  </button>
                  
                  <button
                    onClick={handleICPLogin}
                    className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-green-200 transition-colors group"
                  >
                    <div className="font-medium text-green-600 text-sm group-hover:text-green-700">Agents</div>
                    <div className="text-gray-600 text-xs mt-1">Find nearby</div>
                  </button>
                  
                  <button
                    onClick={handleICPLogin}
                    className="text-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-green-200 transition-colors group"
                  >
                    <div className="font-medium text-green-600 text-sm group-hover:text-green-700">History</div>
                    <div className="text-gray-600 text-xs mt-1">All transactions</div>
                  </button>
                </div>
                
                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    onClick={handleICPLogin}
                    className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Start Web Banking →
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="text-center mt-8 lg:mt-12">
            <div className="inline-flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                39 African currencies supported
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                <Link to="/tariff" className="text-orange-600 hover:text-orange-700 font-medium">
                  Smart pricing system →
                </Link>
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
            {/* <div className="w-28 h-28 sm:w-30 sm:h-10 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 p-3">
                <img src="/afriTokeni.svg" alt="AfriTokeni Logo" className="h-4 sm:h-5 w-auto" />
            </div> */}
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
