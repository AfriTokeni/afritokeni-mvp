import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import { MessageSquare, Send, Phone, Loader2 } from 'lucide-react';
import { useAuthentication } from '../context/AuthenticationContext';

const SMSUI: React.FC = () => {
  const { 
    user, 
    authMethod, 
    register, 
    verifyRegistrationCode, 
    isVerifying
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
        const result = await processSMSCommand(command);
        setResponse(result);
      } else {
        // Demo mode - show example responses
        const demoResponses: { [key: string]: string } = {
          '*AFRI#': `*AFRI# - AfriTokeni Menu
1. Send Money - SEND amount phone
2. Check Balance - BAL
3. Find Agents - AGENTS
4. Withdraw Cash - WITHDRAW amount
5. Bitcoin Balance - BTC BAL
6. Bitcoin Rate - BTC RATE currency
7. Buy Bitcoin - BTC BUY amount currency
8. Sell Bitcoin - BTC SELL amount currency
9. Help - HELP`,
          'BAL': 'Your balance:\nUGX 450,000\nUSDT 118.42\n\nLast updated: Just now',
          'BTC BAL': `Bitcoin Balance:
₿0.00125000 BTC
≈ UGX 187,500

Send BTC RATE [currency] for rates
Send *AFRI# for menu`,
          'BTC RATE UGX': `Bitcoin Exchange Rate:
1 BTC = 150,000,000 UGX
1 UGX = ₿0.00000001

Updated: ${new Date().toLocaleString()}
Send BTC BUY/SELL for exchange
Send *AFRI# for menu`,
          'BTC BUY 100000 UGX': `Bitcoin Purchase Quote:
Buy: ₿0.00066667 BTC
Cost: 100,000 UGX

Fee Breakdown:
- Base fee (2.5%): UGX 2,500
- Location adj: +20%
- Total fee (3.0%): UGX 3,000

You receive: ₿0.00064667 BTC
Net cost: UGX 97,000

To confirm, reply:
CONFIRM ABC123

Quote expires in 5 minutes.`,
          'BTC SELL 50000 UGX': `Bitcoin Sale Quote:
Sell: ₿0.00033333 BTC
Value: 50,000 UGX

Fee Breakdown:
- Base fee (2.5%): UGX 1,250
- Location adj: +20%
- Total fee (3.0%): UGX 1,500

You receive: UGX 48,500
Agent will contact you for cash pickup.

To confirm, reply:
CONFIRM XYZ789

Quote expires in 5 minutes.`,
          'CONFIRM ABC123': `Bitcoin Purchase Confirmed!
Transaction ID: BTC001234
Amount: ₿0.00064667 BTC
Cost: 100,000 UGX
Fee: 3,000 UGX

An agent will contact you at +256701234567 to complete the exchange.

Send *AFRI# for menu`,
          'AGENTS': 'Nearby agents:\n1. Sarah - Kampala Central (500m)\n2. John - Nakawa Market (1.2km)\n3. Grace - Wandegeya (2.1km)\nReply with number for details',
          'SEND': 'To send money, use:\nSEND [amount] [phone]\nExample: SEND 10000 256701234567',
          '1': 'Your balance:\nUGX 450,000\nUSDT 118.42\n\nSend *AFRI# for main menu'
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
        const currentUser = user?.user;
        setResponse(`Welcome to AfriTokeni, ${currentUser?.firstName} ${currentUser?.lastName}! Registration complete. Send *AFRI# for menu.`);
      } else {
        setResponse('Invalid verification code. Please try again.');
      }
    } catch (_error) {
      setResponse('Error occurred during verification. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSMSCommand = async () => {
    if (!smsMessage.trim()) return;
    await executeCommand(smsMessage);
    setSmsMessage('');
  };

  const verifyCode = (
    <>
        <div className="space-y-4 sm:space-y-6">
            <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2 sm:mb-3">
                    Verification Code
                </label>
                <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-3 sm:py-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-base sm:text-lg"
                />
            </div> 
        </div>
        <button
            onClick={handleCodeVerification}
            disabled={!verificationCode || isVerifyingCode}
            className="w-full bg-neutral-900 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors duration-200 shadow-sm cursor-pointer text-sm sm:text-base"
        >
            <div className="flex items-center justify-center gap-2">
              {isVerifyingCode && <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
              {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
            </div>
        </button>
    </>
  )

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            SMS Banking Demo
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4">Try SMS Banking</h1>
          <p className="text-base sm:text-lg lg:text-xl text-neutral-600 leading-relaxed px-2 sm:px-0">
            Experience how AfriTokeni works on any phone with simple SMS commands.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Phone Number Input */}
            {isVerifying ? verifyCode : <>
             <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2 sm:mb-3">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256701234567"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-base sm:text-lg"
                />
              </div>
            </div>

            {/* SMS Login Button */}
            {!user.user && (
              <button
                onClick={handleSMSRegistration}
                disabled={!phoneNumber || isRegistering}
                className="w-full bg-neutral-900 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors duration-200 shadow-sm cursor-pointer text-sm sm:text-base"
              >
                <div className="flex items-center justify-center gap-2">
                  {isRegistering && <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
                  {isRegistering ? 'Sending SMS...' : 'Register/Login via SMS'}
                </div>
              </button>
            )}
            </>
               }

            {/* SMS Command Input */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2 sm:mb-3">
                SMS Command {!user && <span className="text-gray-500">(Demo Mode)</span>}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Type SMS command (e.g., BAL, *AFRI#)"
                  className="flex-1 px-3 sm:px-4 py-3 sm:py-4 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-base sm:text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSMSCommand()}
                />
                <button
                  onClick={handleSMSCommand}
                  disabled={!smsMessage.trim() || isProcessing}
                  className="bg-neutral-900 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm cursor-pointer self-center sm:self-auto"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5 mx-auto sm:mx-0" />
                </button>
              </div>
            </div>

            {/* User Info */}
            {user.user && (
              <div className="bg-neutral-50 border border-neutral-200 p-3 sm:p-4 rounded-xl">
                <p className="text-xs sm:text-sm text-neutral-700 mb-1">
                  <strong>User:</strong> {user.user.firstName} {user.user.lastName}
                </p>
                <p className="text-xs sm:text-sm text-neutral-700 mb-1">
                  <strong>Phone:</strong> {user.user.email}
                </p>
                <p className="text-xs sm:text-sm text-neutral-700">
                  <strong>Auth Method:</strong> <span className="text-neutral-900 font-semibold">{authMethod.toUpperCase()}</span>
                </p>
              </div>
            )}

            {/* SMS Response */}
            {response && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 sm:p-6">
                <h3 className="font-semibold text-neutral-900 mb-2 sm:mb-3 text-sm sm:text-base">SMS Response:</h3>
                <p className="text-neutral-800 whitespace-pre-wrap font-mono text-xs sm:text-sm bg-white p-3 rounded-lg border border-neutral-200 overflow-x-auto">{response}</p>
              </div>
            )}

            {/* Quick Commands */}
            <div className="border-t border-neutral-200 pt-4 sm:pt-6">
              <h3 className="font-semibold text-neutral-900 mb-3 sm:mb-4 text-sm sm:text-base">Quick Commands:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { cmd: '*AFRI#', desc: 'Main Menu', category: 'basic' },
                  { cmd: 'BAL', desc: 'Check Balance', category: 'basic' },
                  { cmd: 'AGENTS', desc: 'Find Agents', category: 'basic' },
                  { cmd: 'SEND 10000 256701234567', desc: 'Send Money', category: 'basic' },
                  { cmd: 'BTC BAL', desc: 'Bitcoin Balance', category: 'bitcoin' },
                  { cmd: 'BTC RATE UGX', desc: 'Bitcoin Rate', category: 'bitcoin' },
                  { cmd: 'BTC BUY 100000 UGX', desc: 'Buy Bitcoin', category: 'bitcoin' },
                  { cmd: 'BTC SELL 50000 UGX', desc: 'Sell Bitcoin', category: 'bitcoin' }
                ].map((item) => (
                  <button
                    key={item.cmd}
                    onClick={() => setSmsMessage(item.cmd)}
                    className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                      item.category === 'bitcoin' 
                        ? 'bg-orange-50 hover:bg-orange-100 border-orange-200 hover:border-orange-300' 
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className={`font-mono font-semibold text-xs sm:text-sm break-all ${
                      item.category === 'bitcoin' ? 'text-orange-900' : 'text-neutral-900'
                    }`}>
                      {item.cmd}
                    </div>
                    <div className={`text-xs mt-1 ${
                      item.category === 'bitcoin' ? 'text-orange-600' : 'text-neutral-600'
                    }`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Bitcoin Commands Info */}
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-orange-800 font-semibold text-sm">Bitcoin SMS Commands</p>
                    <p className="text-orange-700 text-xs mt-1">
                      All Bitcoin transactions show dynamic fees based on your location and service level. 
                      You'll receive a quote with fee breakdown before confirming any transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSUI;
