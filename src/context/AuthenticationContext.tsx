import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  authSubscribe,
  signIn,
  signOut,
  getDoc,
  type User as JunoUser,
} from "@junobuild/core";
import {
  AuthContextType,
  User,
  LoginFormData,
  RegisterFormData,
} from "../types/auth";
import { useRoleBasedAuth } from "../hooks/useRoleBasedAuth";
import { DataService } from "../services/dataService";
import { nanoid } from "nanoid";
import { SMSService } from "../services/smsService";

const AuthenticationContext = createContext<AuthContextType | undefined>(
  undefined,
);

const useAuthentication = () => {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

interface IUser {
  agent: User | null;
  user: User | null;
  admin: User | null;
}

// Hybrid authentication for AfriTokeni - SMS for users without internet, ICP for web users
const AuthenticationProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser>({ agent: null, user: null, admin: null });
  const [authMethod, setAuthMethod] = useState<"sms" | "web">("web");

  // Helper function to store user data with separate keys for users and agents
  const storeUserData = (userData: User, method: "sms" | "web") => {
    const userString = JSON.stringify(userData);
    const userType = userData.userType;

    // Create separate storage keys for users and agents
    const userKey = `afritokeni_${userType}`;
    const methodKey = `afritokeni_${userType}_auth_method`;

    // Store in localStorage for persistence across sessions
    localStorage.setItem(userKey, userString);
    localStorage.setItem(methodKey, method);

    const prev_logged_user = localStorage.getItem(
      "afritokeni_current_user_type",
    );
    const parsedUser = prev_logged_user ? JSON.parse(prev_logged_user) : {};
    const obj = {
      ...parsedUser,
      [userType]: userType,
    };

    // Also store current active user info for easy retrieval
    localStorage.setItem("afritokeni_current_user_type", JSON.stringify(obj));
  };

  // Helper function to clear user data from both storages
  const clearUserData = (userType?: "user" | "agent" | "admin") => {
    // If specific user type provided, clear only that type
    if (userType) {
      const userKey = `afritokeni_${userType}`;
      const methodKey = `afritokeni_${userType}_auth_method`;

      localStorage.removeItem(userKey);
      localStorage.removeItem(methodKey);

      // Only clear current user type if it matches the one being cleared
      const currentUserType = JSON.parse(
        localStorage.getItem("afritokeni_current_user_type") || "{}",
      );
      console.log(
        "Current user type before clearing:",
        currentUserType?.[userType],
      );
      if (currentUserType?.[userType] === userType) {
        // Remove only the specific user type from the object
        const updatedCurrentUserType = { ...currentUserType };
        delete updatedCurrentUserType[userType];

        // If no user types remain, remove the key entirely and clear user creation status
        if (Object.keys(updatedCurrentUserType).length === 0) {
          localStorage.removeItem("afritokeni_current_user_type");
          localStorage.removeItem("afritokeni_user_created_status"); // Clear user creation status on complete logout
        } else {
          // Otherwise, update with the remaining user types
          localStorage.setItem(
            "afritokeni_current_user_type",
            JSON.stringify(updatedCurrentUserType),
          );
        }
      }
    } else {
      // Clear all data (for complete logout scenarios)
      ["user", "agent", "admin"].forEach((type) => {
        const userKey = `afritokeni_${type}`;
        const methodKey = `afritokeni_${type}_auth_method`;

        localStorage.removeItem(userKey);
        localStorage.removeItem(methodKey);
      });

      // Clear current user type indicators and user creation status
      localStorage.removeItem("afritokeni_current_user_type");
      localStorage.removeItem("afritokeni_user_created_status"); // Clear user creation status on complete logout
    }
  };

  // Helper function to get stored user data for specific user type
  const getStoredUserData = () => {
    // let targetUserType = userType;
    // console.log('Getting stored user data for type:', userType);

    // // If no specific user type requested, get the current active one
    // if (!targetUserType) {
    //   targetUserType = localStorage.getItem('afritokeni_current_user_type') as 'user' | 'agent';
    // }

    // // If still no user type found, try to find any existing data (prioritize user over agent)
    // if (!targetUserType) {
    //   // Check if user data exists
    //   const userExists = localStorage.getItem('afritokeni_user') && localStorage.getItem('afritokeni_user_auth_method');
    //   const agentExists = localStorage.getItem('afritokeni_agent') && localStorage.getItem('afritokeni_agent_auth_method');

    //   if (userExists) {
    //     targetUserType = 'user';
    //   } else if (agentExists) {
    //     targetUserType = 'agent';
    //   }
    // }

    const user_type_storage = localStorage.getItem(
      "afritokeni_current_user_type",
    );

    const target_user_type = user_type_storage
      ? JSON.parse(localStorage.getItem("afritokeni_current_user_type") || "{}")
      : null;
    console.log("Target user type for retrieval:", target_user_type);

    if (!target_user_type) return null;

    // if (!targetUserType) return null;

    const userKey = `afritokeni_${target_user_type["user"]}`;
    const userMethodKey = `afritokeni_${target_user_type["user"]}_auth_method`;

    const agent_user_key = `afritokeni_${target_user_type["agent"]}`;
    const agent_user_method_key = `afritokeni_${target_user_type["agent"]}_auth_method`;

    // User data
    const storedUser = JSON.parse(localStorage.getItem(userKey) || "null");
    const storedUserAuthMethod = localStorage.getItem(userMethodKey);

    // Agent user data
    const storedAgentUser = JSON.parse(
      localStorage.getItem(agent_user_key) || "null",
    );
    const storedAgentAuthMethod = localStorage.getItem(agent_user_method_key);

    if (
      (storedUser && storedUserAuthMethod) ||
      (storedAgentUser && storedAgentAuthMethod)
    ) {
      try {
        const parsedUser = storedUser as User;

        const parsedAgentUser = storedAgentUser as User;
        // Convert createdAt string back to Date if it exists
        if (parsedUser.createdAt && typeof parsedUser.createdAt === "string") {
          parsedUser.createdAt = new Date(parsedUser.createdAt);
        }

        // Convert createdAt string back to Date if it exists
        if (
          parsedAgentUser.createdAt &&
          typeof parsedAgentUser.createdAt === "string"
        ) {
          parsedAgentUser.createdAt = new Date(parsedAgentUser.createdAt);
        }

        return {
          user: { user: parsedUser, agent: parsedAgentUser },
          authMethod: storedAgentAuthMethod as "sms" | "web",
        };
      } catch (error) {
        console.error("Error parsing stored user data:", error);

        // Clear corrupted data
        localStorage.removeItem(userKey);
        localStorage.removeItem(agent_user_key);
        localStorage.removeItem(userMethodKey);
        localStorage.removeItem(agent_user_method_key);
      }
    }

    return null;
  };

  // SMS verification states

  // Load or create user from Juno authentication
  const loadOrCreateUserFromJuno = useCallback(async (junoUser: JunoUser) => {
    let afritokeniUser: User;
    try {
      // Try to load existing user profile from Juno datastore
      const userDoc = await getDoc({
        collection: "users",
        key: junoUser.key,
      });

      // Also check for existing role to determine correct userType
      let userRole: "user" | "agent" | "admin" = "user"; // default
      try {
        const roleDoc = await getDoc({
          collection: "user_roles",
          key: junoUser.key,
        });
        if (roleDoc?.data) {
          const roleData = roleDoc.data as { role: "user" | "agent" | "admin" };
          userRole = roleData.role;
        }
      } catch {
        console.log("No existing role found, defaulting to user");
      }

      console.log("existing user doc", userDoc);

      if (userDoc?.data) {
        // User exists, load their data
        const userData = userDoc.data as User;

        afritokeniUser = {
          ...userData,
          userType: userRole, // Use the role from user_roles collection
          createdAt: userData.createdAt
            ? new Date(userData.createdAt)
            : new Date(),
        } as User;
        // const stored_agent = userData.userType === 'agent' ? userData : null;
        // const stored_user = userData.userType === 'user' ? userData : null;

        if (userRole === 'admin') {
          setUser({ user: null, agent: null, admin: afritokeniUser });
        } else if (userRole === 'agent') {
          setUser({ user: null, agent: afritokeniUser, admin: null });
        } else {
          setUser({ user: afritokeniUser, agent: null, admin: null });
        }
        setAuthMethod("web");
        storeUserData(afritokeniUser, "web");
        console.log("Loaded existing user from Juno:", afritokeniUser);
      } else {
        // // New user, create profile (this would typically redirect to registration)
        // console.log("New Juno user detected, would redirect to registration");
        // // For now, we'll create a basic user profile
        // const newUser: User = {
        //   id: junoUser.key,
        //   firstName: "New",
        //   lastName: "User",
        //   email: junoUser.key + "@afritokeni.com",
        //   userType: "user",
        //   isVerified: true,
        //   kycStatus: "not_started",
        //   preferredCurrency: "UGX",
        //   location: { country: "UGX", city: "Kampala" },
        //   createdAt: new Date(),
        // };

        // // Save to Juno datastore
        // await setDoc({
        //   collection: "users",
        //   doc: {
        //     key: junoUser.key,
        //     data: newUser,
        //   },
        // });

        // setUser({ user: newUser, agent: null, admin: null });
        // setAuthMethod("web");
        // storeUserData(newUser, "web");
        // console.log("Created new user profile:", newUser);
      }
    } catch (error) {
      console.error("Error loading/creating user from Juno:", error);
    }
  }, []);  // useCallback dependency array

  // Update user currency preference
  const updateUserCurrency = (currency: string) => {
    if (user.user) {
      const updatedUser = { ...user.user, preferredCurrency: currency };
      setUser({ ...user, user: updatedUser });
      storeUserData(updatedUser, authMethod);
    } else if (user.agent) {
      const updatedAgent = { ...user.agent, preferredCurrency: currency };
      setUser({ ...user, agent: updatedAgent });
      storeUserData(updatedAgent, authMethod);
    }
  };

  const { checkAndRedirectUser, isUserCreatedSuccess } = useRoleBasedAuth();
  // Keep a ref of latest checker to avoid re-subscribing when its identity changes
  const checkAndRedirectRef = useRef(checkAndRedirectUser);
  useEffect(() => {
    checkAndRedirectRef.current = checkAndRedirectUser;
  }, [checkAndRedirectUser]);

  // Also track localStorage changes directly for more reliable state management
  const [userCreatedStatus, setUserCreatedStatus] = useState(() => 
    localStorage.getItem('afritokeni_user_created_status') || 'idle'
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const currentStatus = localStorage.getItem('afritokeni_user_created_status') || 'idle';
      setUserCreatedStatus(currentStatus);
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
     const storedData = getStoredUserData();
    if (storedData) {
      setUser({ ...storedData.user, admin: null });
      setAuthMethod(storedData.authMethod);
      console.log("Restored user from storage:", storedData.user);
    }
  }, []);

  // Initialize user from stored data and subscribe to Juno auth changes
  useEffect(() => {
    // Subscribe to Juno authentication state changes
    const unsubscribe = authSubscribe((junoUser: JunoUser | null) => {
      console.log("Juno auth state changed:", junoUser);
      if (junoUser) {
        // For ICP users, check their role and redirect accordingly
        checkAndRedirectRef.current(junoUser);
        // User is authenticated with Juno/ICP
        // Load or create user profile from Juno datastore
        loadOrCreateUserFromJuno(junoUser);
      } else {
        // User is not authenticated
        setUser({ user: null, agent: null, admin: null });
        setAuthMethod("web");
      }
    });

    return unsubscribe;
  }, [loadOrCreateUserFromJuno, isUserCreatedSuccess, userCreatedStatus]); // Re-run when user creation succeeds

  // Hybrid login - SMS for users without internet, ICP for web users
  const login = async (
    formData: LoginFormData,
    method: "sms" | "web" = "web",
  ): Promise<boolean> => {
    try {
      if (method === "web") {
        console.log("Web login initiated - using Juno/ICP Internet Identity");
        // Use Juno/ICP Internet Identity authentication for web users
        await signIn({ internet_identity: {} });
        return true;
      } else if (method === "sms") {
        // SMS-based authentication for users without internet (feature phones)
        const formattedPhone = SMSService.formatPhoneNumber(
          formData.emailOrPhone,
        );

        // Validate phone number
        if (!SMSService.isValidPhoneNumber(formattedPhone)) {
          console.error("Invalid phone number format");
          return false;
        }

        // Try to get existing SMS user by phone
        let existingUser: User | null = null;
        try {
          existingUser = await DataService.getUser(formattedPhone);
        } catch {
          console.log("User not found, will create new account");
        }

        if (!existingUser) {
          // For SMS users, auto-register with basic info if they don't exist
          const newUser: User = {
            id: nanoid(),
            firstName: "SMS User",
            lastName: formattedPhone.slice(-4), // Last 4 digits as identifier
            email: formattedPhone, // Use phone as email identifier
            userType: formData.userType,
            isVerified: true, // Will be verified via SMS
            kycStatus: "not_started",
            createdAt: new Date(),
          };

          // Send SMS verification code before creating the user
          const verificationResult = await SMSService.sendVerificationCode(
            formattedPhone,
            newUser.firstName,
          );

          if (!verificationResult.success) {
            console.error(
              "Failed to send verification SMS:",
              verificationResult.error,
            );
            return false;
          }

          // For demo purposes, we'll auto-verify and save the user
          // In production, you'd wait for the user to respond with the code
          await DataService.createUser({
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: formattedPhone, // Phone number for SMS users
            userType: newUser.userType as 'user' | 'agent',
            kycStatus: newUser.kycStatus,
            authMethod: "sms", // Important: specify this is an SMS user
          });

          existingUser = newUser;
        }
        
        // Handle admin login differently - admins use web authentication only
        if (formData.userType === 'admin') {
          // For admin login, check if user exists in database with admin role
          try {
            const adminUser = await DataService.getUser(formData.emailOrPhone);
            if (adminUser && adminUser.userType === 'admin') {
              setUser({ user: null, agent: null, admin: adminUser });
              setAuthMethod("web");
              storeUserData(adminUser, "web");
              return true;
            } else {
              console.error("Admin user not found or invalid role");
              return false;
            }
          } catch (error) {
            console.error("Admin login failed:", error);
            return false;
          }
        }
        
        const stored_agent =
          existingUser.userType == "agent" ? existingUser : null;
        const stored_user =
          existingUser.userType == "user" ? existingUser : null;
        setUser({ user: stored_user, agent: stored_agent, admin: null });
        setAuthMethod("sms");
        storeUserData(existingUser, "sms");

        return true;
      } else {
        throw new Error("Invalid authentication method");
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
    }
  };

  // SMS-based registration for users without internet
  const register = async (formData: RegisterFormData): Promise<boolean> => {
    try {
      // Step 1: Send SMS with verification code to formData.email (phone)
      const formattedPhone = SMSService.formatPhoneNumber(formData.email);

      // Validate phone number
      if (!SMSService.isValidPhoneNumber(formattedPhone)) {
        console.error("Invalid phone number format");
        return false;
      }

      // Check if user already exists
      try {
        const existingDoc = await getDoc({
          collection: "users",
          key: formattedPhone,
        });
        if (existingDoc?.data) {
          console.error("User already exists with this phone number");
          return false;
        }
      } catch {
        // User doesn't exist, continue with registration
      }

      // Send verification code
      const verificationResult = await SMSService.sendVerificationCode(
        formattedPhone,
        formData.firstName,
      );

      if (!verificationResult.success) {
        console.error(
          "Failed to send verification SMS:",
          verificationResult.error,
        );
        return false;
      }

      // Verification state would be managed here in a real implementation

      // In development mode, log the verification code for testing
      if (import.meta.env.DEV && verificationResult.verificationCode) {
        console.log(
          "🔑 [DEV] Verification code for testing:",
          verificationResult.verificationCode,
        );
      }

      console.log("Verification code sent successfully to:", formattedPhone);
      return true; // Return true to indicate SMS was sent, UI should now show verification input
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
    }
  };

  // Helper to cancel verification process

  const logout = async (userTypeToLogout?: "user" | "agent" | "admin") => {
    try {
      let targetUserType: "user" | "agent" | "admin" | undefined = userTypeToLogout;

      // If no specific user type provided, determine based on current context
      if (!targetUserType) {
        // You could add logic here to determine which user is "currently active"
        // For now, let's prioritize user over agent, or require explicit specification
        if (user.user && user.agent) {
          // Both are active - require explicit specification
          throw new Error(
            "Multiple user types active. Please specify which user type to logout.",
          );
        } else if (user.user) {
          targetUserType = "user";
        } else if (user.agent) {
          targetUserType = "agent";
        } else if (user.admin) {
          targetUserType = "admin";
        }
      }

      if (!targetUserType) {
        throw new Error("No user type to logout");
      }

      console.log("Logging out user type:", targetUserType);
      console.log("Current user state before logout:", user);
      console.log("Current auth method before logout:", authMethod);
      console.log("User to logout:", user[targetUserType]);

      if (authMethod === "web" && user[targetUserType]) {
        // Use Juno signOut for web users
        console.log("Signing out web user via Juno");
        await signOut({windowReload: false});
      }

      // Clear only the specified user type from state
      setUser((prev) => ({
        ...prev,
        [targetUserType]: null,
      }));

      // Clear storage for the specific user type
      clearUserData(targetUserType);

      // If no users remain, reset auth method and redirect
      const remainingUser = targetUserType === "user" ? (user.agent || user.admin) : 
                           targetUserType === "agent" ? (user.user || user.admin) : 
                           (user.user || user.agent);
      if (!remainingUser) {
        setAuthMethod("web");
        // Clear user creation status on complete logout (success case)
        localStorage.removeItem("afritokeni_user_created_status");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout logic here
      if (userTypeToLogout) {
        setUser((prev) => ({
          ...prev,
          [userTypeToLogout]: null,
        }));
        clearUserData(userTypeToLogout);

        const remainingUser =
          userTypeToLogout === "user" ? (user.agent || user.admin) :
          userTypeToLogout === "agent" ? (user.user || user.admin) :
          (user.user || user.agent);
        if (!remainingUser) {
          setAuthMethod("web");
          // Clear user creation status on complete logout (error case)
          localStorage.removeItem("afritokeni_user_created_status");
          window.location.href = "/";
        }
      }
    }
  };

  const value: AuthContextType = {
    user,
    authMethod,
    login,
    logout,
    register,
    updateUserCurrency,
    isAuthenticated: user.user !== null || user.agent !== null || user.admin !== null,
    verifyRegistrationCode: async () => false,
    cancelVerification: () => {},
    isVerifying: false,
    verificationPhoneNumber: null,
    updateUser: async () => {},
    updateUserType: async () => {},
  };

  return (
    <AuthenticationContext.Provider value={value}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export { AuthenticationProvider, useAuthentication };
