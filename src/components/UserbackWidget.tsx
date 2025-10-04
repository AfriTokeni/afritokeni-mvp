import { useEffect } from 'react';
import Userback from '@userback/widget';

/**
 * Userback Widget Integration
 * Official docs: https://userback.io/docs/react
 */
export default function UserbackWidget() {
  useEffect(() => {
    const initUserback = async () => {
      const token = import.meta.env.VITE_USERBACK_TOKEN;
      
      if (!token) {
        console.warn('Userback token not found');
        return;
      }

      await Userback(token);
    };

    initUserback();
  }, []);

  return null;
}
