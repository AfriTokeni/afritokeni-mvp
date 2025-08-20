import React, { createContext, useContext, useState, useEffect } from 'react';
import { authSubscribe, signIn, signOut, setDoc, getDoc, type User as JunoUser } from '@junobuild/core';
import { AuthContextType, User, LoginFormData, RegisterFormData } from '../types/auth';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { nanoid } from 'nanoid';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Hybrid authentication for AfriTokeni - SMS for users without internet, ICP for web users
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'sms' | 'web'>('web');
  const { checkAndRedirectUser } = useRoleBasedAuth();

  // Subscribe to Juno authentication state for web users
  useEffect(() => {
    const unsubscribe = authSubscribe((junoUser: JunoUser | null) => {
      if (junoUser) {
        // For ICP users, check their role and redirect accordingly
        checkAndRedirectUser(junoUser);
        
        // Convert Juno user to our User type (role will be determined by the hook)
        const afritokeniUser: User = {
          id: junoUser.key,
          firstName: 'ICP',
          lastName: 'User',
          email: junoUser.key, // Use key as identifier
          userType: 'user', // This will be updated based on role check
          isVerified: true,
          kycStatus: 'not_started',
          createdAt: new Date()
        };
        setUser(afritokeniUser);
        setAuthMethod('web');
        localStorage.setItem('afritokeni_user', JSON.stringify(afritokeniUser));
        localStorage.setItem('afritokeni_auth_method', 'web');
      } else {
        setUser(null);
        localStorage.removeItem('afritokeni_user');
        localStorage.removeItem('afritokeni_auth_method');
      }
    });

    return unsubscribe;
  }, [checkAndRedirectUser]);

  // Hybrid login - SMS for users without internet, ICP for web users
  const login = async (formData: LoginFormData, method: 'sms' | 'web' = 'web'): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (method === 'web') {
        // Use Juno/ICP Internet Identity authentication for web users
        await signIn();
        return true;
      } else if (method === 'sms') {
        // SMS-based authentication for users without internet (feature phones)
        // In real implementation:
        // 1. Send SMS with verification code to formData.emailOrPhone
        // 2. User replies with code via SMS
        // 3. Verify code and authenticate
        
        // For demo, simulate SMS verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to get existing user by phone
        let existingUser: User | null = null;
        try {
          const doc = await getDoc({
            collection: 'users',
            key: formData.emailOrPhone // Use phone as key
          });
          existingUser = doc?.data as User || null;
        } catch (error) {
          console.log('User not found, will need to register via SMS');
        }
        
        if (!existingUser) {
          // For SMS users, auto-register with basic info
          const newUser: User = {
            id: nanoid(),
            firstName: 'SMS User',
            lastName: formData.emailOrPhone.slice(-4), // Last 4 digits
            email: formData.emailOrPhone,
            userType: formData.userType,
            isVerified: true, // SMS verified
            kycStatus: 'not_started',
            createdAt: new Date()
          };
          
          // Save to datastore
          await setDoc({
            collection: 'users',
            doc: {
              key: formData.emailOrPhone,
              data: {
                ...newUser,
                createdAt: newUser.createdAt.toISOString()
              }
            }
          });
          
          existingUser = newUser;
        }
        
        setUser(existingUser);
        setAuthMethod('sms');
        localStorage.setItem('afritokeni_user', JSON.stringify(existingUser));
        localStorage.setItem('afritokeni_auth_method', 'sms');
        
        return true;
      } else {
        throw new Error('Invalid authentication method');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // SMS-based registration for users without internet
  const register = async (formData: RegisterFormData): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In real implementation, this would:
      // 1. Send SMS with verification code to formData.email (phone)
      // 2. User enters code
      // 3. Verify code and create account
      
      // For demo, simulate SMS verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUser: User = {
        id: nanoid(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email, // This is actually phone number for SMS users
        userType: formData.userType,
        isVerified: true, // SMS verified
        kycStatus: 'not_started',
        createdAt: new Date()
      };
      
      // Save user to Juno datastore
      await setDoc({
        collection: 'users',
        doc: {
          key: formData.email,
          data: {
            ...newUser,
            createdAt: newUser.createdAt.toISOString()
          }
        }
      });
      
      // Set user as logged in
      setUser(newUser);
      setAuthMethod('sms');
      localStorage.setItem('afritokeni_user', JSON.stringify(newUser));
      localStorage.setItem('afritokeni_auth_method', 'sms');
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (authMethod === 'web') {
        // Use Juno signOut for web users
        await signOut();
      }
      
      // Clear local state for all auth methods
      setUser(null);
      setAuthMethod('web');
      localStorage.removeItem('afritokeni_user');
      localStorage.removeItem('afritokeni_auth_method');
      
      // Force redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if signOut fails
      setUser(null);
      setAuthMethod('web');
      localStorage.removeItem('afritokeni_user');
      localStorage.removeItem('afritokeni_auth_method');
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    user,
    authMethod,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
