import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Send } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

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
      <PublicHeader />
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
          {/* Hero */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="inline-flex items-center gap-1 sm:gap-2 bg-blue-50 text-blue-700 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3 md:mb-4">
            <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Interactive SMS Demo</span>
            <span className="xs:hidden">SMS Demo</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 px-2">
            Try SMS Banking
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2 sm:px-0">
            Experience how AfriTokeni works on any phone - no internet required. Try the commands below!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Phone Simulator */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden border-4 sm:border-8 border-gray-900 max-w-xs sm:max-w-sm mx-auto">
              {/* Phone Header */}
              <div className="bg-gray-900 text-white px-3 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Smartphone className="w-3 h-3 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-sm sm:text-base">22948</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-400 truncate ml-2">{phoneNumber}</span>
              </div>

              {/* Messages */}
              <div className="h-80 sm:h-96 overflow-y-auto bg-gray-50 p-2 sm:p-4 space-y-2 sm:space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-xs ${msg.type === 'sent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} rounded-xl sm:rounded-2xl px-2 sm:px-4 py-2 sm:py-3 shadow-sm`}>
                      <p className="text-xs sm:text-sm whitespace-pre-line break-words">{msg.text}</p>
                      <p className={`text-[10px] sm:text-xs mt-1 ${msg.type === 'sent' ? 'text-blue-200' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-2 sm:p-4">
                <div className="flex gap-1 sm:gap-2">
                  <input
                    type="text"
                    value={inputCommand}
                    onChange={(e) => setInputCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type SMS command..."
                    className="flex-1 px-2 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="mt-4 sm:mt-6 max-w-xs sm:max-w-sm mx-auto">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 text-center">Quick Commands:</p>
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                {quickCommands.map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setInputCommand(cmd);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-md sm:rounded-lg font-mono transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Commands Reference */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-6 border border-gray-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 text-center lg:text-left">SMS Commands</h2>
              
              {['Basic', 'Transfers', 'Bitcoin', 'Cash', 'Agents'].map((category) => (
                <div key={category} className="mb-4 sm:mb-5 md:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase mb-2 sm:mb-3 tracking-wide">{category}</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {smsCommands
                      .filter(cmd => cmd.category === category)
                      .map((cmd, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => setInputCommand(cmd.cmd)}>
                          <code className="font-mono text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit break-all">
                            {cmd.cmd}
                          </code>
                          <p className="text-xs sm:text-sm text-gray-600 flex-1">{cmd.desc}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section - Identical to Bitcoin Exchange */}
        <div className="mt-6 sm:mt-8 md:mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-12 text-center text-white">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 md:mb-4">Ready to Try SMS Banking?</h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-5 md:mb-6 opacity-90">
            Join thousands using AfriTokeni on any phone - no internet required
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link
              to="/"
              className="bg-white text-blue-600 px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-md sm:rounded-lg font-medium hover:bg-neutral-100 transition-colors text-sm sm:text-base"
            >
              Start Banking Now
            </Link>
            <Link
              to="/become-agent"
              className="bg-white text-blue-600 px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-md sm:rounded-lg font-medium hover:bg-neutral-100 transition-colors text-sm sm:text-base"
            >
              Become an Agent
            </Link>
          </div>
        </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
};

export default SMSPlayground;
