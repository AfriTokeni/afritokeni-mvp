import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authSubscribe, signIn, signOut, setDoc, getDoc, type User as JunoUser } from '@junobuild/core';
import { AuthContextType, User, LoginFormData, RegisterFormData } from '../types/auth';
import { useRoleBasedAuth } from '../hooks/useRoleBasedAuth';
import { DataService } from '../services/dataService';
import { nanoid } from 'nanoid';
import { SMSService } from '../services/smsService';

// Interface for user data as stored in Juno (with string dates)
interface UserDataFromJuno {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'user' | 'agent';
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_started';
  createdAt: string;
}

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
  
  // Helper function to store user data in both session and local storage
  const storeUserData = (userData: User, method: 'sms' | 'web') => {
    const userString = JSON.stringify(userData);
    // Store in sessionStorage for tab-specific access
    sessionStorage.setItem('afritokeni_user', userString);
    sessionStorage.setItem('afritokeni_auth_method', method);
    // Store in localStorage for persistence across sessions
    localStorage.setItem('afritokeni_user', userString);
    localStorage.setItem('afritokeni_auth_method', method);
  };

  // Helper function to clear user data from both storages
  const clearUserData = () => {
    sessionStorage.removeItem('afritokeni_user');
    sessionStorage.removeItem('afritokeni_auth_method');
    localStorage.removeItem('afritokeni_user');
    localStorage.removeItem('afritokeni_auth_method');
  };
  
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

  // Initialize user from sessionStorage (tab-specific) or localStorage (global) on app start
  useEffect(() => {
    // Priority: sessionStorage (tab-specific) > localStorage (global)
    let storedUser = sessionStorage.getItem('afritokeni_user');
    let storedAuthMethod = sessionStorage.getItem('afritokeni_auth_method');
    
    // Fallback to localStorage if sessionStorage is empty
    if (!storedUser || !storedAuthMethod) {
      storedUser = localStorage.getItem('afritokeni_user');
      storedAuthMethod = localStorage.getItem('afritokeni_auth_method');
      
      // If found in localStorage, copy to sessionStorage for this tab
      if (storedUser && storedAuthMethod) {
        sessionStorage.setItem('afritokeni_user', storedUser);
        sessionStorage.setItem('afritokeni_auth_method', storedAuthMethod);
      }
    }
    
    if (storedUser && storedAuthMethod) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        // Convert createdAt string back to Date if it exists
        if (parsedUser.createdAt && typeof parsedUser.createdAt === 'string') {
          parsedUser.createdAt = new Date(parsedUser.createdAt);
        }
        setUser(parsedUser);
        setAuthMethod(storedAuthMethod as 'sms' | 'web');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        sessionStorage.removeItem('afritokeni_user');
        sessionStorage.removeItem('afritokeni_auth_method');
        localStorage.removeItem('afritokeni_user');
        localStorage.removeItem('afritokeni_auth_method');
      }
    }
  }, []);

  // Subscribe to Juno authentication state for web users
  useEffect(() => {
    const unsubscribe = authSubscribe(async (junoUser: JunoUser | null) => {
      if (junoUser) {
        // For ICP users, check their role and redirect accordingly
        checkAndRedirectRef.current(junoUser);

        // Check if user already exists in our datastore with KYC information
        let afritokeniUser: User;
        
        try {
          // Try to get existing user data from our users collection using user ID as key
          const existingUserDoc = await getDoc({
            collection: 'users',
            key: junoUser.key // For web users, use ID as document key
          });
          
          if (existingUserDoc?.data) {
            // User exists, use their existing data (including KYC status)
            const userData = existingUserDoc.data as UserDataFromJuno;
            afritokeniUser = {
              ...userData,
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date()
            } as User;
          } else {
            // New web user, create profile using ID as key
            afritokeniUser = {
              id: junoUser.key,
              firstName: 'ICP',
              lastName: 'User',
              email: junoUser.key, // Use key as identifier for web users
              userType: 'user', // This will be updated based on role check
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
              kycStatus: afritokeniUser.kycStatus,
              authMethod: 'web' // Important: specify this is a web user
            });
            
            // Save new user to our datastore
            await setDoc({
              collection: 'users',
              doc: {
                key: junoUser.key,
                data: {
                  ...afritokeniUser,
                  createdAt: afritokeniUser.createdAt?.toISOString() || new Date().toISOString()
                }
              }
            });
          }
        } catch (error) {
          console.error('Error loading user data for web auth:', error);
          // Fallback to basic user if datastore fails
          afritokeniUser = {
            id: junoUser.key,
            firstName: 'ICP',
            lastName: 'User',
            email: junoUser.key,
            userType: 'user',
            isVerified: true,
            kycStatus: 'not_started',
            createdAt: new Date()
          };
        }

        setUser(afritokeniUser);
        setAuthMethod('web');
        storeUserData(afritokeniUser, 'web');
      } else {
        setUser(null);
        clearUserData();
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
        
        // Try to get existing SMS user by phone
        let existingUser: User | null = null;
        try {
          existingUser = await DataService.getUser(formattedPhone);
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
          await DataService.createUser({
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: formattedPhone, // Phone number for SMS users
            userType: newUser.userType,
            kycStatus: newUser.kycStatus,
            authMethod: 'sms' // Important: specify this is an SMS user
          });
          
          existingUser = newUser;
        }
        
        setUser(existingUser);
        setAuthMethod('sms');
        storeUserData(existingUser, 'sms');
        
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
      storeUserData(newUser, 'sms');
      
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
      clearUserData();
      
      // Force redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if signOut fails
      setUser(null);
      setAuthMethod('web');
      clearUserData();
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
    devVerificationCode: verificationState.devVerificationCode,
    // Add updateUser function for KYC completion
    updateUser: (updatedUser: User) => {
      setUser(updatedUser);
      storeUserData(updatedUser, authMethod);
    }
  };

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};


export {AuthenticationProvider, useAuthentication };

