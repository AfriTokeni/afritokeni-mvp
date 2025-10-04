import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Zap, Lock, Bitcoin, Globe, Mail, CheckCircle } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import { LoginFormData } from '../types/auth';
import { setDoc } from '@junobuild/core';
import { nanoid } from 'nanoid';
import SavingsComparisonTable from '../components/SavingsComparisonTable';

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

      // Send welcome email using NotificationService
      console.log('📧 Sending welcome email to:', email);
      try {
        const { NotificationService } = await import('../services/notificationService');
        
        // Create a user object for the notification
        const user = {
          id: nanoid(),
          email: email.toLowerCase().trim(),
          firstName: 'Subscriber',
          authMethod: 'web' as const
        };

        // Send subscription welcome notification
        await NotificationService.sendNotification(user, {
          userId: user.id,
          type: 'subscription_welcome'
        });
        
        console.log('✅ Welcome email sent successfully');
      } catch (emailError) {
        console.warn('⚠️ Welcome email failed to send, but subscription was saved:', emailError);
      }
      
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
              Instant Bitcoin transfers via Lightning Network. Send money in under 1 second with $0.001 fees.
              39 African currencies, SMS or web, works with or without internet.
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
                    Get the latest updates on AfriTokeni&apos;s launch and new features
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
                    <span>Successfully subscribed! Check your email for a welcome message.</span>
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

      {/* Lightning Network Section */}
      <section className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-800 text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-2" />
              Lightning Network
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Instant Bitcoin Transfers
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Send Bitcoin in under 1 second with fees less than $0.001. The future of payments is here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {/* Speed */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                &lt; 1 Second
              </h3>
              <p className="text-gray-600 mb-4">
                Instant transfers. No waiting for blockchain confirmations.
              </p>
              <div className="text-sm text-gray-500">
                vs 10-60 min on-chain
              </div>
            </div>

            {/* Cost */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">$</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                $0.001 Fee
              </h3>
              <p className="text-gray-600 mb-4">
                99% cheaper than traditional Bitcoin transactions.
              </p>
              <div className="text-sm text-gray-500">
                vs $5-20 on-chain
              </div>
            </div>

            {/* Perfect for Africa */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Perfect for Daily Use
              </h3>
              <p className="text-gray-600 mb-4">
                Ideal for small payments, remittances, and everyday transactions.
              </p>
              <div className="text-sm text-gray-500">
                Optimized for &lt;$50
              </div>
            </div>
          </div>

          {/* SMS Lightning Commands */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Lightning via SMS
              </h3>
              <p className="text-gray-600">
                Send instant Bitcoin payments from any phone - no internet required
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
              <div className="text-green-400 mb-2">$ Send instant payment:</div>
              <div className="text-white mb-4">LN SEND +234... 5000 NGN</div>
              
              <div className="text-green-400 mb-2">$ Create Lightning invoice:</div>
              <div className="text-white mb-4">LN INVOICE 10000 UGX</div>
              
              <div className="text-yellow-400 mb-2">⚡ Response (instant):</div>
              <div className="text-gray-300">
                ✓ Sent 5,000 NGN<br/>
                ✓ Fee: $0.001<br/>
                ✓ Time: 0.8 seconds
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Instant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Cheap</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>No Internet</span>
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
              Exchange Bitcoin for 39 African currencies. SMS + USSD (*123#) or web - works on any phone.
            </p>
            <div className="mt-8 px-4 max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-center gap-3 mb-3">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇰🇪 Kenya
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇳🇬 Nigeria
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇺🇬 Uganda
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇹🇿 Tanzania
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇷🇼 Rwanda
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇿🇦 South Africa
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇿🇲 Zambia
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm">
                  🇲🇼 Malawi
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium shadow-sm">
                  +31 more (SMS + web)
                </span>
              </div>
            </div>
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
                  <p className="text-gray-600">SMS commands or USSD menu - no internet required</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SMS Commands</div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                      or dial *123#
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-mono text-blue-600 font-medium text-xs">REG John Doe</div>
                      <div className="text-gray-500 text-xs mt-1">Register</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-mono text-blue-600 font-medium text-xs">BAL</div>
                      <div className="text-gray-500 text-xs mt-1">Balance</div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="font-mono text-orange-600 font-medium text-xs">BTC BAL</div>
                      <div className="text-gray-500 text-xs mt-1">Bitcoin</div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="font-mono text-orange-600 font-medium text-xs">BTC BUY</div>
                      <div className="text-gray-500 text-xs mt-1">Buy BTC</div>
                    </div>
                  </div>
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
                <div className="text-center pt-2">
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

      {/* Savings Comparison Table */}
      <SavingsComparisonTable />

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
