import { useState } from 'react';
import { getDoc, setDoc, type User as JunoUser } from '@junobuild/core';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'user' | 'agent';

interface RoleData {
  role: UserRole;
  createdAt: string;
  lastLogin: string;
}

export const useRoleBasedAuth = () => {
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const navigate = useNavigate();

  const checkAndRedirectUser = async (junoUser: JunoUser) => {
    setIsCheckingRole(true);
    try {
      const roleDoc = await getDoc({
        collection: 'user_roles',
        key: junoUser.key
      });

      if (roleDoc?.data) {
        // User has existing role, redirect accordingly
        const roleData = roleDoc.data as RoleData;
        
        try {
          // Update last login
          await setDoc({
            collection: 'user_roles',
            doc: {
              key: junoUser.key,
              data: {
                ...roleData,
                lastLogin: new Date().toISOString()
              },
              version: roleDoc.version
            }
          });
        } catch (updateError) {
          console.warn('Failed to update last login:', updateError);
          // Continue with redirect even if update fails
        }

        // Redirect based on role
        if (roleData.role === 'agent') {
          navigate('/agents/dashboard');
        } else {
          navigate('/users/dashboard');
        }
      } else {
        // New user - need to determine role
        navigate('/auth/role-selection');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // For new users or on error, go to role selection
      navigate('/auth/role-selection');
    } finally {
      setIsCheckingRole(false);
    }
  };

  const setUserRole = async (junoUser: JunoUser, role: UserRole) => {
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
      setTimeout(() => {
        if (role === 'agent') {
          navigate('/agents/dashboard');
        } else {
          navigate('/users/dashboard');
        }
      }, 100);
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  };

  const getUserRole = async (junoUser: JunoUser): Promise<UserRole | null> => {
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
  };

  return {
    isCheckingRole,
    checkAndRedirectUser,
    setUserRole,
    getUserRole
  };
};
