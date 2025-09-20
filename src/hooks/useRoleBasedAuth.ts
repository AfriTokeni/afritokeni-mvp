import { useCallback, useRef, useState, useEffect } from 'react';
import { getDoc, setDoc, type User as JunoUser } from '@junobuild/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import { DataService } from '../services/dataService';

export type UserRole = 'user' | 'agent';

interface RoleData {
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

export const useRoleBasedAuth = () => {
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [isUserCreated, setIsUserCreated] = useState(() => {
    // Initialize from localStorage to persist across navigation
    return localStorage.getItem('afritokeni_user_created_status') || 'idle';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const inFlightRef = useRef(false);
  const lastHandledUserKeyRef = useRef<string | null>(null);
  const lastNavigatedPathRef = useRef<string | null>(null);

  // Keep state synchronized with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentStatus = localStorage.getItem('afritokeni_user_created_status') || 'idle';
      setIsUserCreated(currentStatus);
    };

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Also check localStorage periodically in case it was updated in the same tab
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
    setIsUserCreated('loading');
    localStorage.setItem('afritokeni_user_created_status', 'loading');
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

      // New web user, create profile using ID as key
      // Generate realistic names for better UX
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      console.log(`Generated user profile: ${firstName} ${lastName} (${role})`);
      
      const afritokeniUser = {
          id: junoUser.key,
          firstName,
          lastName,
          email: junoUser.key, // Use key as identifier for web users
          userType: role, // Use determined role
          isVerified: true,
          kycStatus: 'not_started',
          createdAt: new Date()
        };

        // Create user record in datastore with ID as key
        await DataService.createUser({
          id: afritokeniUser.id,
          firstName: afritokeniUser.firstName,
          lastName: afritokeniUser.lastName,
          email: afritokeniUser.email,
          userType: afritokeniUser.userType,
          kycStatus: 'not_started',
          authMethod: 'web' // Important: specify this is a web user
        });

        // If user selected agent role, also create the Agent record immediately
        if (role === 'agent') {
          console.log('Creating Agent record for new agent user:', afritokeniUser.id);
          try {
            const newAgent = await DataService.createAgent({
              userId: afritokeniUser.id,
              businessName: `${afritokeniUser.firstName} ${afritokeniUser.lastName} Agent Service`,
              location: {
                country: 'Uganda',
                state: 'Central', 
                city: 'Kampala',
                address: 'Default Location',
                coordinates: { lat: 0.3476, lng: 32.5825 }
              },
              isActive: true,
              status: 'available',
              cashBalance: 0,
              digitalBalance: 0,
              commissionRate: 2.5
            });
            console.log('Successfully created Agent record at role selection:', newAgent);
          } catch (agentError) {
            console.error('Error creating Agent record during role selection:', agentError);
            // Don't fail the entire process if agent creation fails
            // Agent can be created later through KYC completion
          }
        }

        setIsUserCreated('success');
        localStorage.setItem('afritokeni_user_created_status', 'success');

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
      setIsUserCreated('error');
      localStorage.setItem('afritokeni_user_created_status', 'error');
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

  // Always get the most current value from localStorage
  const getCurrentUserCreatedStatus = useCallback(() => {
    return localStorage.getItem('afritokeni_user_created_status') || 'idle';
  }, []);

  const isUserCreatedSuccess = isUserCreated === 'success' || getCurrentUserCreatedStatus() === 'success';

  // Function to reset user creation status (useful after successful operations)
  const resetUserCreatedStatus = useCallback(() => {
    setIsUserCreated('idle');
    localStorage.setItem('afritokeni_user_created_status', 'idle');
  }, []);

  return {
    isCheckingRole,
    checkAndRedirectUser,
    setUserRole,
    getUserRole,
    isUserCreatedSuccess,
    resetUserCreatedStatus
  };
};
