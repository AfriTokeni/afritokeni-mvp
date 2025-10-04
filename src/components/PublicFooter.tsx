import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const PublicFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleEmailSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubscribing) return;

    setIsSubscribing(true);
    setSubscriptionStatus('idle');

    try {
      // Newsletter subscription logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSubscriptionStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Subscription failed:', error);
      setSubscriptionStatus('error');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Newsletter */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Get the latest updates on AfriTokeni's launch and new features
            </p>
            <form onSubmit={handleEmailSubscription} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none text-white placeholder-gray-500"
                disabled={isSubscribing}
                required
              />
              <button
                type="submit"
                disabled={isSubscribing || !email}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubscribing ? '...' : 'Subscribe'}
              </button>
            </form>
            {subscriptionStatus === 'success' && (
              <div className="mt-3 flex items-center text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Successfully subscribed!</span>
              </div>
            )}
            {subscriptionStatus === 'error' && (
              <div className="mt-3 text-red-400 text-sm">
                Please enter a valid email address.
              </div>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/bitcoin-exchange" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/tariff" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/sms" className="hover:text-white transition-colors">SMS Demo</Link></li>
                <li><Link to="/become-agent" className="hover:text-white transition-colors">Become an Agent</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>© 2025 AfriTokeni. Built on Internet Computer Protocol.</p>
          <p className="mt-2">Starting in Africa. Coming to the world.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
