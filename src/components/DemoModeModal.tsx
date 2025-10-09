/**
 * Demo Mode Modal
 * Inspired by InFoundr's playground demo modal
 */

import { X, Zap, FileText, Lightbulb } from 'lucide-react';
import { useDemoMode } from '../context/DemoModeContext';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'user' | 'agent';
}

export function DemoModeModal({ isOpen, onClose, userType }: DemoModeModalProps) {
  const { enableDemoMode } = useDemoMode();

  if (!isOpen) return null;

  const handleStartDemo = () => {
    enableDemoMode();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Get Started with AfriTokeni
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Try our platform instantly or use your real account
          </p>

          {/* Demo Mode Option */}
          <div className="mb-4">
            <div className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white hover:border-purple-300 transition-all cursor-pointer"
                 onClick={handleStartDemo}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">PG</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Try Playground Demo
                    </h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Experience our {userType === 'agent' ? 'agent dashboard' : 'platform'} instantly without any setup. Perfect for exploring features and getting a feel for the platform.
                  </p>
                  <button 
                    onClick={handleStartDemo}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1 group"
                  >
                    Start demo now - No setup required
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real Account Option */}
          <div className="mb-6">
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all cursor-pointer"
                 onClick={onClose}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Use Real Account
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {userType === 'agent' 
                      ? 'Manage real customers, process actual transactions, and earn real commissions.'
                      : 'Send real money, buy Bitcoin, and use the full platform with your actual balance.'}
                  </p>
                  <button 
                    onClick={onClose}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1 group"
                  >
                    Continue with real account
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Tip:</span> Try the playground first to see what our platform can do, then switch to your real account for actual transactions!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
