/**
 * Demo Mode Banner
 * Shows at the top when demo mode is active
 */

import { Zap, X } from 'lucide-react';
import { useDemoMode } from '../context/DemoModeContext';

export function DemoModeBanner() {
  const { isDemoMode, disableDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5" />
          <div>
            <span className="font-semibold">Demo Mode Active</span>
            <span className="mx-2">•</span>
            <span className="text-purple-100">All data is fake and for demonstration purposes only</span>
          </div>
        </div>
        <button
          onClick={disableDemoMode}
          className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Exit Demo
        </button>
      </div>
    </div>
  );
}
