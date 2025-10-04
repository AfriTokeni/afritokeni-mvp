import React from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, MapPin, Shield, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';
import { LoginFormData } from '../types/auth';

const BecomeAgentPage: React.FC = () => {
  const { user, login } = useAuthentication();

  const handleGetStarted = async () => {
    if (!user) {
      // Trigger ICP login
      try {
        await login({} as LoginFormData, 'web');
        // After login, user will be redirected based on role
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  const earnings = [
    { location: 'Urban Areas', commission: '2.5-4%', example: 'UGX 25,000 - 40,000 per million' },
    { location: 'Suburban Areas', commission: '3-5%', example: 'UGX 30,000 - 50,000 per million' },
    { location: 'Rural Areas', commission: '4-7%', example: 'UGX 40,000 - 70,000 per million' },
    { location: 'Remote Villages', commission: '7-12%', example: 'UGX 70,000 - 120,000 per million' }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Commission',
      description: 'Earn 2-12% on every transaction. Higher rates for serving remote areas.'
    },
    {
      icon: Shield,
      title: 'Zero Risk',
      description: 'Escrow system protects you. Get paid before releasing cash to customers.'
    },
    {
      icon: TrendingUp,
      title: 'Flexible Schedule',
      description: 'Work when you want. Set your own hours and service areas.'
    },
    {
      icon: MapPin,
      title: 'Serve Your Community',
      description: 'Bring financial services to your neighborhood. Help the unbanked.'
    }
  ];

  const requirements = [
    'Valid government ID',
    'Mobile phone (any type)',
    'Initial liquidity (minimum UGX 500,000)',
    'Physical location for cash exchanges',
    'Pass KYC verification'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/afriTokeni.svg" alt="AfriTokeni" className="h-5 w-auto" />
            </Link>
            <Link
              to="/bitcoin-exchange"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Users className="w-4 h-4" />
            Agent Program
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Become an AfriTokeni Agent
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Earn money by helping your community access Bitcoin banking. No technical knowledge required.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-black text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            {user ? 'Apply Now' : 'Sign In to Apply'}
          </button>
        </div>

        {/* Earnings Potential */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Earnings Potential</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {earnings.map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.location}</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">{item.commission}</div>
                <p className="text-gray-600">{item.example}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-6">
            * Based on transaction volume. Remote areas earn more to compensate for travel.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Become an Agent?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-12 border-2 border-blue-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Requirements</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {requirements.map((req, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-900 font-medium">{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Apply & Verify</h3>
              <p className="text-gray-600">
                Sign up, complete KYC verification, and set up your agent profile.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fund Your Account</h3>
              <p className="text-gray-600">
                Add initial liquidity to process customer transactions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Earning</h3>
              <p className="text-gray-600">
                Process transactions and earn commission on every exchange.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-12 border-2 border-orange-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of agents earning money while serving their communities.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-black text-white px-10 py-5 rounded-xl text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            {user ? 'Apply Now' : 'Sign In to Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BecomeAgentPage;
