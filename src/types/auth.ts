export interface LoginFormData {
  emailOrPhone: string;
  password: string;
  userType: 'user' | 'agent';
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'user' | 'agent';
}

export interface UserKYCData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  documentType?: 'national_id' | 'passport' | 'drivers_license';
  documentNumber?: string;
  documentFile?: File;
  pin?: string;
  confirmPin?: string;
}

export interface AgentKYCData {
  // Personal Details
  firstName: string;
  lastName: string;
  phoneNumber: string;
  
  // Operating Details
  location: {
    country: string;
    state: string;
    city: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  locationDescription: string;
  operatingHours: string;
  operatingDays: string;
  
  // Personal Identification (Optional)
  documentType?: 'national_id' | 'passport' | 'drivers_license';
  documentNumber?: string;
  documentFile?: File;
  
  // Business License (Optional)
  businessLicense?: string;
  businessLicenseFile?: File;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'user' | 'agent';
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_started';
  createdAt?: Date; // Optional since Juno handles timestamps automatically
  junoUser?: any; // Juno User object
}

export interface AuthContextType {
  user: User | null;
  authMethod: 'sms' | 'web';
  login: (formData: LoginFormData, method?: 'sms' | 'web') => Promise<boolean>;
  register: (formData: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  // SMS verification methods
  verifyRegistrationCode: (code: string) => Promise<boolean>;
  cancelVerification: () => void;
  // SMS verification state
  isVerifying: boolean;
  verificationPhoneNumber: string | null;
  // Development helper
  devVerificationCode?: string;
  // User update method
  updateUser: (updatedUser: User) => void;
  // User type update method (for role selection)
  updateUserType: (newUserType: 'user' | 'agent') => void;
}

export interface LocationSuggestion {
  place_id: string;
  display_name: string;
  location: {
    country: string;
    state: string;
    city: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}
