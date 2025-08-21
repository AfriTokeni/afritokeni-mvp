import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  MapPin, 
  Clock,
  User,
  CheckCircle,
  XCircle,
  Navigation,
  Eye,
  EyeOff,
  Plus,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KYCStatusAlert from '../components/KYCStatusAlert';
import PageLayout from '../components/PageLayout';

interface AgentStatus {
  status: 'available' | 'busy' | 'cash-out';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  lastUpdated: Date;
}

interface Transaction {
  id: string;
  customer: string;
  customerPhone: string;
  type: 'deposit' | 'withdrawal' | 'send-money';
  amount: {
    ugx: number;
    usdc: number;
  };
  commission: {
    ugx: number;
    usdc: number;
  };
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
}

interface AgentBalance {
  cash: {
    ugx: number;
    usdc: number;
  };
  digital: {
    ugx: number;
    usdc: number;
  };
}

const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    status: 'available',
    lastUpdated: new Date()
  });
  
  const [balance] = useState<AgentBalance>({
    cash: { ugx: 2450000, usdc: 500 },
    digital: { ugx: 1250000, usdc: 328.75 }
  });
  
  const [dailyEarnings] = useState({
    ugx: 45000,
    usdc: 12.50,
    transactionCount: 23
  });
  
  const [transactions] = useState<Transaction[]>([
    {
      id: 'TXN001',
      customer: 'John Kamau',
      customerPhone: '+256701234567',
      type: 'withdrawal',
      amount: { ugx: 100000, usdc: 26.32 },
      commission: { ugx: 2000, usdc: 0.53 },
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
      id: 'TXN002',
      customer: 'Mary Nakato',
      customerPhone: '+256702345678',
      type: 'deposit',
      amount: { ugx: 75000, usdc: 19.74 },
      commission: { ugx: 1500, usdc: 0.39 },
      status: 'completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 45)
    },
    {
      id: 'TXN003',
      customer: 'Peter Okello',
      customerPhone: '+256703456789',
      type: 'send-money',
      amount: { ugx: 200000, usdc: 52.63 },
      commission: { ugx: 3000, usdc: 0.79 },
      status: 'pending',
      timestamp: new Date(Date.now() - 1000 * 60 * 120)
    }
  ]);
  
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDC'): string => {
    if (currency === 'UGX') {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  };

  const updateAgentStatus = (newStatus: AgentStatus['status']) => {
    setAgentStatus(prev => ({
      ...prev,
      status: newStatus,
      lastUpdated: new Date()
    }));
  };

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Mock reverse geocoding - in real app, use a geocoding service
      const mockAddress = `Kampala, Uganda (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      
      setAgentStatus(prev => ({
        ...prev,
        location: { latitude, longitude, address: mockAddress },
        lastUpdated: new Date()
      }));
      
      // Here you would send the coordinates to your backend
      console.log('Sending location to backend:', { latitude, longitude });
      
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please check your browser permissions.');
    }
  };

  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cash-out': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Clock className="w-4 h-4" />;
      case 'cash-out': return <XCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* KYC Status Alert */}
        <KYCStatusAlert />
      
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Agent Dashboard</h1>
          <p className="text-neutral-600 mt-1">Manage your agent operations and track earnings</p>
        </div>

        {/* Top Row - Status & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Status Control */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-neutral-700">Status:</span>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(agentStatus.status)}`}>
                  {getStatusIcon(agentStatus.status)}
                  <span className="text-sm font-semibold capitalize">{agentStatus.status.replace('-', ' ')}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateAgentStatus('available')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                    agentStatus.status === 'available' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Available
                </button>
                <button
                  onClick={() => updateAgentStatus('busy')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                    agentStatus.status === 'busy' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Busy
                </button>
                <button
                  onClick={() => updateAgentStatus('cash-out')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                    agentStatus.status === 'cash-out' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Cash Out
                </button>
              </div>
            </div>
          </div>

          {/* Location Update Section */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <MapPin className="w-6 h-6 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Location</h3>
                  <p className="text-xs text-neutral-600 mt-1">
                    {agentStatus.location 
                      ? `Updated ${agentStatus.lastUpdated.toLocaleTimeString()}`
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={updateLocation}
                className="flex items-center space-x-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                <Navigation className="w-4 h-4" />
                <span>Update</span>
              </button>
            </div>
          </div>
        </div>

        {/* Balance Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* UGX Balance Card */}
          <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-neutral-600 text-sm font-semibold">UGX Balance</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-2xl md:text-3xl font-bold text-neutral-900 font-mono">
                    {showBalance ? `USh ${balance.digital.ugx.toLocaleString()}` : '••••••••'}
                  </span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-neutral-100 p-2 rounded-lg">
                <span className="text-xs font-bold text-neutral-700">UGX</span>
              </div>
            </div>
          </div>

          {/* USDC Balance Card */}
          <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-neutral-600 text-sm font-semibold">USDC Balance</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-2xl md:text-3xl font-bold text-neutral-900 font-mono">
                    {showBalance ? `$${balance.digital.usdc.toFixed(2)}` : '••••••'}
                  </span>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-neutral-100 p-2 rounded-lg">
                <span className="text-xs font-bold text-neutral-700">USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/agents/deposit')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <Plus className="w-6 h-6 text-neutral-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 block text-center">Deposit</span>
          </button>

          <button 
            onClick={() => navigate('/agents/withdraw')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <Minus className="w-6 h-6 text-neutral-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 block text-center">Withdrawal</span>
          </button>

          <button 
            onClick={() => navigate('/agents/customers')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <Users className="w-6 h-6 text-neutral-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 block text-center">Customers</span>
          </button>

          <button 
            onClick={() => navigate('/agents/settings')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
              <CreditCard className="w-6 h-6 text-neutral-600" />
            </div>
            <span className="text-sm font-semibold text-neutral-900 block text-center">Settings</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
                <TrendingUp className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-600">Daily Earnings</p>
                <p className="text-xl font-bold text-neutral-900 font-mono mt-1">
                  {formatCurrency(dailyEarnings.ugx, 'UGX')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
                <CreditCard className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-600">Today's Transactions</p>
                <p className="text-xl font-bold text-neutral-900 font-mono mt-1">{dailyEarnings.transactionCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-50 group-hover:border-blue-100 border border-transparent transition-all duration-200">
                <Users className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-600">Active Customers</p>
                <p className="text-xl font-bold text-neutral-900 font-mono mt-1">1,247</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Recent Transactions</h2>
            <button onClick={() => navigate('/agents/transactions')} className="text-neutral-600 hover:text-neutral-900 text-sm font-semibold transition-colors duration-200">
              View All
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {transactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-neutral-600">
                        {transaction.customer.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{transaction.customer}</p>
                      <p className="text-xs text-neutral-600 font-medium mt-1">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-neutral-900 font-mono">
                      {formatCurrency(transaction.amount.ugx, 'UGX')}
                    </div>
                    <div className="text-xs mt-1">
                      <span className="text-green-600 font-bold font-mono">
                        +{formatCurrency(transaction.commission.ugx, 'UGX')}
                      </span>
                      <span className={`ml-2 font-semibold ${
                        transaction.status === 'completed' ? 'text-green-600' : 
                        transaction.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AgentDashboard;
