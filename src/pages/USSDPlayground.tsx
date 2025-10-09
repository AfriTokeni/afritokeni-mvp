import React, { useState } from 'react';
import { Smartphone, Send } from 'lucide-react';
import { DataService } from '../services/dataService';

const USSDPlayground: React.FC = () => {
  const [ussdCommand, setUssdCommand] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneNumber] = useState('+256700000000'); // Demo phone number

  const handleSendCommand = async () => {
    if (!ussdCommand.trim()) return;

    setLoading(true);
    try {
      const result = await DataService.processSMSCommand(ussdCommand, phoneNumber);
      setResponse(result);
    } catch (error) {
      setResponse('Error processing USSD command. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { label: 'Main Menu', command: '*AFRI#' },
    { label: 'Check Balance', command: 'BAL' },
    { label: 'Register', command: 'REG John Doe' },
    { label: 'Send Money', command: 'SEND +256700123456 10000' },
    { label: 'ckBTC Balance', command: 'CKBTC BAL' },
    { label: 'ckUSDC Balance', command: 'USDC BAL' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            USSD Playground
          </h1>
          <p className="text-gray-600">
            Test AfriTokeni USSD commands - works on any phone, no internet needed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* USSD Interface */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              USSD Command Interface
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Demo)
              </label>
              <input
                type="text"
                value={phoneNumber}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                USSD Command
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ussdCommand}
                  onChange={(e) => setUssdCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                  placeholder="Enter USSD command (e.g., *AFRI#)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendCommand}
                  disabled={loading || !ussdCommand.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Commands
              </label>
              <div className="grid grid-cols-2 gap-2">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd.command}
                    onClick={() => setUssdCommand(cmd.command)}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
                  >
                    <div className="font-medium text-gray-900">{cmd.label}</div>
                    <div className="text-xs text-gray-500 font-mono">{cmd.command}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Response */}
            {response && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USSD Response
                </label>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Available Commands
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Main Menu</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">*AFRI#</code>
                <p className="text-sm text-gray-600 mt-1">Access the main USSD menu</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Registration</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">REG [Full Name]</code>
                <p className="text-sm text-gray-600 mt-1">Register a new account</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Balance</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">BAL</code>
                <p className="text-sm text-gray-600 mt-1">Check your balance</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Send Money</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">SEND [phone] [amount]</code>
                <p className="text-sm text-gray-600 mt-1">Send money to another user</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Withdraw</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">WITHDRAW [amount]</code>
                <p className="text-sm text-gray-600 mt-1">Withdraw cash via agent</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ckBTC Commands</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm mb-1">CKBTC BAL</code>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm mb-1">CKBTC SEND [recipient] [amount]</code>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">CKBTC DEPOSIT</code>
                <p className="text-sm text-gray-600 mt-1">Manage your ckBTC (ICP-native Bitcoin)</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">ckUSDC Commands</h3>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm mb-1">USDC BAL</code>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">USDC SEND [recipient] [amount]</code>
                <p className="text-sm text-gray-600 mt-1">Manage your ckUSDC (ICP-native stablecoin)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            How USSD Works
          </h3>
          <p className="text-blue-800 text-sm">
            USSD (Unstructured Supplementary Service Data) works on any phone without internet. 
            Simply dial <span className="font-mono font-bold">*AFRI#</span> from your phone to access 
            AfriTokeni's full banking features. All transactions are instant and secure on the ICP blockchain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default USSDPlayground;
