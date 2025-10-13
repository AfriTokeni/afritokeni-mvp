import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Zap, Lock, Bitcoin, Globe } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import { LoginFormData } from '../types/auth';
import SavingsComparisonTable from '../components/SavingsComparisonTable';
import PublicFooter from '../components/PublicFooter';

const LandingPage: React.FC = () => {
  const { login } = useAuthentication();

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
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/afriTokeni.svg" alt="AfriTokeni" className="h-5 w-auto" />
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/how-it-works" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                How It Works
              </Link>
              <Link to="/tariff" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </Link>
              <Link to="/ussd" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Try USSD
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
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

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Starting in Africa. Coming to the world.
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              Send money across Africa
              <br />
              <span className="text-orange-600">in under 1 second</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleICPLogin}
                className="bg-black text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
              <a
                href="#savings"
                className="bg-white text-gray-900 border-2 border-gray-300 px-10 py-5 rounded-xl text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                See How Much You Save
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Comparison Table - MOVED UP */}
      <div id="savings">
        <SavingsComparisonTable />
      </div>

      {/* Key Differentiators - NEW SECTION */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How We Protect Your Money
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Security, speed, and fair pricing. Everything traditional services lack.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Escrow Protection */}
            <Link to="/escrow" className="block bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg flex flex-col">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Escrow Protected</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                AfriTokeni holds ckBTC/ckUSDC in escrow. Agents can't disappear with your money. 6-digit codes + 24hr refunds.
              </p>
              <div className="text-sm font-semibold text-blue-600 mt-auto flex items-center gap-2">
                Learn More →
              </div>
            </Link>

            {/* Lightning Speed */}
            <Link to="/ckbtc" className="block bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200 hover:border-orange-400 transition-all hover:shadow-lg flex flex-col">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ckBTC Instant</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                ICP-native Bitcoin transfers in &lt;1 second. ~$0.01 fees. Instant and secure.
              </p>
              <div className="text-sm font-semibold text-orange-600 mt-auto flex items-center gap-2">
                Learn More →
              </div>
            </Link>

            {/* ckUSDC Stable Value */}
            <Link to="/ckusdc" className="block bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg flex flex-col">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">ckUSDC Stable</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Protect yourself from Bitcoin volatility. ckUSDC stays pegged to $1 USD. Instant transfers, stable value.
              </p>
              <div className="text-sm font-semibold text-green-600 mt-auto flex items-center gap-2">
                Learn More →
              </div>
            </Link>

            {/* DAO Governance */}
            <Link to="/dao-info" className="block bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg flex flex-col">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">DAO Governed</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Community-owned. Vote on fees, currencies, and policies via USSD. Agents and users control the platform.
              </p>
              <div className="text-sm font-semibold text-purple-600 mt-auto flex items-center gap-2">
                Learn More →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - SIMPLIFIED */}
      <section className="bg-gray-50 py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-800 text-sm font-medium mb-4">
              <Zap className="w-4 h-4 mr-2" />
              ICP-Native Assets
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              ckBTC + ckUSDC Instant Transfers
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Send ckBTC (Bitcoin) or ckUSDC (stablecoin) in under 1 second with ~$0.01 fees. Choose speed or stability.
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
                ~$0.01 Fee
              </h3>
              <p className="text-gray-600 mb-4">
                99% cheaper than traditional transfers.
              </p>
              <div className="text-sm text-gray-500">
                vs $1-50 on-chain
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
                ckBTC + ckUSDC via USSD
              </h3>
              <p className="text-gray-600">
                Menu-driven interface - works on any phone, no internet needed
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
              <div className="text-green-400 mb-2">$ Dial USSD menu:</div>
              <div className="text-white mb-4">*AFRI#</div>
              
              <div className="text-yellow-400 mb-2">⚡ Menu appears:</div>
              <div className="text-gray-300 mb-4">
                1. Send Money<br/>
                2. Check Balance<br/>
                5. Check ckBTC Balance<br/>
                6. Send ckBTC<br/>
                8. Check ckUSDC Balance
              </div>
              
              <div className="text-green-400 mb-2">$ Select option:</div>
              <div className="text-white">6 (Send ckBTC)</div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>ckBTC (Fast)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>ckUSDC (Stable)</span>
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
              Dual Asset System
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">
              ckBTC + ckUSDC Banking
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              ckBTC (ICP Bitcoin - fast) + ckUSDC (stablecoin - no volatility) for 39 African currencies. USSD or web.
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
                  +31 more (USSD + web)
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* USSD Interface */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 lg:p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-4">
                    <Smartphone className="w-4 h-4 mr-2" />
                    USSD Interface
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                    <h3 className="font-bold text-red-900 mb-2 text-sm sm:text-base">🇺🇬 REAL USSD: UGANDA ONLY</h3>
                    <p className="text-xs sm:text-sm text-red-800 mb-2">
                      <strong>Uganda:</strong> Dial <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">*384*22948#</code> for real USSD!
                    </p>
                    <p className="text-xs text-red-700">
                      <strong>Other countries:</strong> Coming soon! Use USSD playground for demo.
                    </p>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Any Phone Works</h3>
                  <p className="text-gray-600">USSD menu - no internet required</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">USSD Menu</div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                      Dial *384*22948#
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-mono text-blue-600 font-medium text-xs">*384*22948#</div>
                      <div className="text-gray-500 text-xs mt-1">Start USSD</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-mono text-blue-600 font-medium text-xs">1</div>
                      <div className="text-gray-500 text-xs mt-1">Local Currency</div>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="font-mono text-orange-600 font-medium text-xs">12</div>
                      <div className="text-gray-500 text-xs mt-1">Check Balance</div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-mono text-green-600 font-medium text-xs">2</div>
                      <div className="text-gray-500 text-xs mt-1">Bitcoin (ckBTC)</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center pt-4 border-t border-gray-200">
                  <Link
                    to="/ussd"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Try USSD Banking →
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
                  <p className="text-gray-600">Complete crypto banking: ckBTC + ckUSDC with charts & analytics</p>
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

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
