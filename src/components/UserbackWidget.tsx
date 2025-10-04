import { useEffect, useState } from 'react';
import Userback from '@userback/widget';

/**
 * Userback Widget Integration
 * Provides in-app feedback, bug reporting, and user insights
 * https://userback.io/
 * 
 * Official React package: @userback/widget
 */
export default function UserbackWidget() {
  const [userback, setUserback] = useState<any>(null);

  useEffect(() => {
    const initUserback = async () => {
      try {
        // Get token from environment variable
        const token = import.meta.env.VITE_USERBACK_TOKEN;
        
        if (!token) {
          console.warn('Userback token not found. Add VITE_USERBACK_TOKEN to .env');
          return;
        }

        // Initialize Userback with token
        const ub = await Userback(token);
        setUserback(ub);
        
        console.log('Userback widget initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Userback:', error);
      }
    };

    initUserback();

    // Cleanup on unmount
    return () => {
      if (userback) {
        userback.destroy?.();
      }
    };
  }, []);

  return null; // Widget is injected by Userback
}
