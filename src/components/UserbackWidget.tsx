import { useEffect } from 'react';

/**
 * Userback Widget Integration
 * Provides in-app feedback, bug reporting, and user insights
 * https://userback.io/
 */
export default function UserbackWidget() {
  useEffect(() => {
    // Load Userback script
    const script = document.createElement('script');
    script.src = 'https://static.userback.io/widget/v1.js';
    script.async = true;
    
    script.onload = () => {
      // Initialize Userback with your access token
      // Get your token from: https://app.userback.io/settings/widget
      if (window.Userback) {
        window.Userback(import.meta.env.VITE_USERBACK_TOKEN || 'demo-token');
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null; // Widget is injected by script
}

// TypeScript declaration for Userback
declare global {
  interface Window {
    Userback?: (token: string) => void;
  }
}
