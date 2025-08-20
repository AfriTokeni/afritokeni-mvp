import React, { useState } from 'react';
import { Eye, EyeOff, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoginFormData } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import AfriTokeniLogo from '../../components/AfriTokeniLogo';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrPhone: '',
    password: '',
    userType: 'user'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleUserTypeChange = (type: 'user' | 'agent') => {
    setFormData(prev => ({
      ...prev,
      userType: type
    }));
    setError('');
  };

  const handleICPLogin = async () => {
    try {
      const success = await login({} as LoginFormData, 'web');
      if (success) {
        // Redirect to user dashboard after successful ICP authentication
        navigate('/users/dashboard');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleICPLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <AfriTokeniLogo size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button
            onClick={() => navigate('/auth/register')}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* User Type Selection */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => handleUserTypeChange('user')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.userType === 'user'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>User</span>
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('agent')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.userType === 'agent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Agent</span>
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700">
                Email or Phone Number
              </label>
              <div className="mt-1">
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="text"
                  autoComplete="email"
                  required
                  value={formData.emailOrPhone}
                  onChange={handleInputChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your email or phone number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleICPLogin}
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? 'Connecting to Internet Identity...' : '🔐 Sign in with Internet Identity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
