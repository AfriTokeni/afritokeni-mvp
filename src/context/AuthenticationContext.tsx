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
  
  // Helper function to store user data with separate keys for users and agents
  const storeUserData = (userData: User, method: 'sms' | 'web') => {
    const userString = JSON.stringify(userData);
    const userType = userData.userType;
    
    // Create separate storage keys for users and agents
    const userKey = `afritokeni_${userType}`;
    const methodKey = `afritokeni_${userType}_auth_method`;
    
    // Store in sessionStorage for tab-specific access
    sessionStorage.setItem(userKey, userString);
    sessionStorage.setItem(methodKey, method);
    // Store in localStorage for persistence across sessions
    localStorage.setItem(userKey, userString);
    localStorage.setItem(methodKey, method);
    
    // Also store current active user info for easy retrieval
    sessionStorage.setItem('afritokeni_current_user_type', userType);
    localStorage.setItem('afritokeni_current_user_type', userType);
  };

  // Helper function to clear user data from both storages
  const clearUserData = (userType?: 'user' | 'agent') => {
    // If specific user type provided, clear only that type
    if (userType) {
      const userKey = `afritokeni_${userType}`;
      const methodKey = `afritokeni_${userType}_auth_method`;
      
      sessionStorage.removeItem(userKey);
      sessionStorage.removeItem(methodKey);
      localStorage.removeItem(userKey);
      localStorage.removeItem(methodKey);
      
      // Only clear current user type if it matches the one being cleared
      const currentUserType = sessionStorage.getItem('afritokeni_current_user_type');
      if (currentUserType === userType) {
        sessionStorage.removeItem('afritokeni_current_user_type');
        localStorage.removeItem('afritokeni_current_user_type');
      }
    } else {
      // Clear all data (for complete logout scenarios)
      ['user', 'agent'].forEach(type => {
        const userKey = `afritokeni_${type}`;
        const methodKey = `afritokeni_${type}_auth_method`;
        
        sessionStorage.removeItem(userKey);
        sessionStorage.removeItem(methodKey);
        localStorage.removeItem(userKey);
        localStorage.removeItem(methodKey);
      });
      
      // Clear current user type indicators
      sessionStorage.removeItem('afritokeni_current_user_type');
      localStorage.removeItem('afritokeni_current_user_type');
    }
  };

  // Helper function to get stored user data for specific user type
  const getStoredUserData = (userType?: 'user' | 'agent') => {
    let targetUserType = userType;
    
    // If no specific user type requested, get the current active one
    if (!targetUserType) {
      targetUserType = sessionStorage.getItem('afritokeni_current_user_type') as 'user' | 'agent' ||
                      localStorage.getItem('afritokeni_current_user_type') as 'user' | 'agent';
    }
    
    // If still no user type found, try to find any existing data (prioritize user over agent)
    if (!targetUserType) {
      // Check if user data exists
      const userExists = localStorage.getItem('afritokeni_user') && localStorage.getItem('afritokeni_user_auth_method');
      const agentExists = localStorage.getItem('afritokeni_agent') && localStorage.getItem('afritokeni_agent_auth_method');
      
      if (userExists) {
        targetUserType = 'user';
      } else if (agentExists) {
        targetUserType = 'agent';
      }
    }
    
    if (!targetUserType) return null;
    
    const userKey = `afritokeni_${targetUserType}`;
    const methodKey = `afritokeni_${targetUserType}_auth_method`;
    
    // Priority: sessionStorage (tab-specific) > localStorage (global)
    let storedUser = sessionStorage.getItem(userKey);
    let storedAuthMethod = sessionStorage.getItem(methodKey);
    
    // Fallback to localStorage if sessionStorage is empty
    if (!storedUser || !storedAuthMethod) {
      storedUser = localStorage.getItem(userKey);
      storedAuthMethod = localStorage.getItem(methodKey);
      
      // If found in localStorage, copy to sessionStorage for this tab
      if (storedUser && storedAuthMethod) {
        sessionStorage.setItem(userKey, storedUser);
        sessionStorage.setItem(methodKey, storedAuthMethod);
        sessionStorage.setItem('afritokeni_current_user_type', targetUserType);
      }
    }
    
    if (storedUser && storedAuthMethod) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        // Convert createdAt string back to Date if it exists
        if (parsedUser.createdAt && typeof parsedUser.createdAt === 'string') {
          parsedUser.createdAt = new Date(parsedUser.createdAt);
        }
        return {
          user: parsedUser,
          authMethod: storedAuthMethod as 'sms' | 'web'
        };
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        sessionStorage.removeItem(userKey);
        sessionStorage.removeItem(methodKey);
        localStorage.removeItem(userKey);
        localStorage.removeItem(methodKey);
      }
    }
    
    return null;
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

  // Initialize user from stored data on app start
  useEffect(() => {
    const storedData = getStoredUserData();
    
    if (storedData) {
      setUser(storedData.user);
      setAuthMethod(storedData.authMethod);
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
          
          // Also check for existing role to determine correct userType
          let userRole: 'user' | 'agent' = 'user'; // default
          try {
            const roleDoc = await getDoc({
              collection: 'user_roles',
              key: junoUser.key
            });
            if (roleDoc?.data) {
              const roleData = roleDoc.data as { role: 'user' | 'agent' };
              userRole = roleData.role;
            }
          } catch {
            console.log('No existing role found, defaulting to user');
          }
          
          if (existingUserDoc?.data) {
            // User exists, use their existing data (including KYC status)
            const userData = existingUserDoc.data as UserDataFromJuno;
            afritokeniUser = {
              ...userData,
              userType: userRole, // Use the role from user_roles collection
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date()
            } as User;
          } else {
            // New web user, create profile using ID as key
            afritokeniUser = {
              id: junoUser.key,
              firstName: 'ICP',
              lastName: 'User',
              email: junoUser.key, // Use key as identifier for web users
              userType: userRole, // Use determined role
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
        const currentUserBeforeLogout = user;
        setUser(null);
        // When user logs out, only clear their specific user type data
        if (currentUserBeforeLogout?.userType) {
          clearUserData(currentUserBeforeLogout.userType);
        }
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is intentional - we handle user changes inside the callback

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
      
      // Clear local state for current user type only
      const currentUserType = user?.userType;
      setUser(null);
      setAuthMethod('web');
      clearUserData(currentUserType);
      
      // Force redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if signOut fails
      const currentUserType = user?.userType;
      setUser(null);
      setAuthMethod('web');
      clearUserData(currentUserType);
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
    // Add updateUser function for KYC completion and role updates
    updateUser: (updatedUser: User) => {
      // If userType is changing, clear old storage and set new
      if (user && user.userType !== updatedUser.userType) {
        clearUserData(user.userType);
      }
      setUser(updatedUser);
      storeUserData(updatedUser, authMethod);
    },
    // Add method to update userType specifically (for role selection)
    updateUserType: (newUserType: 'user' | 'agent') => {
      if (user) {
        // Clear old storage
        clearUserData(user.userType);
        // Update user with new type
        const updatedUser = { ...user, userType: newUserType };
        setUser(updatedUser);
        storeUserData(updatedUser, authMethod);
      }
    }
  };

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};


export {AuthenticationProvider, useAuthentication };

