import React, { useState } from 'react';
import { 
  Calculator, 
  MapPin, 
  Clock, 
  Zap, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Users,
  Shield,
  CheckCircle,
  Bitcoin,
  Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DynamicFeeCalculator from '../components/DynamicFeeCalculator';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const TariffPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'calculator' | 'examples'>('overview');

  const locationTypes = [
    {
      type: 'Urban Areas',
      description: 'Cities and towns with good infrastructure',
      feeRange: '2.5-4%',
      color: 'green',
      icon: '🏢',
      features: ['Quick access', 'Multiple agents', 'Good connectivity', 'Standard rates']
    },
    {
      type: 'Suburban Areas',
      description: 'Outskirts of cities, moderate accessibility',
      feeRange: '3-5%',
      color: 'blue',
      icon: '🏘️',
      features: ['Moderate travel', 'Good infrastructure', 'Regular service', 'Fair pricing']
    },
    {
      type: 'Rural Areas',
      description: 'Villages with basic infrastructure',
      feeRange: '4-7%',
      color: 'yellow',
      icon: '🌾',
      features: ['Some travel required', 'Fewer agents', 'Basic infrastructure', 'Higher compensation']
    },
    {
      type: 'Remote Villages',
      description: 'Hard-to-reach areas with limited access',
      feeRange: '7-12%',
      color: 'red',
      icon: '🏔️',
      features: ['Significant travel', 'Limited agents', 'Challenging access', 'Premium compensation']
    }
  ];

  const serviceTypes = [
    {
      name: 'Standard Service',
      multiplier: '1x',
      description: 'Regular processing within business hours',
      timeframe: '2-4 hours',
      color: 'green'
    },
    {
      name: 'Express Service',
      multiplier: '+30%',
      description: 'Priority processing for urgent needs',
      timeframe: '30-60 minutes',
      color: 'yellow'
    },
    {
      name: 'Emergency Service',
      multiplier: '+80%',
      description: 'Immediate processing for critical situations',
      timeframe: '15-30 minutes',
      color: 'red'
    }
  ];

  const timeFactors = [
    { name: 'Business Hours', time: '8 AM - 6 PM', multiplier: '1x', color: 'green' },
    { name: 'Evening', time: '6 PM - 10 PM', multiplier: '+20%', color: 'yellow' },
    { name: 'Night', time: '10 PM - 6 AM', multiplier: '+40%', color: 'red' },
    { name: 'Weekend', time: 'Saturday & Sunday', multiplier: '+15%', color: 'blue' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'text-neutral-700 bg-neutral-50 border-neutral-200',
      blue: 'text-neutral-700 bg-neutral-50 border-neutral-200',
      yellow: 'text-neutral-700 bg-neutral-50 border-neutral-200',
      red: 'text-neutral-700 bg-neutral-50 border-neutral-200'
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Calculator className="w-8 h-8 text-neutral-900" />
            <h1 className="text-4xl font-bold text-neutral-900">Smart Pricing System</h1>
          </div>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Our dynamic fee structure ensures fair compensation for agents while providing transparent, 
            location-based pricing for Bitcoin exchanges across Africa.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-neutral-100 p-1 rounded-lg flex">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'calculator', label: 'Calculator', icon: Calculator },
              { id: 'examples', label: 'Examples', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`px-6 py-3 rounded-md font-semibold transition-colors duration-200 flex items-center space-x-2 ${
                  activeSection === id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-12">
            {/* Key Benefits */}
            <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-xl">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">Why Smart Pricing?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Fair Compensation</h3>
                  <p className="text-neutral-600">Agents traveling to remote areas receive higher fees for their extra effort and costs.</p>
                </div>
                <div className="text-center">
                  <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Better Coverage</h3>
                  <p className="text-neutral-600">Incentivizes agents to serve underbanked communities in remote villages.</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Transparent Pricing</h3>
                  <p className="text-neutral-600">Clear, predictable fees based on distance, location, and service level.</p>
                </div>
              </div>
            </div>

            {/* Location-Based Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center space-x-2">
                <MapPin className="w-6 h-6 text-neutral-700" />
                <span>Location-Based Pricing</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {locationTypes.map((location, index) => (
                  <div key={index} className={`border p-6 rounded-xl ${getColorClasses(location.color)}`}>
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{location.icon}</div>
                      <h3 className="text-lg font-bold">{location.type}</h3>
                      <p className="text-sm opacity-75 mb-3">{location.description}</p>
                      <div className="text-2xl font-bold">{location.feeRange}</div>
                      <div className="text-sm opacity-75">commission</div>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {location.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Level Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center space-x-2">
                <Zap className="w-6 h-6 text-neutral-700" />
                <span>Service Level Pricing</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {serviceTypes.map((service, index) => (
                  <div key={index} className={`border p-6 rounded-xl ${getColorClasses(service.color)}`}>
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-2">{service.name}</h3>
                      <div className="text-2xl font-bold mb-2">{service.multiplier}</div>
                      <p className="text-sm opacity-75 mb-3">{service.description}</p>
                      <div className="text-sm font-semibold">Processing: {service.timeframe}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time-Based Adjustments */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center space-x-2">
                <Clock className="w-6 h-6 text-neutral-700" />
                <span>Time-Based Adjustments</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {timeFactors.map((factor, index) => (
                  <div key={index} className={`border p-4 rounded-lg ${getColorClasses(factor.color)}`}>
                    <div className="text-center">
                      <h4 className="font-semibold mb-1">{factor.name}</h4>
                      <p className="text-sm opacity-75 mb-2">{factor.time}</p>
                      <div className="text-lg font-bold">{factor.multiplier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-xl">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">1</div>
                  <h3 className="font-semibold mb-2">Base Fee</h3>
                  <p className="text-sm text-neutral-600">Platform starts with 1.5% base fee</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-neutral-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">2</div>
                  <h3 className="font-semibold mb-2">Distance</h3>
                  <p className="text-sm text-neutral-600">Add 0.5-5% based on kilometers</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-neutral-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">3</div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-sm text-neutral-600">Apply accessibility multiplier</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-neutral-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">4</div>
                  <h3 className="font-semibold mb-2">Adjustments</h3>
                  <p className="text-sm text-neutral-600">Add time and urgency factors</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Section */}
        {activeSection === 'calculator' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Fee Calculator</h2>
              <p className="text-neutral-600">
                Use this calculator to estimate fees for different transaction scenarios.
              </p>
            </div>
            <DynamicFeeCalculator />
          </div>
        )}

        {/* Examples Section */}
        {activeSection === 'examples' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Real-World Examples</h2>
              <p className="text-neutral-600">
                See how our smart pricing works in different scenarios across Africa.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Example 1: Urban Quick */}
              <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-700 text-white rounded-full flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Urban Quick</h3>
                    <p className="text-neutral-600 text-sm">Kampala City Center</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Transaction:</span>
                    <span className="font-semibold">UGX 100,000 → Bitcoin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Distance:</span>
                    <span className="font-semibold">3km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Service:</span>
                    <span className="font-semibold">Quick</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time:</span>
                    <span className="font-semibold">Business hours</span>
                  </div>
                  <hr className="border-neutral-200" />
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total Fee:</span>
                    <span>2.8% (UGX 2,800)</span>
                  </div>
                </div>
              </div>

              {/* Example 2: Rural Express */}
              <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-600 text-white rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Rural Express</h3>
                    <p className="text-neutral-600 text-sm">Gulu District</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Transaction:</span>
                    <span className="font-semibold">UGX 200,000 → Bitcoin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Distance:</span>
                    <span className="font-semibold">25km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Service:</span>
                    <span className="font-semibold">Express</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time:</span>
                    <span className="font-semibold">Weekend</span>
                  </div>
                  <hr className="border-neutral-200" />
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total Fee:</span>
                    <span>6.2% (UGX 12,400)</span>
                  </div>
                </div>
              </div>

              {/* Example 3: Remote Emergency */}
              <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-500 text-white rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Remote Emergency</h3>
                    <p className="text-neutral-600 text-sm">Mountain Village, Karamoja</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Transaction:</span>
                    <span className="font-semibold">UGX 50,000 → Bitcoin</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Distance:</span>
                    <span className="font-semibold">80km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Service:</span>
                    <span className="font-semibold">Emergency</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time:</span>
                    <span className="font-semibold">Night</span>
                  </div>
                  <hr className="border-neutral-200" />
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total Fee:</span>
                    <span>11.8% (UGX 5,900)</span>
                  </div>
                </div>
              </div>

              {/* Example 4: Suburban Standard */}
              <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-neutral-400 text-white rounded-full flex items-center justify-center">
                    <Bitcoin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Suburban Standard</h3>
                    <p className="text-neutral-600 text-sm">Entebbe Outskirts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Transaction:</span>
                    <span className="font-semibold">Bitcoin → UGX 150,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Distance:</span>
                    <span className="font-semibold">12km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Service:</span>
                    <span className="font-semibold">Standard</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time:</span>
                    <span className="font-semibold">Evening</span>
                  </div>
                  <hr className="border-neutral-200" />
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total Fee:</span>
                    <span>4.1% (UGX 6,150)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-neutral-900 text-white p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-neutral-300 mb-6 max-w-2xl mx-auto">
            Join our network of agents or start exchanging Bitcoin with transparent, fair pricing 
            that supports financial inclusion across Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-neutral-900 px-8 py-3 rounded-lg font-semibold hover:bg-neutral-100 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Become an Agent</span>
            </Link>
            <Link
              to="/auth/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-neutral-900 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Banknote className="w-5 h-5" />
              <span>Start Trading</span>
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
};

export default TariffPage;
