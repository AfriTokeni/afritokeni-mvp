/**
 * Demo Mode Context
 * Manages demo mode state across the application
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoDataService } from '../services/demoDataService';

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('afritokeni_demo_mode');
    return saved === 'true';
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('afritokeni_demo_mode', isDemoMode.toString());

    if (isDemoMode) {
      // Initialize demo data when enabling demo mode
      const existingUser = DemoDataService.getDemoUser();
      if (!existingUser) {
        DemoDataService.initializeDemoUser('+256700000000');
      }
    } else {
      // Reset demo data when disabling demo mode
      DemoDataService.reset();
    }
  }, [isDemoMode]);

  const enableDemoMode = () => {
    setIsDemoMode(true);
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
