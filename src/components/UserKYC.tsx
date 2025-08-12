import React, { useState } from 'react';
import { Upload, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { UserKYCData } from '../types/auth';

interface UserKYCProps {
  onSubmit: (data: UserKYCData) => void;
  isLoading?: boolean;
}

const UserKYC: React.FC<UserKYCProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<UserKYCData>({
    documentType: 'national_id',
    documentNumber: '',
    pin: '',
    confirmPin: ''
  });
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const documentTypes = [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport', label: 'International Passport' },
    { value: 'drivers_license', label: 'Driver&apos;s License' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, documentFile: file }));
      if (errors.documentFile) {
        setErrors(prev => ({ ...prev, documentFile: '' }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'Document number is required';
    }

    if (!formData.documentFile) {
      newErrors.documentFile = 'Document image is required';
    }

    if (!formData.pin) {
      newErrors.pin = 'PIN is required';
    } else if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be exactly 4 digits';
    }

    if (!formData.confirmPin) {
      newErrors.confirmPin = 'Please confirm your PIN';
    } else if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Complete Your Verification</h2>
        <p className="text-gray-600 mt-2">
          Verify your identity to start using AfriTokeni securely
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type */}
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            id="documentType"
            name="documentType"
            value={formData.documentType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Document Number */}
        <div>
          <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Document Number
          </label>
          <input
            type="text"
            id="documentNumber"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleInputChange}
            placeholder="Enter your document number"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.documentNumber ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.documentNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.documentNumber}</p>
          )}
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Image
          </label>
          <div className={`border-2 border-dashed rounded-md p-4 text-center ${
            errors.documentFile ? 'border-red-500' : 'border-gray-300'
          }`}>
            <input
              type="file"
              id="documentFile"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="documentFile" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {formData.documentFile ? formData.documentFile.name : 'Click to upload document image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
            </label>
          </div>
          {errors.documentFile && (
            <p className="mt-1 text-sm text-red-600">{errors.documentFile}</p>
          )}
        </div>

        {/* PIN Setup */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Set Transaction PIN</h3>
          
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              4-Digit PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                id="pin"
                name="pin"
                value={formData.pin}
                onChange={handleInputChange}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.pin ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.pin && (
              <p className="mt-1 text-sm text-red-600">{errors.pin}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                id="confirmPin"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleInputChange}
                placeholder="Re-enter PIN"
                maxLength={4}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPin ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPin ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPin && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPin}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Verification
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your information is encrypted and secure. We use bank-level security to protect your data.
        </p>
      </div>
    </div>
  );
};

export default UserKYC;
