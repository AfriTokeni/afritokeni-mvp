import React, { useState } from 'react';
import { 
  Search,
  Filter,
  User,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import PageLayout from '../components/PageLayout';

interface Customer {
  id: string;
  name: string;
  phone: string;
  location: string;
  joinDate: Date;
  totalTransactions: number;
  totalVolume: {
    ugx: number;
    usdc: number;
  };
  lastTransaction: Date;
  status: 'active' | 'inactive' | 'blocked';
  kycStatus: 'verified' | 'pending' | 'rejected';
}

const AgentCustomers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock customer data
  const [customers] = useState<Customer[]>([
    {
      id: 'CUST001',
      name: 'Sarah Nakamura',
      phone: '+256781234567',
      location: 'Kampala Central',
      joinDate: new Date('2024-01-15'),
      totalTransactions: 47,
      totalVolume: { ugx: 2450000, usdc: 645.23 },
      lastTransaction: new Date(Date.now() - 1000 * 60 * 30),
      status: 'active',
      kycStatus: 'verified'
    },
    {
      id: 'CUST002',
      name: 'John Mukasa',
      phone: '+256782345678',
      location: 'Nakawa Market',
      joinDate: new Date('2024-02-20'),
      totalTransactions: 23,
      totalVolume: { ugx: 1200000, usdc: 316.84 },
      lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'active',
      kycStatus: 'verified'
    },
    {
      id: 'CUST003',
      name: 'Grace Acheng',
      phone: '+256783456789',
      location: 'Wandegeya',
      joinDate: new Date('2024-01-08'),
      totalTransactions: 89,
      totalVolume: { ugx: 4750000, usdc: 1250.00 },
      lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'active',
      kycStatus: 'verified'
    },
    {
      id: 'CUST004',
      name: 'Peter Okello',
      phone: '+256784567890',
      location: 'Ntinda',
      joinDate: new Date('2024-03-10'),
      totalTransactions: 12,
      totalVolume: { ugx: 580000, usdc: 152.63 },
      lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      status: 'inactive',
      kycStatus: 'pending'
    },
    {
      id: 'CUST005',
      name: 'Mary Nakato',
      phone: '+256785678901',
      location: 'Bugolobi',
      joinDate: new Date('2024-02-28'),
      totalTransactions: 34,
      totalVolume: { ugx: 1850000, usdc: 487.37 },
      lastTransaction: new Date(Date.now() - 1000 * 60 * 60 * 6),
      status: 'active',
      kycStatus: 'verified'
    }
  ]);

  const formatCurrency = (amount: number, currency: 'UGX' | 'USDC'): string => {
    if (currency === 'UGX') {
      // Format large numbers with abbreviations
      if (amount >= 1000000000) {
        return `USh ${(amount / 1000000000).toFixed(1)}B`;
      } else if (amount >= 1000000) {
        return `USh ${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `USh ${(amount / 1000).toFixed(0)}K`;
      }
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX'
      }).format(amount);
    } else {
      // Format USDC with abbreviations
      if (amount >= 1000000000) {
        return `$${(amount / 1000000000).toFixed(1)}B`;
      } else if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Customers</h1>
            <p className="text-neutral-600 mt-1">Manage your customer relationships</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 lg:p-6">
            <div>
              <p className="text-xs lg:text-sm font-medium text-neutral-600 truncate">Total Customers</p>
              <p className="text-xl lg:text-2xl font-bold text-neutral-900 font-mono mt-1 lg:mt-2 truncate">{customers.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 lg:p-6">
            <div>
              <p className="text-xs lg:text-sm font-medium text-neutral-600 truncate">Active Customers</p>
              <p className="text-xl lg:text-2xl font-bold text-neutral-900 font-mono mt-1 lg:mt-2 truncate">
                {customers.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 lg:p-6">
            <div>
              <p className="text-xs lg:text-sm font-medium text-neutral-600 truncate">Total Volume</p>
              <p className="text-xl lg:text-2xl font-bold text-neutral-900 font-mono mt-1 lg:mt-2 truncate" title={formatCurrency(customers.reduce((sum, c) => sum + c.totalVolume.ugx, 0), 'UGX')}>
                {formatCurrency(customers.reduce((sum, c) => sum + c.totalVolume.ugx, 0), 'UGX')}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 lg:p-6">
            <div>
              <p className="text-xs lg:text-sm font-medium text-neutral-600 truncate">KYC Verified</p>
              <p className="text-xl lg:text-2xl font-bold text-neutral-900 font-mono mt-1 lg:mt-2 truncate">
                {customers.filter(c => c.kycStatus === 'verified').length}
              </p>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Customer List ({filteredCustomers.length})
            </h2>
          </div>

          <div className="p-6">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No customers found</h3>
                <p className="text-neutral-600">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-neutral-300"
                    onClick={() => console.log('Selected customer:', customer.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Customer Avatar */}
                        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-neutral-600" />
                        </div>
                        
                        {/* Customer Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-neutral-900">{customer.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{customer.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {customer.joinDate.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Stats and Status */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-neutral-900 font-mono">
                          {formatCurrency(customer.totalVolume.ugx, 'UGX')}
                        </div>
                        <div className="text-sm text-neutral-600 mb-2 font-mono">
                          ≈ {formatCurrency(customer.totalVolume.usdc, 'USDC')}
                        </div>
                        
                        {/* Transaction Count */}
                        <div className="text-xs text-neutral-500 mb-2">
                          {customer.totalTransactions} transactions • Last: {getTimeAgo(customer.lastTransaction)}
                        </div>
                        
                        {/* Status Badges */}
                        <div className="flex justify-end space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(customer.status)}`}>
                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getKycStatusColor(customer.kycStatus)}`}>
                            KYC: {customer.kycStatus.charAt(0).toUpperCase() + customer.kycStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AgentCustomers;
