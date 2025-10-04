import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Send, ArrowLeft, Zap, CheckCircle } from 'lucide-react';

interface Message {
  type: 'sent' | 'received';
  text: string;
  timestamp: string;
}

const SMSPlayground: React.FC = () => {
  const [phoneNumber] = useState('+256 700 123 456');
  const [inputCommand, setInputCommand] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'received',
      text: 'Welcome to AfriTokeni! 🎉\n\nSend *AFRI# to get started or HELP for commands.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const smsCommands = [
    { cmd: '*AFRI#', desc: 'Main menu (USSD)', category: 'Basic' },
    { cmd: 'BAL', desc: 'Check balance', category: 'Basic' },
    { cmd: 'SEND +256... 10000', desc: 'Send money', category: 'Transfers' },
    { cmd: 'BTC BAL', desc: 'Bitcoin balance', category: 'Bitcoin' },
    { cmd: 'BTC RATE', desc: 'BTC exchange rate', category: 'Bitcoin' },
    { cmd: 'BTC BUY 50000', desc: 'Buy Bitcoin', category: 'Bitcoin' },
    { cmd: 'WITHDRAW 50000', desc: 'Cash withdrawal', category: 'Cash' },
    { cmd: 'AGENTS', desc: 'Find nearby agents', category: 'Agents' },
    { cmd: 'HISTORY', desc: 'Transaction history', category: 'Basic' },
    { cmd: 'HELP', desc: 'Show all commands', category: 'Basic' }
  ];

  const processCommand = (cmd: string): string => {
    const upperCmd = cmd.toUpperCase().trim();
    
    if (upperCmd === 'BAL' || upperCmd === 'BALANCE') {
      return `💰 Your Balance:\n\nUGX: 125,000\nBTC: 0.00234\n\nSend SEND to transfer money`;
    }
    
    if (upperCmd === 'BTC BAL') {
      return `₿ Bitcoin Balance:\n\n0.00234 BTC\n≈ UGX 325,000\n\nRate: 1 BTC = 138,500,000 UGX`;
    }
    
    if (upperCmd === 'BTC RATE') {
      return `₿ Current Rate:\n\n1 BTC = 138,500,000 UGX\n1 USD = 3,750 UGX\n\nSend BTC BUY [amount] to buy`;
    }
    
    if (upperCmd.startsWith('BTC BUY')) {
      const amount = upperCmd.split(' ')[2] || '50000';
      return `✅ Bitcoin Purchase:\n\nAmount: UGX ${amount}\nBTC: ~0.00036\nFee: 3% (UGX 1,500)\n\nReply YES to confirm`;
    }
    
    if (upperCmd.startsWith('SEND')) {
      return `✅ Money Transfer:\n\nTo: +256 700 XXX XXX\nAmount: UGX 10,000\nFee: UGX 0 (free!)\n\nReply YES to confirm`;
    }
    
    if (upperCmd === 'WITHDRAW') {
      return `💵 Cash Withdrawal:\n\nAmount: UGX 50,000\nNearest agent: 2.3 km away\nFee: 3% (UGX 1,500)\n\nReply YES to get code`;
    }
    
    if (upperCmd === 'AGENTS') {
      return `📍 Nearby Agents:\n\n1. Kampala Shop - 2.3km\n2. Main Street - 4.1km\n3. City Center - 5.8km\n\nSend number for details`;
    }
    
    if (upperCmd === 'HISTORY') {
      return `📊 Recent Transactions:\n\n1. Sent UGX 5,000 - Today\n2. Received UGX 10,000 - Yesterday\n3. BTC Buy - 2 days ago\n\nSend number for details`;
    }
    
    if (upperCmd === '*AFRI#' || upperCmd === 'AFRI') {
      return `📱 AfriTokeni Menu:\n\n1. Check Balance\n2. Send Money\n3. Bitcoin\n4. Cash Out\n5. Agents\n6. History\n\nReply with number`;
    }
    
    if (upperCmd === 'HELP') {
      return `📖 SMS Commands:\n\nBAL - Check balance\nSEND - Transfer money\nBTC BAL - Bitcoin balance\nBTC BUY - Buy Bitcoin\nWITHDRAW - Cash out\nAGENTS - Find agents\n*AFRI# - Main menu`;
    }
    
    return `❓ Unknown command.\n\nSend HELP for available commands or *AFRI# for menu.`;
  };

  const handleSendMessage = () => {
    if (!inputCommand.trim()) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Add sent message
    const sentMessage: Message = {
      type: 'sent',
      text: inputCommand,
      timestamp
    };

    setMessages(prev => [...prev, sentMessage]);

    // Simulate response delay
    setTimeout(() => {
      const response = processCommand(inputCommand);
      const receivedMessage: Message = {
        type: 'received',
        text: response,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, receivedMessage]);
    }, 500);

    setInputCommand('');
  };

  const quickCommands = ['BAL', 'BTC BAL', 'BTC RATE', '*AFRI#', 'HELP'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/afriTokeni.svg" alt="AfriTokeni" className="h-5 w-auto" />
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Smartphone className="w-4 h-4" />
            Interactive SMS Demo
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Try SMS Banking
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience how AfriTokeni works on any phone - no internet required. Try the commands below!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Phone Simulator */}
          <div>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-900 max-w-sm mx-auto">
              {/* Phone Header */}
              <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-semibold">22948</span>
                </div>
                <span className="text-sm text-gray-400">{phoneNumber}</span>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto bg-gray-50 p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs ${msg.type === 'sent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} rounded-2xl px-4 py-3 shadow-sm`}>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.type === 'sent' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCommand}
                    onChange={(e) => setInputCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type SMS command..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="mt-6 max-w-sm mx-auto">
              <p className="text-sm font-semibold text-gray-700 mb-3">Quick Commands:</p>
              <div className="flex flex-wrap gap-2">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setInputCommand(cmd);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-mono transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Commands Reference */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">SMS Commands</h2>
              
              {['Basic', 'Transfers', 'Bitcoin', 'Cash', 'Agents'].map((category) => (
                <div key={category} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">{category}</h3>
                  <div className="space-y-3">
                    {smsCommands
                      .filter(cmd => cmd.category === category)
                      .map((cmd, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => setInputCommand(cmd.cmd)}>
                          <code className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {cmd.cmd}
                          </code>
                          <p className="text-sm text-gray-600 flex-1">{cmd.desc}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Why SMS Banking?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Works Offline</p>
                    <p className="text-sm text-gray-600">No internet or smartphone needed</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Instant Transfers</p>
                    <p className="text-sm text-gray-600">Lightning Network under 1 second</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Any Phone</p>
                    <p className="text-sm text-gray-600">Feature phones, smartphones, anything</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Start Banking Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SMSPlayground;
