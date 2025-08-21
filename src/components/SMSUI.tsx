import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import { MessageSquare, Send, Phone, Loader2 } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';

const SMSUI: React.FC = () => {
  const { 
    user, 
    authMethod, 
    login, 
    register, 
    verifyRegistrationCode, 
    cancelVerification,
    isVerifying,
    isLoading 
  } = useAuthentication();
  const { processSMSCommand } = useAfriTokeni();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationCode, setVerificationCode] = useState('')
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Auto-run command if passed from landing page
  useEffect(() => {
    const state = location.state as { command?: string };
    if (state?.command) {
      setSmsMessage(state.command);
      // Auto-execute the command after a brief delay
      setTimeout(() => {
        if (state.command) {
          executeCommand(state.command);
        }
      }, 500);
    }
  }, [location.state]);

  const executeCommand = async (command: string) => {
    setIsProcessing(true);
    try {
      if (user) {
        // Authenticated user - use real SMS processing
        const result = await processSMSCommand(phoneNumber, command);
        setResponse(result);
      } else {
        // Demo mode - show example responses
        const demoResponses: { [key: string]: string } = {
          '*AFRI#': 'Welcome to AfriTokeni!\n1. Check Balance\n2. Send Money\n3. Find Agents\n4. Transaction History\nReply with number',
          'BAL': 'Your balance:\nUGX 450,000\nUSDC 118.42\n\nLast updated: Just now',
          'AGENTS': 'Nearby agents:\n1. Sarah - Kampala Central (500m)\n2. John - Nakawa Market (1.2km)\n3. Grace - Wandegeya (2.1km)\nReply with number for details',
          'SEND': 'To send money, use:\nSEND [amount] [phone]\nExample: SEND 10000 256701234567',
          '1': 'Your balance:\nUGX 450,000\nUSDC 118.42\n\nSend *AFRI# for main menu'
        };
        
        const cmd = command.toUpperCase();
        let response = demoResponses[cmd];
        
        if (!response) {
          if (cmd.startsWith('SEND ')) {
            response = 'Demo: Money sent successfully!\nTransaction ID: TXN123456\nFee: UGX 500\nNew balance: UGX 439,500';
          } else {
            response = 'Command not recognized. Send *AFRI# for menu.';
          }
        }
        
        setResponse(response);
      }
    } catch (error) {
      setResponse('Sorry, there was an error processing your request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSMSRegistration = async () => {
    if (!phoneNumber) {
      setResponse('Please fill in all required fields.');
      return;
    }
    
    setIsRegistering(true);
    try {
      const success = await register({
        firstName:'SMS',
        lastName:'USER',
        email: phoneNumber, // phone number as email
        password: '', // Not used for SMS auth
        confirmPassword: '', // Not used for SMS auth
        userType:'user'
      });
      
      if (success) {
        setResponse(`Verification code sent to ${phoneNumber}. Please enter the code below.`);
      } else {
        setResponse('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      setResponse('Error occurred during registration. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCodeVerification = async () => {
    if (!verificationCode) {
      setResponse('Please enter the verification code.');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const success = await verifyRegistrationCode(verificationCode);
      
      if (success) {
        setResponse(`Welcome to AfriTokeni, ${user?.firstName}! Registration complete. Send *AFRI# for menu.`);
      } else {
        setResponse('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setResponse('Error occurred during verification. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSMSLogin = async () => {
    if (!phoneNumber) return;
    
    const success = await login({
      emailOrPhone: phoneNumber,
      password: '', // Not used for SMS auth
      userType: 'user'
    }, 'sms');
    
    if (success) {
      setResponse(`Welcome back to AfriTokeni! Send *AFRI# for menu.`);
    } else {
      setResponse(`Login failed. Please try registration instead.`);
    }
  };

  const resetRegistration = () => {
    setVerificationCode('');
    setResponse('');
    cancelVerification();
  };

  const handleSMSCommand = async () => {
    if (!smsMessage.trim()) return;
    await executeCommand(smsMessage);
    setSmsMessage('');
  };

  const verifyCode = (
    <>
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                    Verification Code
                </label>
                <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-lg"
                />
            </div> 
        </div>
        <button
            onClick={handleCodeVerification}
            disabled={!verificationCode || isVerifyingCode}
            className="w-full bg-neutral-900 text-white py-4 px-6 rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors duration-200 shadow-sm cursor-pointer"
        >
            <div className="flex items-center justify-center gap-2">
              {isVerifyingCode && <Loader2 className="h-5 w-5 animate-spin" />}
              {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
            </div>
        </button>
    </>
  )

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-sm font-semibold mb-6">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Banking Demo
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Try SMS Banking</h1>
          <p className="text-xl text-neutral-600 leading-relaxed">
            Experience how AfriTokeni works on any phone with simple SMS commands.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <div className="space-y-6">
            {/* Phone Number Input */}
            {isVerifying ? verifyCode : <>
             <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-3">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256701234567"
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-lg"
                />
              </div>
            </div>

            {/* SMS Login Button */}
            {!user && (
              <button
                onClick={handleSMSRegistration}
                disabled={!phoneNumber || isRegistering}
                className="w-full bg-neutral-900 text-white py-4 px-6 rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors duration-200 shadow-sm cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  {isRegistering && <Loader2 className="h-5 w-5 animate-spin" />}
                  {isRegistering ? 'Sending SMS...' : 'Register/Login via SMS'}
                </div>
              </button>
            )}
            </>
               }

            {/* SMS Command Input */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-3">
                SMS Command {!user && <span className="text-gray-500">(Demo Mode)</span>}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Type SMS command (e.g., BAL, *AFRI#)"
                  className="flex-1 px-4 py-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSMSCommand()}
                />
                <button
                  onClick={handleSMSCommand}
                  disabled={!smsMessage.trim() || isProcessing}
                  className="bg-neutral-900 text-white px-6 py-4 rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm cursor-pointer"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl">
                <p className="text-sm text-neutral-700 mb-1">
                  <strong>User:</strong> {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-neutral-700 mb-1">
                  <strong>Phone:</strong> {user.email}
                </p>
                <p className="text-sm text-neutral-700">
                  <strong>Auth Method:</strong> <span className="text-neutral-900 font-semibold">{authMethod.toUpperCase()}</span>
                </p>
              </div>
            )}

            {/* SMS Response */}
            {response && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                <h3 className="font-semibold text-neutral-900 mb-3">SMS Response:</h3>
                <p className="text-neutral-800 whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded-lg border border-neutral-200">{response}</p>
              </div>
            )}

            {/* Quick Commands */}
            <div className="border-t border-neutral-200 pt-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Quick Commands:</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { cmd: '*AFRI#', desc: 'Main Menu' },
                  { cmd: 'BAL', desc: 'Check Balance' },
                  { cmd: 'AGENTS', desc: 'Find Agents' },
                  { cmd: 'SEND 10000 256701234567', desc: 'Send Money' }
                ].map((item) => (
                  <button
                    key={item.cmd}
                    onClick={() => setSmsMessage(item.cmd)}
                    className="text-left p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
                  >
                    <div className="font-mono text-neutral-900 font-semibold text-sm">{item.cmd}</div>
                    <div className="text-neutral-600 text-xs mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSUI;
