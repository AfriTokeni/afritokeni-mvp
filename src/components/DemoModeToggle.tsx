/**
 * Demo Mode Toggle
 * Simple toggle switch for demo mode in header/dashboard
 */

import { Zap } from 'lucide-react';
import { useDemoMode } from '../context/DemoModeContext';

export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
      <div className="flex items-center gap-1 sm:gap-2">
        <Zap className={`w-3 h-3 sm:w-4 sm:h-4 ${isDemoMode ? 'text-purple-600' : 'text-gray-400'}`} />
        <span className="text-xs sm:text-sm font-medium text-gray-700 hidden xs:inline">Demo Mode</span>
        <span className="text-xs sm:text-sm font-medium text-gray-700 xs:hidden">Demo</span>
      </div>
      
      <button
        onClick={toggleDemoMode}
        className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          isDemoMode ? 'bg-purple-600' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={isDemoMode}
      >
        <span
          className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
            isDemoMode ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {isDemoMode && (
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded">
          DEMO
        </span>
      )}
    </div>
  );
}
