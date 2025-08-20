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
    <div className="space-y-4">
      {/* KYC Status Alert */}
      <KYCStatusAlert />
      
      {/* Top Row - Status & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Status Control */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(agentStatus.status)}`}>
                {getStatusIcon(agentStatus.status)}
                <span className="text-sm font-medium capitalize">{agentStatus.status.replace('-', ' ')}</span>
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => updateAgentStatus('available')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  agentStatus.status === 'available' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Available
              </button>
              <button
                onClick={() => updateAgentStatus('busy')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  agentStatus.status === 'busy' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Busy
              </button>
              <button
                onClick={() => updateAgentStatus('cash-out')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  agentStatus.status === 'cash-out' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cash Out
              </button>
            </div>
          </div>
        </div>

        {/* Location Update Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="text-sm font-medium text-gray-800">Location</h3>
                <p className="text-xs text-gray-600">
                  {agentStatus.location 
                    ? `Updated ${agentStatus.lastUpdated.toLocaleTimeString()}`
                    : 'Not set'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={updateLocation}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
            >
              <Navigation className="w-3 h-3" />
              <span>Update</span>
            </button>
          </div>
        </div>
      </div>

      {/* Balance Cards & Quick Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* UGX Balance Card */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-600 text-sm font-medium">UGX Balance</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl md:text-3xl font-bold text-gray-900">
                  {showBalance ? formatCurrency(balance.digital.ugx, 'UGX') : '****'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <span className="text-xs font-semibold text-gray-700">UGX</span>
            </div>
          </div>
        </div>

        {/* USDC Balance Card */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">USDC Balance</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl md:text-3xl font-bold text-gray-900">
                  {showBalance ? formatCurrency(balance.digital.usdc, 'USDC') : '****'}
                </span>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <span className="text-xs font-semibold text-gray-700">USDC</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => navigate('/agents/deposit')}
            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <Plus className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-800">Deposit</span>
          </button>

          <button 
            onClick={() => navigate('/agents/withdraw')}
            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
              <Minus className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-800">Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Daily Earnings</p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(dailyEarnings.ugx, 'UGX')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Today&apos;s Transactions</p>
              <p className="text-lg font-bold text-gray-800">{dailyEarnings.transactionCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Active Customers</p>
              <p className="text-lg font-bold text-gray-800">1,247</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Recent Transactions</h2>
          <button onClick={() => navigate('/agents/transactions')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {transactions.slice(0, 4).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {transaction.customer.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{transaction.customer}</p>
                    <p className="text-xs text-gray-600">
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">
                    {formatCurrency(transaction.amount.ugx, 'UGX')}
                  </div>
                  <div className="text-xs">
                    <span className="text-green-600 font-medium">
                      +{formatCurrency(transaction.commission.ugx, 'UGX')}
                    </span>
                    <span className={`ml-2 ${
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
  );
};

export default AgentDashboard;
