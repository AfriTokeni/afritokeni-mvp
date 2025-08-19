import React, { useState } from 'react';
import { Eye, EyeOff, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoginFormData } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import AfriTokeniLogo from '../../components/AfriTokeniLogo';
import PageLayout from '../../components/PageLayout';

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
    <PageLayout title="Sign In" showUserMenu={false}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h2>
          <p className="text-gray-600">
            Or{' '}
            <button
              onClick={() => navigate('/auth/register')}
              className="font-medium text-black hover:text-gray-700 underline"
            >
              create a new account
            </button>
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
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
                className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'Connecting...' : 'Sign in with Internet Identity'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default LoginPage;
