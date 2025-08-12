import React, { useState } from 'react';
import { Upload, CheckCircle, Building } from 'lucide-react';
import { AgentKYCData, LocationSuggestion } from '../types/auth';
import LocationSearch from './LocationSearch';

interface AgentKYCProps {
  onSubmit: (data: AgentKYCData) => void;
  isLoading?: boolean;
}

const AgentKYC: React.FC<AgentKYCProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<AgentKYCData>({
    documentType: 'national_id',
    documentNumber: '',
    businessLicense: '',
    location: {
      country: '',
      state: '',
      city: '',
      address: ''
    },
    locationDescription: ''
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const documentTypes = [
    { value: 'national_id', label: 'National ID Card' },
    { value: 'passport', label: 'International Passport' },
    { value: 'drivers_license', label: 'Driver&apos;s License' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, address: value }
    }));
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, documentFile: file }));
      if (errors.documentFile) {
        setErrors(prev => ({ ...prev, documentFile: '' }));
      }
    }
  };

  const handleBusinessLicenseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, businessLicenseFile: file }));
      if (errors.businessLicenseFile) {
        setErrors(prev => ({ ...prev, businessLicenseFile: '' }));
      }
    }
  };

  const handleLocationSelect = (location: LocationSuggestion | null) => {
    setSelectedLocation(location);
    if (location) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          country: location.address.country || '',
          state: location.address.state || '',
          city: location.address.city || '',
          coordinates: {
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lon)
          }
        }
      }));
      if (errors.location) {
        setErrors(prev => ({ ...prev, location: '' }));
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

    if (!formData.businessLicense.trim()) {
      newErrors.businessLicense = 'Business license number is required';
    }

    if (!formData.businessLicenseFile) {
      newErrors.businessLicenseFile = 'Business license document is required';
    }

    if (!selectedLocation) {
      newErrors.location = 'Please select your location';
    }

    if (!formData.location.address.trim()) {
      newErrors.address = 'Street address is required';
    }

    if (!formData.locationDescription.trim()) {
      newErrors.locationDescription = 'Location description is required';
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
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Agent Verification</h2>
        <p className="text-gray-600 mt-2">
          Complete your agent verification to start serving customers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Document Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Identification</h3>
          
          {/* Document Type */}
          <div className="mb-4">
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              id="documentType"
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Document Number */}
          <div className="mb-4">
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
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
                onChange={handleDocumentFileChange}
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
        </div>

        {/* Business License Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business License</h3>
          
          {/* Business License Number */}
          <div className="mb-4">
            <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-700 mb-2">
              Business License Number
            </label>
            <input
              type="text"
              id="businessLicense"
              name="businessLicense"
              value={formData.businessLicense}
              onChange={handleInputChange}
              placeholder="Enter business license number"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.businessLicense ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.businessLicense && (
              <p className="mt-1 text-sm text-red-600">{errors.businessLicense}</p>
            )}
          </div>

          {/* Business License Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business License Document
            </label>
            <div className={`border-2 border-dashed rounded-md p-4 text-center ${
              errors.businessLicenseFile ? 'border-red-500' : 'border-gray-300'
            }`}>
              <input
                type="file"
                id="businessLicenseFile"
                accept="image/*,application/pdf"
                onChange={handleBusinessLicenseFileChange}
                className="hidden"
              />
              <label htmlFor="businessLicenseFile" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {formData.businessLicenseFile ? formData.businessLicenseFile.name : 'Click to upload business license'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
              </label>
            </div>
            {errors.businessLicenseFile && (
              <p className="mt-1 text-sm text-red-600">{errors.businessLicenseFile}</p>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Operating Location</h3>
          
          {/* Location Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City/Town
            </label>
            <LocationSearch
              value={selectedLocation}
              onChange={handleLocationSelect}
              placeholder="Search for your city or town..."
              required
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Street Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.location.address}
              onChange={handleAddressChange}
              placeholder="Enter your street address"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Location Description */}
          <div>
            <label htmlFor="locationDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Location Description
            </label>
            <textarea
              id="locationDescription"
              name="locationDescription"
              value={formData.locationDescription}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe your location (e.g., 'Near the market', 'Next to the bank', etc.)"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.locationDescription ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.locationDescription && (
              <p className="mt-1 text-sm text-red-600">{errors.locationDescription}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Agent Verification
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Your information is encrypted and secure. We verify all agents to ensure customer safety.
        </p>
      </div>
    </div>
  );
};

export default AgentKYC;
