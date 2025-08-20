import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAfriTokeni } from '../hooks/useAfriTokeni';
import { MessageSquare, Send, Phone } from 'lucide-react';

const SMSInterface: React.FC = () => {
  const { user, authMethod, login } = useAuth();
  const { processSMSCommand } = useAfriTokeni();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSMSLogin = async () => {
    if (!phoneNumber) return;
    
    const success = await login({
      emailOrPhone: phoneNumber,
      password: '', // Not used for SMS auth
      userType: 'user'
    }, 'sms');
    
    if (success) {
      setResponse(`Welcome to AfriTokeni! Send *AFRI# for menu.`);
    } else {
      setResponse(`Registration complete! Send *AFRI# for menu.`);
    }
  };

  const handleSMSCommand = async () => {
    if (!smsMessage.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await processSMSCommand(phoneNumber, smsMessage);
      setResponse(result);
      setSmsMessage('');
    } catch (error) {
      setResponse('Sorry, there was an error processing your request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Banking Demo
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Try SMS Banking</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Experience how AfriTokeni works on any phone with simple SMS commands.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256701234567"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-lg"
                />
              </div>
            </div>

            {/* SMS Login Button */}
            {!user && (
              <button
                onClick={handleSMSLogin}
                disabled={!phoneNumber}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg"
              >
                Register/Login via SMS
              </button>
            )}

            {/* SMS Command Input */}
            {user && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    SMS Command
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Type SMS command (e.g., BAL, *AFRI#)"
                      className="flex-1 px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && handleSMSCommand()}
                    />
                    <button
                      onClick={handleSMSCommand}
                      disabled={!smsMessage.trim() || isProcessing}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* User Info */}
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>User:</strong> {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Phone:</strong> {user.email}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Auth Method:</strong> <span className="text-indigo-600 font-medium">{authMethod.toUpperCase()}</span>
                  </p>
                </div>
              </>
            )}

            {/* SMS Response */}
            {response && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-semibold text-green-900 mb-3">SMS Response:</h3>
                <p className="text-green-800 whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded-lg border">{response}</p>
              </div>
            )}

            {/* Quick Commands */}
            {user && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Commands:</h3>
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
                      className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors"
                    >
                      <div className="font-mono text-indigo-600 font-medium text-sm">{item.cmd}</div>
                      <div className="text-gray-600 text-xs mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSInterface;
