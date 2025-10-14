import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Send, Globe } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { CentralizedDemoService } from '../services/centralizedDemoService';

interface Message {
  type: 'sent' | 'received';
  text: string;
  timestamp: string;
}

const USSDPlayground: React.FC = () => {
  const [phoneNumber] = useState('+256 700 123 456');
  const [demoUserId] = useState('demo_ussd_user');
  const [inputCommand, setInputCommand] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [ussdStarted, setUssdStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'received',
      text: '🌍 USSD Demo Mode\n\nWelcome to AfriTokeni!\n\nDial *384*22948# to start',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Initialize demo user
  useEffect(() => {
    const init = async () => {
      await CentralizedDemoService.initializeUser(demoUserId, 'UGX');
      setIsInitialized(true);
    };
    init();
  }, [demoUserId]);

  // Auto-scroll to bottom when messages change (only scroll the messages container, not the page)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);


  const processCommand = async (cmd: string): Promise<string> => {
    const upperCmd = cmd.toUpperCase().trim();
    
    // Ensure initialization is complete
    if (!isInitialized) {
      return '⏳ Initializing... Please wait.';
    }
    
    // Get demo balance
    let balance = await CentralizedDemoService.getBalance(demoUserId);
    
    // If still null, try to initialize again
    if (!balance) {
      console.log('Balance not found, re-initializing...');
      balance = await CentralizedDemoService.initializeUser(demoUserId, 'UGX');
    }
    
    if (!balance) {
      return '❌ Error loading balance. Please try again.';
    }
    
    const transactions = await CentralizedDemoService.getTransactions(demoUserId);

    // Main menu - this starts the USSD session
    if (upperCmd === '*384*22948#') {
      setUssdStarted(true);
      return `📱 AfriTokeni Menu

Please select an option:
1. Register (New User)
2. Local Currency (UGX)
3. Bitcoin (ckBTC)
4. USDC (ckUSDC)
5. Help`;
    }

    // Force user to dial USSD code first
    if (!ussdStarted) {
      return `⚠️ Please dial *384*22948# first to start USSD service.

Click the green button or type the code.`;
    }

    // Option 1: Local Currency
    if (upperCmd === '1') {
      return `💵 Local Currency (UGX)

Please select an option:
11. Send Money
12. Check Balance
13. Deposit
14. Withdraw
15. Transactions
16. Find Agent
0. Back to Main Menu`;
    }

    // Local Currency - Check Balance (12)
    if (upperCmd === '12' || upperCmd === 'BAL') {
      return `💰 Your Balance

UGX: ${balance.digitalBalance.toLocaleString()}
ckBTC: ${(balance.ckBTCBalance / 100000000).toFixed(8)} BTC
ckUSDC: $${(balance.ckUSDCBalance / 100).toFixed(2)}

Thank you for using AfriTokeni!`;
    }

    // Option 2: Bitcoin (ckBTC)
    if (upperCmd === '2') {
      return `₿ Bitcoin (ckBTC)

Please select an option:
21. Check Balance
22. Bitcoin Rate
23. Buy Bitcoin
24. Sell Bitcoin
25. Send Bitcoin
0. Back to Main Menu`;
    }

    if (upperCmd === '21' || upperCmd === 'BTC BAL' || upperCmd === 'CKBTC BAL') {
      const btc = (balance.ckBTCBalance / 100000000).toFixed(8);
      const ugxValue = balance.ckBTCBalance * 1385; // ~138.5M UGX per BTC
      return `₿ Your ckBTC Balance

${btc} BTC
≈ UGX ${ugxValue.toLocaleString()}

Current Rate: 1 BTC = 138,500,000 UGX

Instant transfers <1 second!

Thank you for using AfriTokeni!`;
    }

    if (upperCmd === '22' || upperCmd === 'BTC RATE') {
      return `₿ Bitcoin Exchange Rate

1 BTC = 138,500,000 UGX
1 UGX = 0.00000000722 BTC

Last Updated: ${new Date().toLocaleTimeString()}

Thank you for using AfriTokeni!`;
    }

    // Buy Bitcoin (23)
    if (upperCmd === '23') {
      return `₿ Buy Bitcoin

Enter UGX amount to spend:
Example: 100000

Agent will provide Bitcoin at current rate.

Thank you for using AfriTokeni!`;
    }

    // Sell Bitcoin (24)
    if (upperCmd === '24') {
      return `₿ Sell Bitcoin

Enter Bitcoin amount to sell (satoshis):
Example: 50000

Agent will pay you UGX at current rate.

Thank you for using AfriTokeni!`;
    }

    // Send Bitcoin (25)
    if (upperCmd === '25') {
      return `₿ Send Bitcoin

To: Principal ID or Phone
Amount: 10000 satoshis
Fee: <$0.01
Time: <1 second

Reply YES to confirm

Thank you for using AfriTokeni!`;
    }

    // Option 3: USDC (ckUSDC)
    if (upperCmd === '3') {
      return `💵 USDC (ckUSDC)

Please select an option:
31. Check Balance
32. USDC Rate
33. Buy USDC
34. Sell USDC
35. Send USDC
0. Back to Main Menu`;
    }

    if (upperCmd === '31' || upperCmd === 'USDC BAL') {
      const usdc = (balance.ckUSDCBalance / 100).toFixed(2);
      const ugxValue = balance.ckUSDCBalance * 37.5; // 1 USD = 3750 UGX
      return `💵 Your ckUSDC Balance

$${usdc} USDC
≈ UGX ${ugxValue.toLocaleString()}

Current Rate: 1 USDC = 3,750 UGX

Stable value guaranteed!

Thank you for using AfriTokeni!`;
    }

    if (upperCmd === '32' || upperCmd === 'USDC RATE') {
      return `💵 USDC Exchange Rate

1 USDC = 3,750 UGX
1 UGX = $0.000267 USDC

Last Updated: ${new Date().toLocaleTimeString()}

Thank you for using AfriTokeni!`;
    }

    // Buy USDC (33)
    if (upperCmd === '33') {
      return `💵 Buy USDC

Enter UGX amount to spend:
Example: 100000

Agent will provide USDC at current rate.

Thank you for using AfriTokeni!`;
    }

    // Sell USDC (34)
    if (upperCmd === '34') {
      return `💵 Sell USDC

Enter USDC amount to sell:
Example: 50

Agent will pay you UGX at current rate.

Thank you for using AfriTokeni!`;
    }

    // Send USDC (35)
    if (upperCmd === '35') {
      return `💵 Send USDC

To: Principal ID or Phone
Amount: $10.00 USDC
Fee: <$0.01
Time: <1 second

Reply YES to confirm

Thank you for using AfriTokeni!`;
    }

    // Option 4: Help
    if (upperCmd === '4' || upperCmd === 'HELP') {
      return `📖 AfriTokeni Help

Local Currency: Send, deposit, withdraw UGX
Bitcoin: Buy, sell, send ckBTC
USDC: Buy, sell, send USDC stablecoin

For support: Call +256-700-AFRI (2374)
Visit: afritokeni.com

Thank you for using AfriTokeni!`;
    }

    // Back to Main Menu (0)
    if (upperCmd === '0') {
      return `📱 AfriTokeni Menu

Please select an option:
1. Local Currency (UGX)
2. Bitcoin (ckBTC)
3. USDC (ckUSDC)
4. Help`;
    }

    // Transaction history
    if (upperCmd === 'HISTORY') {
      const recent = transactions.slice(0, 3);
      let history = '📊 Recent Transactions\n\n';
      recent.forEach((tx, i) => {
        history += `${i + 1}. ${tx.type} UGX ${tx.amount.toLocaleString()}\n   ${new Date(tx.createdAt).toLocaleDateString()}\n`;
      });
      return history + '\nThank you for using AfriTokeni!';
    }

    // Find Agent (Option 16)
    if (upperCmd === '16' || upperCmd === 'AGENTS') {
      return `📍 Find Agent

Available agents near you:

1. Kampala Central - 2.3km
   ⭐ 4.8 (23 reviews)
   Services: Deposit, Withdraw, Bitcoin

2. Nakawa Market - 4.1km
   ⭐ 4.5 (15 reviews)
   Services: Deposit, Withdraw

3. City Center - 5.8km
   ⭐ 4.9 (45 reviews)
   Services: All services

Reply with number for details.

Thank you for using AfriTokeni!`;
    }

    // Transaction History (Option 15)
    if (upperCmd === '15' || upperCmd === 'HISTORY') {
      const recent = transactions.slice(0, 3);
      let history = '📊 Transaction History\n\n';
      recent.forEach((tx, i) => {
        history += `${i + 1}. ${tx.type} UGX ${tx.amount.toLocaleString()}\n   ${new Date(tx.createdAt).toLocaleDateString()}\n`;
      });
      return history + '\nReply with number for details.\n\nThank you for using AfriTokeni!';
    }

    // Withdraw (Option 14)
    if (upperCmd === '14' || upperCmd.startsWith('WITHDRAW')) {
      return `💵 Cash Withdrawal

Amount: UGX 50,000
Nearest agent: 2.3 km away
Fee: 3% (UGX 1,500)

Code: WD-${Math.random().toString(36).substr(2, 6).toUpperCase()}

Show this code to the agent to collect cash.

Thank you for using AfriTokeni!`;
    }

    // Send money (Option 11)
    if (upperCmd === '11' || upperCmd.startsWith('SEND')) {
      return `✅ Money Transfer

To: +256 700 XXX XXX
Amount: UGX 10,000
Fee: UGX 0 (free!)

Reply YES to confirm

Thank you for using AfriTokeni!`;
    }

    // Deposit (Option 13)
    if (upperCmd === '13' || upperCmd.startsWith('DEPOSIT')) {
      return `💰 Deposit Money

Find nearest agent to deposit cash.

Agent: Kampala Central - 2.3km
Fee: 0% (free!)

Show this code to agent:
DEP-${Math.random().toString(36).substr(2, 6).toUpperCase()}

Thank you for using AfriTokeni!`;
    }

    // Default
    return `❓ Unknown command.

Type HELP for commands or *384*22948# for main menu.

Thank you for using AfriTokeni!`;
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
    setTimeout(async () => {
      const response = await processCommand(inputCommand);
      const receivedMessage: Message = {
        type: 'received',
        text: response,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, receivedMessage]);
    }, 500);

    setInputCommand('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-10 lg:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                🌍 Demo Mode - Works Worldwide
              </div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                🇺🇬 Real USSD: Uganda Only
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Try USSD Banking
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience how AfriTokeni works on any phone - no internet required. Try the commands below!
            </p>
            <div className="mt-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 max-w-2xl mx-auto">
              <h3 className="font-bold text-red-900 mb-2 text-sm sm:text-base">🇺🇬 REAL USSD: UGANDA ONLY</h3>
              <p className="text-xs sm:text-sm text-red-800 mb-2">
                <strong>Uganda:</strong> Dial <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">*284*78909#</code> for real USSD!
              </p>
              <p className="text-xs text-red-700">
                <strong>Other countries:</strong> Coming soon! Use playground to test.
              </p>
            </div>
          </div>

          {/* Phone Simulator - Centered */}
          <div className="max-w-sm sm:max-w-md mx-auto">
            <div className="bg-black rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden p-2 sm:p-3">
                {/* Phone Notch */}
                <div className="bg-gray-900 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="bg-gray-900 px-4 sm:px-6 py-2 flex items-center justify-between text-white text-xs">
                    <span>9:21</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-2 sm:w-4 sm:h-3 border border-white rounded-sm"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                      <div className="flex gap-0.5">
                        <div className="w-0.5 h-2 sm:h-3 bg-white"></div>
                        <div className="w-0.5 h-2 sm:h-3 bg-white"></div>
                        <div className="w-0.5 h-2 sm:h-3 bg-white"></div>
                        <div className="w-0.5 h-2 sm:h-3 bg-white"></div>
                      </div>
                    </div>
                  </div>
                  {/* USSD Header */}
                  <div className="bg-gray-800 text-white px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-semibold text-xs sm:text-sm">*384*22948#</span>
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:inline">{phoneNumber}</span>
                  </div>

                  {/* Messages */}
                  <div ref={messagesContainerRef} className="h-[400px] sm:h-[500px] lg:h-[600px] overflow-y-auto bg-gray-50 p-3 sm:p-4 space-y-3 sm:space-y-4 scroll-smooth">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[280px] sm:max-w-xs ${msg.type === 'sent' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm`}>
                          <p className="text-xs sm:text-sm whitespace-pre-line">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.type === 'sent' ? 'text-blue-200' : 'text-gray-500'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
                    {/* Quick Start Button */}
                    <button
                      onClick={() => {
                        setInputCommand('*384*22948#');
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="w-full mb-2 sm:mb-3 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                      Dial *384*22948#
                    </button>
                    
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        inputMode="tel"
                        value={inputCommand}
                        onChange={(e) => setInputCommand(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type USSD command..."
                        className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

          </div>

          {/* CTA Section */}
                    <div className="mt-8 sm:mt-10 lg:mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 sm:p-8 lg:p-12 text-center text-white">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Ready to Start Banking?</h2>
            <p className="text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 opacity-90">
              Experience the future of mobile banking with instant, fee-free transfers
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/bitcoin-exchange"
                className="bg-white text-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-neutral-100 transition-colors"
              >
                Start Banking Now
              </Link>
              <Link
                to="/become-agent"
                className="bg-white text-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-neutral-100 transition-colors"
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

export default USSDPlayground;
