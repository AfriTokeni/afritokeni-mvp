import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authSubscribe, signIn, signOut, setDoc, getDoc, type User as JunoUser } from '@junobuild/core';
import { AuthContextType, User, LoginFormData, RegisterFormData } from '../types/auth';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { nanoid } from 'nanoid';
import { SMSService } from '../services/smsService';

const AuthenticationContext = createContext<AuthContextType | undefined>(undefined);

const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Hybrid authentication for AfriTokeni - SMS for users without internet, ICP for web users
const AuthenticationProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'sms' | 'web'>('web');
  
  // SMS verification states
  const [verificationState, setVerificationState] = useState<{
    isVerifying: boolean;
    phoneNumber: string | null;
    pendingUserData: RegisterFormData | null;
    devVerificationCode?: string; // For development/testing only
  }>({
    isVerifying: false,
    phoneNumber: null,
    pendingUserData: null
  });
  
  const { checkAndRedirectUser } = useRoleBasedAuth();
  // Keep a ref of latest checker to avoid re-subscribing when its identity changes
  const checkAndRedirectRef = useRef(checkAndRedirectUser);
  useEffect(() => {
    checkAndRedirectRef.current = checkAndRedirectUser;
  }, [checkAndRedirectUser]);

  // Subscribe to Juno authentication state for web users
  useEffect(() => {
    const unsubscribe = authSubscribe((junoUser: JunoUser | null) => {
      if (junoUser) {
        // For ICP users, check their role and redirect accordingly
        checkAndRedirectRef.current(junoUser);

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
  }, []);

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
        const formattedPhone = SMSService.formatPhoneNumber(formData.emailOrPhone);
        
        // Validate phone number
        if (!SMSService.isValidPhoneNumber(formattedPhone)) {
          console.error('Invalid phone number format');
          return false;
        }
        
        // Try to get existing user by phone
        let existingUser: User | null = null;
        try {
          const doc = await getDoc({
            collection: 'users',
            key: formattedPhone
          });
          existingUser = doc?.data as User || null;
        } catch {
          console.log('User not found, will create new account');
        }
        
        if (!existingUser) {
          // For SMS users, auto-register with basic info if they don't exist
          const newUser: User = {
            id: nanoid(),
            firstName: 'SMS User',
            lastName: formattedPhone.slice(-4), // Last 4 digits as identifier
            email: formattedPhone, // Use phone as email identifier
            userType: formData.userType,
            isVerified: true, // Will be verified via SMS
            kycStatus: 'not_started',
            createdAt: new Date()
          };
          
          // Send SMS verification code before creating the user
          const verificationResult = await SMSService.sendVerificationCode(
            formattedPhone, 
            newUser.firstName
          );
          
          if (!verificationResult.success) {
            console.error('Failed to send verification SMS:', verificationResult.error);
            return false;
          }
          
          // For demo purposes, we'll auto-verify and save the user
          // In production, you'd wait for the user to respond with the code
          await setDoc({
            collection: 'users',
            doc: {
              key: formattedPhone,
              data: newUser
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
      // Step 1: Send SMS with verification code to formData.email (phone)
      const formattedPhone = SMSService.formatPhoneNumber(formData.email);
      
      // Validate phone number
      if (!SMSService.isValidPhoneNumber(formattedPhone)) {
        console.error('Invalid phone number format');
        return false;
      }
      
      // Check if user already exists
      try {
        const existingDoc = await getDoc({
          collection: 'users',
          key: formattedPhone
        });
        if (existingDoc?.data) {
          console.error('User already exists with this phone number');
          return false;
        }
      } catch {
        // User doesn't exist, continue with registration
      }
      
      // Send verification code
      const verificationResult = await SMSService.sendVerificationCode(
        formattedPhone, 
        formData.firstName
      );
      
      if (!verificationResult.success) {
        console.error('Failed to send verification SMS:', verificationResult.error);
        return false;
      }
      
      // Store pending registration data
      setVerificationState({
        isVerifying: true,
        phoneNumber: formattedPhone,
        pendingUserData: formData,
        devVerificationCode: import.meta.env.DEV ? verificationResult.verificationCode : undefined
      });
      
      // In development mode, log the verification code for testing
      if (import.meta.env.DEV && verificationResult.verificationCode) {
        console.log('🔑 [DEV] Verification code for testing:', verificationResult.verificationCode);
      }
      
      console.log('Verification code sent successfully to:', formattedPhone);
      return true; // Return true to indicate SMS was sent, UI should now show verification input
      
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 & 3: Verify code and create account
  const verifyRegistrationCode = async (code: string): Promise<boolean> => {
    if (!verificationState.isVerifying || !verificationState.phoneNumber || !verificationState.pendingUserData) {
      console.error('No verification in progress');
      return false;
    }
    
    setIsLoading(true);
    try {
      // Step 2: User enters code - verify it
      const verificationResult = await SMSService.verifyCode(verificationState.phoneNumber, code);
      
      if (!verificationResult.success) {
        console.error('Code verification failed:', verificationResult.error);
        return false;
      }
      
      // Step 3: Verify code and create account
      const formData = verificationState.pendingUserData;
      const newUser: User = {
        id: nanoid(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: verificationState.phoneNumber, // Use formatted phone number
        userType: formData.userType,
        isVerified: true, // SMS verified
        kycStatus: 'not_started',
        createdAt: new Date()
      };
      
      // Save user to Juno datastore
      await setDoc({
        collection: 'users',
        doc: {
          key: verificationState.phoneNumber,
          data: newUser
        }
      });
      
      // Set user as logged in
      setUser(newUser);
      setAuthMethod('sms');
      localStorage.setItem('afritokeni_user', JSON.stringify(newUser));
      localStorage.setItem('afritokeni_auth_method', 'sms');
      
      // Clear verification state
      setVerificationState({
        isVerifying: false,
        phoneNumber: null,
        pendingUserData: null
      });
      
      console.log('User successfully registered and logged in:', newUser.email);
      return true;
      
    } catch (error) {
      console.error('Code verification error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to cancel verification process
  const cancelVerification = () => {
    setVerificationState({
      isVerifying: false,
      phoneNumber: null,
      pendingUserData: null
    });
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
    isLoading,
    verifyRegistrationCode,
    cancelVerification,
    isVerifying: verificationState.isVerifying,
    verificationPhoneNumber: verificationState.phoneNumber,
    devVerificationCode: verificationState.devVerificationCode
  };

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};


export {AuthenticationProvider, useAuthentication };

