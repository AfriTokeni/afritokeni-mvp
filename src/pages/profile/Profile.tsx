import React, { useState, useEffect } from 'react';
import { User, Check, LogOut, Edit3, Phone, Mail, MapPin, Calendar, Shield, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { useAuthentication } from '../../context/AuthenticationContext';
import { useAfriTokeni } from '../../hooks/useAfriTokeni';
import { formatCurrencyAmount, AfricanCurrency, getActiveCurrencies } from '../../types/currency';
import { DataService } from '../../services/dataService';
import { setDoc } from '@junobuild/core';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    preferredCurrency: 'UGX' as AfricanCurrency,
    location: { country: '', city: '' }
  });
  const [saving, setSaving] = useState(false);

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
      
      const updatedUser = {
        ...currentUser,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        preferredCurrency: editForm.preferredCurrency,
        location: editForm.location
      };
      
      // Update in Juno datastore for web users
      if (authMethod === 'web') {
        await setDoc({
          collection: 'users',
          doc: {
            key: currentUser.id,
            data: updatedUser
          }
        });
      } else {
        // Update via DataService for SMS users
        await DataService.updateUser(currentUser.id, updatedUser);
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
    }
    setIsEditing(false);
    setError(null);
  };

  // Show loading state
  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="animate-pulse">
              <div className="flex flex-col items-center text-center space-y-4 mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-neutral-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 lg:h-8 bg-neutral-200 rounded w-48 mx-auto"></div>
                  <div className="h-4 lg:h-6 bg-neutral-200 rounded w-32 mx-auto"></div>
                  <div className="h-3 lg:h-5 bg-neutral-200 rounded w-36 mx-auto"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 lg:h-14 bg-neutral-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12">
              <div className="text-red-500 mb-2 text-2xl lg:text-3xl">⚠️</div>
              <h2 className="text-lg lg:text-xl font-semibold text-neutral-900 mb-2">Failed to Load Profile Data</h2>
              <p className="text-neutral-600 mb-4 text-sm lg:text-base">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 lg:px-6 lg:py-3 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-colors text-sm lg:text-base"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show main content if userData is available
  if (!userData) {
    return (
      <PageLayout>
        <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
            <div className="text-center py-8 lg:py-12">
              <div className="text-neutral-400 mb-2 text-2xl lg:text-3xl">👤</div>
              <h2 className="text-lg lg:text-xl font-semibold text-neutral-900 mb-2">No Profile Data Found</h2>
              <p className="text-neutral-600 text-sm lg:text-base">Please complete your profile setup.</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 px-2 sm:px-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900">Profile</h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8 mx-2 sm:mx-0">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4 mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-neutral-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-neutral-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">{userData.name}</h2>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
              <p className="text-neutral-600 font-mono text-sm sm:text-base lg:text-lg mb-1">{userData.phone}</p>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  {userData.isVerified ? 'Verified Account' : 'Pending Verification'}
                </span>
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {userData.authMethod === 'sms' ? '📱 SMS User' : '🌐 Web User'}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Balance Card */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Current Balance</span>
              </div>
              <p className="text-2xl font-bold font-mono text-neutral-900">
                {formatCurrencyAmount(userData.balance, userData.currency)}
              </p>
            </div>

            {/* KYC Status Card */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">KYC Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  userData.kycStatus === 'approved' ? 'bg-green-500' :
                  userData.kycStatus === 'pending' ? 'bg-yellow-500' :
                  userData.kycStatus === 'rejected' ? 'bg-red-500' : 'bg-neutral-400'
                }`}></div>
                <span className="text-sm font-medium capitalize text-neutral-900">
                  {userData.kycStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {userData.authMethod === 'sms' ? 
                  <Phone className="w-4 h-4 text-neutral-600" /> : 
                  <Mail className="w-4 h-4 text-neutral-600" />
                }
                <span className="text-sm font-medium text-neutral-700">
                  {userData.authMethod === 'sms' ? 'Phone' : 'Email'}
                </span>
              </div>
              <p className="text-sm font-mono text-neutral-900">{userData.email}</p>
            </div>

            {/* Location */}
            {userData.location && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">Location</span>
                </div>
                <p className="text-sm text-neutral-900">
                  {userData.location.city}, {userData.location.country}
                </p>
              </div>
            )}

            {/* Join Date */}
            <div className="bg-neutral-50 rounded-lg p-4 md:col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Member Since</span>
              </div>
              <p className="text-sm text-neutral-900">
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
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Edit Profile</h3>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="Enter first name"
                  />
                </div>
                
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="Enter last name"
                  />
                </div>
                
                {/* Preferred Currency */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Preferred Currency
                  </label>
                  <select
                    value={editForm.preferredCurrency}
                    onChange={(e) => setEditForm({ ...editForm, preferredCurrency: e.target.value as AfricanCurrency })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editForm.location.country}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      location: { ...editForm.location, country: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="Enter country"
                  />
                </div>
                
                {/* City */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.location.city}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      location: { ...editForm.location, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500"
                    placeholder="Enter city"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-2 sm:space-y-3">
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Account Settings</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Security & Privacy</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Transaction Limits</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-600" />
                <span className="text-sm sm:text-base text-neutral-900">Help & Support</span>
              </div>
              <span className="text-neutral-400 text-lg">→</span>
            </button>
            
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
    </PageLayout>
  );
};

export default UserProfile;