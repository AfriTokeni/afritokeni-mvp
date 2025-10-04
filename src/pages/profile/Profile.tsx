import React, { useState, useEffect } from 'react';
import { User, Edit3, Save, ChevronDown, ChevronUp, Check, CreditCard, Shield, Phone, Mail, Calendar, HelpCircle, MessageCircle, LogOut, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { formatCurrencyAmount, AfricanCurrency, getActiveCurrencies } from '../../types/currency';
import { DataService } from '../../services/dataService';
import { NotificationService } from '../../services/notificationService';

interface UserData {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  currency: AfricanCurrency;
  isVerified: boolean;
  kycStatus: string;
  joinDate: Date;
  authMethod: 'sms' | 'web';
  location?: {
    country: string;
    city: string;
  };
}

const UserProfile: React.FC = () => {
  const { logout, user, authMethod } = useAuthentication();
  const { balance } = useAfriTokeni();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    preferredCurrency: 'UGX' as AfricanCurrency,
    location: { country: '', city: '' }
  });

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    accountSettings: false,
    securityPrivacy: false,
    transactionLimits: false,
    helpSupport: false
  });

  // Account settings form state
  const [accountForm, setAccountForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: ''
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    // Load saved profile image from localStorage
    if (user.user?.id) {
      const savedImage = localStorage.getItem(`profile-image-${user.user.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [user.user?.id]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from auth context (either regular user or agent)
        const currentUser = user.user || user.agent;
        if (!currentUser) {
          setError('No user found. Please log in.');
          return;
        }

        // Determine phone number based on auth method
        let phoneNumber = 'N/A';
        if (authMethod === 'sms') {
          // For SMS users, email field contains the phone number
          phoneNumber = currentUser.email;
        } else {
          // For web users, check if email looks like a phone number
          phoneNumber = currentUser.email.startsWith('+') ? currentUser.email : 'N/A';
        }

        // Get user's preferred currency or default to UGX
        const userCurrency = (currentUser.preferredCurrency as AfricanCurrency) || 'UGX';
        
        // Combine user data with balance data
        const combinedUserData: UserData = {
          id: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          phone: phoneNumber,
          email: authMethod === 'web' ? currentUser.email : phoneNumber,
          balance: balance?.balance || 0,
          currency: userCurrency,
          isVerified: currentUser.isVerified && currentUser.kycStatus === 'approved',
          kycStatus: currentUser.kycStatus || 'pending',
          joinDate: currentUser.createdAt || new Date(),
          authMethod: authMethod,
          location: currentUser.location
        };

        setUserData(combinedUserData);
        
        // Initialize edit form with current data
        setEditForm({
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          preferredCurrency: userCurrency,
          location: currentUser.location || { country: '', city: '' }
        });

        // Initialize account form with current user data
        setAccountForm({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: (currentUser as any).phone || '',
          country: currentUser.location?.country || '',
          city: currentUser.location?.city || ''
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user.user, user.agent, balance, authMethod]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  const handleSaveProfile = async () => {
    if (!userData) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const currentUser = user.user || user.agent;
      if (!currentUser) throw new Error('No user found');
      
      const updatedUserData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        preferredCurrency: editForm.preferredCurrency,
        location: editForm.location
      };
      
      // Update in Juno datastore using DataService
      const success = await DataService.updateUser(currentUser.id, updatedUserData, authMethod);
      
      if (!success) {
        throw new Error('Failed to update user profile');
      }
      
      // Send profile update notification
      try {
        const currentUser = user.user || user.agent;
        if (currentUser) {
          await NotificationService.sendNotification(currentUser, {
            userId: currentUser.id,
            type: 'deposit', // Using deposit type as closest match for account updates
            amount: 0,
            currency: editForm.preferredCurrency,
            transactionId: `profile-${Date.now()}`,
            message: `Profile updated successfully. Name: ${editForm.firstName} ${editForm.lastName}, Currency: ${editForm.preferredCurrency}`
          });
        }
      } catch (notificationError) {
        console.error('Failed to send profile update notification:', notificationError);
      }

      // Update local state
      setUserData({
        ...userData,
        name: `${editForm.firstName} ${editForm.lastName}`,
        currency: editForm.preferredCurrency,
        location: editForm.location
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!userData) return;
    
    const currentUser = user.user || user.agent;
    if (currentUser) {
      setEditForm({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        preferredCurrency: (currentUser.preferredCurrency as AfricanCurrency) || 'UGX',
        location: currentUser.location || { country: '', city: '' }
      });
      // Initialize account form with current user data
      setAccountForm({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phone: (currentUser as any).phone || '',
        country: currentUser.location?.country || '',
        city: currentUser.location?.city || ''
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAccountSave = async () => {
    setSavingAccount(true);
    setError(null);
    setAccountSuccess(null);

    try {
      // Basic validation
      if (!accountForm.email.trim()) {
        throw new Error('Email address is required');
      }
      
      if (accountForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (accountForm.phone && !/^\+?[\d\s\-\(\)]+$/.test(accountForm.phone)) {
        throw new Error('Please enter a valid phone number');
      }

      const currentUser = user.user || user.agent;
      if (!currentUser) throw new Error('No user found');

      const updatedData = {
        firstName: accountForm.firstName.trim(),
        lastName: accountForm.lastName.trim(),
        email: accountForm.email.trim(),
        phone: accountForm.phone.trim(),
        location: {
          country: accountForm.country.trim(),
          city: accountForm.city.trim()
        }
      };

      const success = await DataService.updateUser(currentUser.id, updatedData, authMethod);

      if (!success) {
        throw new Error('Failed to update account settings');
      }

      setAccountSuccess('Account settings updated successfully!');
      setTimeout(() => setAccountSuccess(null), 3000);

      // Update the displayed user data immediately
      setUserData(prev => prev ? {
        ...prev,
        name: `${updatedData.firstName} ${updatedData.lastName}`,
        email: updatedData.email,
        location: updatedData.location
      } : null);

    } catch (err: any) {
      console.error('Error updating account settings:', err);
      setError(err.message || 'Failed to update account settings');
    } finally {
      setSavingAccount(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="animate-pulse">
              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 lg:h-8 bg-gray-200 rounded w-48 mx-auto"></div>
                  <div className="h-4 lg:h-6 bg-gray-200 rounded w-32 mx-auto"></div>
                  <div className="h-3 lg:h-5 bg-gray-200 rounded w-36 mx-auto"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 lg:h-14 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12">
              <div className="text-red-500 mb-2 text-2xl lg:text-3xl">⚠️</div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile Data</h2>
              <p className="text-gray-600 mb-4 text-sm lg:text-base">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 lg:px-6 lg:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main content if userData is available
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12">
              <div className="text-gray-400 mb-2 text-2xl lg:text-3xl">👤</div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">No Profile Data Found</h2>
              <p className="text-gray-600 text-sm lg:text-base">Please complete your profile setup.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user.user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    // Convert image to base64 data URL (avoids ad-blocker issues)
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      console.log('Image loaded, base64 length:', base64String?.length);
      
      if (base64String) {
        setProfileImage(base64String);
        
        // Save to localStorage for persistence
        if (user.user?.id) {
          localStorage.setItem(`profile-image-${user.user.id}`, base64String);
          console.log('Image saved to localStorage');
        }
      }
      
      setUploadingImage(false);
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Failed to read image file');
      setUploadingImage(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {userData.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{userData.name}</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg mb-1">
                {userData.location ? `${userData.location.city}, ${userData.location.country}` : 'Location not set'}
              </p>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {userData.isVerified ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Verified Account</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-yellow-600">Pending Verification</span>
                  </>
                )}
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {userData.authMethod === 'sms' ? '📱 SMS User' : '🌐 Web User'}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Balance Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Current Balance</span>
              </div>
              <p className="text-2xl font-bold font-mono text-gray-900">
                {formatCurrencyAmount(userData.balance, userData.currency)}
              </p>
            </div>

            {/* KYC Status Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">KYC Status</span>
                </div>
                {(userData.kycStatus === 'not_started' || userData.kycStatus === 'rejected') && (
                  <button
                    onClick={() => navigate('/auth/user-kyc')}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {userData.kycStatus === 'rejected' ? 'Retry KYC' : 'Start KYC'}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  userData.kycStatus === 'approved' ? 'bg-green-500' :
                  userData.kycStatus === 'pending' ? 'bg-yellow-500' :
                  userData.kycStatus === 'rejected' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium capitalize text-gray-900">
                  {userData.kycStatus.replace('_', ' ')}
                </span>
              </div>
              {userData.kycStatus === 'not_started' && (
                <p className="text-xs text-gray-500 mt-1">
                  Complete KYC verification to unlock full features
                </p>
              )}
              {userData.kycStatus === 'pending' && (
                <p className="text-xs text-yellow-600 mt-1">
                  Your documents are being reviewed (24-48 hours)
                </p>
              )}
              {userData.kycStatus === 'rejected' && (
                <p className="text-xs text-red-600 mt-1">
                  KYC was rejected. Please submit new documents.
                </p>
              )}
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {userData.authMethod === 'sms' ? 
                  <Phone className="w-4 h-4 text-gray-600" /> : 
                  <Mail className="w-4 h-4 text-gray-600" />
                }
                <span className="text-sm font-medium text-gray-700">
                  {userData.authMethod === 'sms' ? 'Phone' : 'Email'}
                </span>
              </div>
              <p className="text-sm font-mono text-gray-900">{userData.email}</p>
            </div>

            {/* Member Since */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Member Since</span>
              </div>
              <p className="text-sm text-gray-900">
                {userData.joinDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter first name"
                  />
                </div>
                
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter last name"
                  />
                </div>
                
                {/* Preferred Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Currency
                  </label>
                  <select
                    value={editForm.preferredCurrency}
                    onChange={(e) => setEditForm({ ...editForm, preferredCurrency: e.target.value as AfricanCurrency })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    {getActiveCurrencies().map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editForm.location.country}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      location: { ...editForm.location, country: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter country"
                  />
                </div>
                
                {/* City */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.location.city}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      location: { ...editForm.location, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Enter city"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Expandable Menu Sections */}
          <div className="space-y-2 sm:space-y-3">
            {/* Account Settings */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('accountSettings')}
                className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                  <span className="text-sm sm:text-base text-gray-900">Account Settings</span>
                </div>
                {expandedSections.accountSettings ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>
              
              {expandedSections.accountSettings && (
                <div className="px-3 pb-4 sm:px-4 sm:pb-4 lg:px-5 lg:pb-4 border-t border-gray-200">
                  <div className="pt-4 space-y-4">
                    {/* Success Message */}
                    {accountSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <p className="text-sm text-green-600">{accountSuccess}</p>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={accountForm.firstName}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={accountForm.lastName}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={accountForm.email}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={accountForm.phone}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={accountForm.country}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="Enter country"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={accountForm.city}
                          onChange={(e) => setAccountForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleAccountSave}
                      disabled={savingAccount}
                      className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {savingAccount ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Account Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Security & Privacy */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('securityPrivacy')}
                className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                  <span className="text-sm sm:text-base text-gray-900">Security & Privacy</span>
                </div>
                {expandedSections.securityPrivacy ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>
              
              {expandedSections.securityPrivacy && (
                <div className="px-3 pb-4 sm:px-4 sm:pb-4 lg:px-5 lg:pb-4 border-t border-gray-200">
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add extra security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Receive transaction alerts via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                      </label>
                    </div>
                    <button className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                      Change {authMethod === 'sms' ? 'PIN' : 'Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Limits */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('transactionLimits')}
                className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                  <span className="text-sm sm:text-base text-gray-900">Transaction Limits</span>
                </div>
                {expandedSections.transactionLimits ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>
              
              {expandedSections.transactionLimits && (
                <div className="px-3 pb-4 sm:px-4 sm:pb-4 lg:px-5 lg:pb-4 border-t border-gray-200">
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Daily Limits</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Send:</span>
                            <span className="font-medium">{formatCurrencyAmount(500000, userData?.currency || 'UGX')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Withdraw:</span>
                            <span className="font-medium">{formatCurrencyAmount(300000, userData?.currency || 'UGX')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bitcoin:</span>
                            <span className="font-medium">0.01 BTC</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Monthly Limits</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Send:</span>
                            <span className="font-medium">{formatCurrencyAmount(10000000, userData?.currency || 'UGX')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Withdraw:</span>
                            <span className="font-medium">{formatCurrencyAmount(5000000, userData?.currency || 'UGX')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bitcoin:</span>
                            <span className="font-medium">0.1 BTC</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Per Transaction</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Send:</span>
                            <span className="font-medium">{formatCurrencyAmount(100000, userData?.currency || 'UGX')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Withdraw:</span>
                            <span className="font-medium">{formatCurrencyAmount(50000, userData?.currency || 'UGX')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bitcoin:</span>
                            <span className="font-medium">0.005 BTC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        {userData?.isVerified ? 'Verified Account - Full Limits' : 'Complete KYC verification to increase limits'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help & Support */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleSection('helpSupport')}
                className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                  <span className="text-sm sm:text-base text-gray-900">Help & Support</span>
                </div>
                {expandedSections.helpSupport ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>
              
              {expandedSections.helpSupport && (
                <div className="px-3 pb-4 sm:px-4 sm:pb-4 lg:px-5 lg:pb-4 border-t border-gray-200">
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <a href="tel:+256700123456" className="bg-white p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-gray-900">Phone Support</h4>
                        </div>
                        <p className="text-sm text-gray-600">+256 700 123 456</p>
                      </a>
                      <a href="sms:6789?body=HELP" className="bg-white p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageCircle className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-gray-900">SMS Support</h4>
                        </div>
                        <p className="text-sm text-gray-600">Send 'HELP' to 6789</p>
                      </a>
                      <a href="mailto:support@afritokeni.com" className="bg-white p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2 mb-2">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-gray-900">Email Support</h4>
                        </div>
                        <p className="text-sm text-gray-600">support@afritokeni.com</p>
                      </a>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="font-medium text-red-900 mb-2">Emergency Support</h4>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <a href="tel:+256700123456" className="inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                          <Phone className="w-3 h-3 mr-1" />
                          Call Emergency
                        </a>
                        <a href="sms:6789?body=EMERGENCY" className="inline-flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 border border-red-300 rounded text-sm hover:bg-red-200 transition-colors">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          SMS Emergency
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Logout Button - Only visible on mobile */}
            <button 
              onClick={handleLogout}
              className="md:hidden w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-red-50 rounded-lg hover:bg-red-100 border border-red-200 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                <span className="text-sm sm:text-base text-red-700">Logout</span>
              </div>
              <span className="text-red-400 text-lg">→</span>
            </button>
          </div>
        </div>
    </div>
  );
};

export default UserProfile;