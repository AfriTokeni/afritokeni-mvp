import React, { createContext, useContext, useEffect, useState } from 'react';
import Userback from '@userback/widget';

const UserbackContext = createContext<any>(null);

export const UserbackProvider = ({ children }: { children: React.ReactNode }) => {
  const [userback, setUserback] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const token = import.meta.env.VITE_USERBACK_TOKEN;
      
      if (!token) {
        console.warn('Userback token not found');
        return;
      }

      const instance = await Userback(token);
      setUserback(instance);
    };

    init();
  }, []);

  return (
    <UserbackContext.Provider value={userback}>
      {children}
    </UserbackContext.Provider>
  );
};

export const useUserback = () => useContext(UserbackContext);
