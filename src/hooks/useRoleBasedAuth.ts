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
      // Check if user role exists in datastore
      let roleDoc;
      try {
        roleDoc = await getDoc({
          collection: 'user_roles',
          key: junoUser.key
        });
      } catch (error) {
        console.log('Role not found for user:', junoUser.key);
      }

      if (roleDoc?.data) {
        // User has existing role, redirect accordingly
        const roleData = roleDoc.data as RoleData;
        
        // Update last login
        await setDoc({
          collection: 'user_roles',
          doc: {
            key: junoUser.key,
            data: {
              ...roleData,
              lastLogin: new Date().toISOString()
            },
            version: undefined
          }
        });

        // Redirect based on role
        if (roleData.role === 'agent') {
          navigate('/agents/dashboard');
        } else {
          navigate('/users/dashboard');
        }
      } else {
        // New user - need to determine role
        // For now, we'll show a role selection screen
        // You could also implement logic to auto-detect based on other criteria
        navigate('/auth/role-selection');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      // Default to user dashboard on error
      navigate('/users/dashboard');
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
          data: roleData,
          version: undefined
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
