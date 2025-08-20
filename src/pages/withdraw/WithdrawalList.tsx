import React, { useState } from 'react';
import { Clock, User, Phone, CreditCard, Search } from 'lucide-react';
import { WithdrawalRequest } from './ProcessWithdrawal';

interface WithdrawalListProps {
  onSelectWithdrawal: (withdrawal: WithdrawalRequest) => void;
}

const WithdrawalList: React.FC<WithdrawalListProps> = ({ onSelectWithdrawal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock withdrawal requests data
  const [withdrawalRequests] = useState<WithdrawalRequest[]>([
    {
      id: 'WD001',
      userName: 'Sarah Nakamura',
      userPhone: '+256781234567',
      amount: { ugx: 150000, usdc: 39.47 },
      withdrawalCode: 'WD001234',
      requestedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      status: 'pending',
      userNationalId: 'CM12345678901234',
      location: 'Kampala Central'
    },
    {
      id: 'WD002',
      userName: 'John Mukasa',
      userPhone: '+256782345678',
      amount: { ugx: 75000, usdc: 19.74 },
      withdrawalCode: 'WD002345',
      requestedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      status: 'pending',
      userNationalId: 'CM23456789012345',
      location: 'Entebbe'
    },
    {
      id: 'WD003',
      userName: 'Grace Acheng',
      userPhone: '+256783456789',
      amount: { ugx: 300000, usdc: 78.95 },
      withdrawalCode: 'WD003456',
      requestedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      status: 'pending',
      userNationalId: 'CM34567890123456',
      location: 'Jinja'
    },
    {
      id: 'WD004',
      userName: 'Peter Kiprotich',
      userPhone: '+256784567890',
      amount: { ugx: 200000, usdc: 52.63 },
      withdrawalCode: 'WD004567',
      requestedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      status: 'pending',
      userNationalId: 'CM45678901234567',
      location: 'Mbarara'
    },
    {
      id: 'WD005',
      userName: 'Diana Namubiru',
      userPhone: '+256785678901',
      amount: { ugx: 100000, usdc: 26.32 },
      withdrawalCode: 'WD005678',
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'verified',
      userNationalId: 'CM56789012345678',
      location: 'Gulu'
    }
  ]);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDC') => {
    if (currency === 'UGX') {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const filteredRequests = withdrawalRequests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userPhone.includes(searchTerm) ||
                         request.withdrawalCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, or withdrawal code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Withdrawal Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No withdrawal requests found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Withdrawal requests will appear here when customers make requests'
              }
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              onClick={() => onSelectWithdrawal(request)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* User Avatar */}
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{request.userName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{request.userPhone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(request.requestedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-800">
                    {formatCurrency(request.amount.ugx, 'UGX')}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    ≈ {formatCurrency(request.amount.usdc, 'USDC')}
                  </div>
                  
                  {/* Withdrawal Code */}
                  <div className="text-xs text-gray-500 mb-2">
                    Code: <span className="font-mono font-medium">{request.withdrawalCode}</span>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredRequests.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Showing {filteredRequests.length} withdrawal request{filteredRequests.length !== 1 ? 's' : ''}</span>
            <span>
              Total: {formatCurrency(
                filteredRequests.reduce((sum, req) => sum + req.amount.ugx, 0), 
                'UGX'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalList;
