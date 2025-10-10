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
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-1.5 sm:py-2 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-sm sm:text-base">Demo Mode Active</span>
            <span className="mx-1 sm:mx-2 hidden xs:inline">•</span>
            <span className="text-purple-100 text-xs sm:text-sm hidden sm:inline">All data is fake and for demonstration purposes only</span>
            <span className="text-purple-100 text-xs sm:hidden block">Fake data for demo</span>
          </div>
        </div>
        <button
          onClick={disableDemoMode}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md sm:rounded-lg transition-colors text-xs sm:text-sm font-medium flex-shrink-0"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Exit Demo</span>
          <span className="xs:hidden">Exit</span>
        </button>
      </div>
    </div>
  );
}
