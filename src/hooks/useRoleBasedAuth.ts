import { useCallback, useRef, useState } from 'react';
import { getDoc, setDoc, type User as JunoUser } from '@junobuild/core';
import { useLocation, useNavigate } from 'react-router-dom';

export type UserRole = 'user' | 'agent';

interface RoleData {
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

export const useRoleBasedAuth = () => {
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inFlightRef = useRef(false);
  const lastHandledUserKeyRef = useRef<string | null>(null);
  const lastNavigatedPathRef = useRef<string | null>(null);

  const checkAndRedirectUser = useCallback(async (junoUser: JunoUser) => {
    if (inFlightRef.current || lastHandledUserKeyRef.current === junoUser.key) {
      return;
    }
    inFlightRef.current = true;
    setIsCheckingRole(true);
    try {
      // Add retry logic for network issues
      let roleDoc;
      let retries = 3;
      
      while (retries > 0) {
        try {
          roleDoc = await getDoc({
            collection: 'user_roles',
            key: junoUser.key
          });
          break; // Success, exit retry loop
        } catch (fetchError) {
          retries--;
          if (retries === 0) throw fetchError;
          console.warn(`Retrying getDoc, ${retries} attempts left:`, fetchError);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }

      if (roleDoc?.data) {
        // User has existing role, redirect accordingly
        const roleData = roleDoc.data as RoleData;
        
        // Skip login update for now to avoid version issues
        // Just redirect based on role
        const target = roleData.role === 'agent' ? '/agents/dashboard' : '/users/dashboard';
        if (location.pathname !== target) {
          navigate(target, { replace: true });
          lastNavigatedPathRef.current = target;
        }
      } else {
        // New user - need to determine role
        const target = '/auth/role-selection';
        if (location.pathname !== target) {
          navigate(target, { replace: true });
          lastNavigatedPathRef.current = target;
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // For new users or on error, go to role selection
      const target = '/auth/role-selection';
      if (location.pathname !== target) {
        navigate(target, { replace: true });
        lastNavigatedPathRef.current = target;
      }
    } finally {
      lastHandledUserKeyRef.current = junoUser.key;
      inFlightRef.current = false;
      setIsCheckingRole(false);
    }
  }, [location.pathname, navigate]);

  const setUserRole = useCallback(async (junoUser: JunoUser, role: UserRole) => {
    try {
      let existingRoleData;
      try {
        const existingRoleDoc = await getDoc({
          collection: 'user_roles',
          key: junoUser.key
        });
        existingRoleData = existingRoleDoc?.data as RoleData | undefined;
      } catch (error) {
        console.log('Role not found for user:', junoUser.key);
      }

      const existingRole = existingRoleData?.role || role;

      // Update last login time
      const roleData: RoleData = {
        role: existingRole,
        createdAt: existingRoleData?.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await setDoc({
        collection: 'user_roles',
        doc: {
          key: junoUser.key,
          data: roleData
        }
      });

      // Redirect based on selected role
      const target = role === 'agent' ? '/agents/dashboard' : '/users/dashboard';
      if (location.pathname !== target) {
        // small timeout keeps UX smooth post-write
        setTimeout(() => {
          navigate(target, { replace: true });
          lastNavigatedPathRef.current = target;
        }, 50);
      }
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }, [location.pathname, navigate]);

  const getUserRole = useCallback(async (junoUser: JunoUser): Promise<UserRole | null> => {
    try {
      const roleDoc = await getDoc({
        collection: 'user_roles',
        key: junoUser.key
      });

      if (roleDoc?.data) {
        return (roleDoc.data as RoleData).role;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }, []);

  return {
    isCheckingRole,
    checkAndRedirectUser,
    setUserRole,
    getUserRole
  };
};
