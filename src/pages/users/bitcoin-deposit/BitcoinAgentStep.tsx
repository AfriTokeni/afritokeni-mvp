import React, { useState, useEffect } from 'react';
import { MapPin, Star, List, Map, X, Navigation, Phone, Clock, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AfricanCurrency } from '../../../types/currency';
import { Agent } from '../../../services/escrowService';

// Fix for default Leaflet icon paths
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BitcoinAgentStepProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  btcAmount: string;
  localAmount: string;
  selectedCurrency: AfricanCurrency;
  userLocation: [number, number] | null;
  isLoading: boolean;
  isCreating: boolean;
  onAgentSelect: (agent: Agent) => void;
  onBack: () => void;
}

const BitcoinAgentStep: React.FC<BitcoinAgentStepProps> = ({
  agents,
  selectedAgent,
  btcAmount,
  localAmount,
  selectedCurrency,
  userLocation,
  isLoading,
  isCreating,
  onAgentSelect,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [popupAgent, setPopupAgent] = useState<Agent | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map helper functions
  const createBlinkingUserIcon = () => {
    return L.divIcon({
      html: `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
          <div class="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      `,
      className: 'bg-transparent border-none',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  };

  const createAgentIcon = (isActive: boolean) => {
    const bgColor = isActive ? 'bg-green-500' : 'bg-neutral-400';
    
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 ${bgColor} rounded-full text-white border-2 border-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      className: 'bg-transparent border-none',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${(distance * 1000).toFixed(0)} meters` : `${distance.toFixed(1)} km`;
  };

  const formatDistanceForAgent = (): string => {
    if (!userLocation) return '';
    // Default coordinates for now - will be replaced with actual agent coordinates
    const agentLat = 0.3476;
    const agentLng = 32.5825;
    const distance = parseFloat(calculateDistance(
      userLocation[0],
      userLocation[1],
      agentLat,
      agentLng
    ).replace(' km', '').replace(' meters', ''));
    
    if (calculateDistance(userLocation[0], userLocation[1], agentLat, agentLng).includes('meters')) {
      return `${Math.round(distance)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const formatCurrency = (amount: number, currency: AfricanCurrency): string => {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency === 'XOF' || currency === 'XAF' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle marker clicks to show custom popup
  const handleMarkerClick = (agent: Agent, event: L.LeafletMouseEvent) => {
    const marker = event.target;
    const map = marker._map;
    const point = map.latLngToContainerPoint(marker.getLatLng());
    
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    
    setPopupPosition({
      x: mapRect.left + point.x,
      y: mapRect.top + point.y - 10
    });
    setPopupAgent(agent);
  };

  const closePopup = () => {
    setPopupAgent(null);
  };

  const CenterMap = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 13);
    }, [center, map]);
    return null;
  };

  const renderAgentDetails = (agent: Agent) => (
    <div className="min-w-48">
      {/* Agent Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900 mb-1">
            {agent.name}
          </h3>
          <div className="flex items-center text-sm text-neutral-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            {agent.location}
          </div>
          {userLocation && (
            <div className="flex items-center text-sm text-neutral-500">
              <Navigation className="h-4 w-4 mr-1" />
              {formatDistanceForAgent()} away
            </div>
          )}
        </div>
        <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Online
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-neutral-500 mb-1">Rating</p>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 font-semibold text-neutral-900">{agent.rating}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-1">Fee</p>
          <p className="font-mono font-semibold text-neutral-900">
            {agent.fee}%
          </p>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">You send:</span>
          <span className="font-mono">₿{btcAmount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">You receive:</span>
          <span className="font-mono text-green-600">
            {formatCurrency(parseFloat(localAmount) * (1 - agent.fee / 100), selectedCurrency)}
          </span>
        </div>
      </div>

      {/* Services */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          Bitcoin Exchange
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Cash Pickup
        </span>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Escrow Protected
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAgentSelect(agent);
          }}
          disabled={isCreating}
          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isCreating ? 'Creating...' : 'Select Agent'}
        </button>
        <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors duration-200">
          <Phone className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Amount</span>
        </button>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Choose an Agent</h2>
        <p className="text-neutral-600">Select a trusted agent near you for cash exchange</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 inline mr-2" />
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4 inline mr-2" />
              Map View
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900"></div>
              <span>Finding nearby agents...</span>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                  selectedAgent?.id === agent.id ? 'ring-2 ring-orange-500' : ''
                }`}
                onClick={() => onAgentSelect(agent)}
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {agent.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
                      <p className="text-sm text-neutral-600">{agent.location}</p>
                      {userLocation && (
                        <div className="flex items-center text-sm text-neutral-500">
                          <Navigation className="h-4 w-4 mr-1" />
                          {formatDistanceForAgent()} away
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-yellow-500 mb-1">
                      <span className="text-sm font-medium">{agent.rating}</span>
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div className="text-xs text-green-600 font-medium">{agent.fee}% fee</div>
                  </div>
                </div>

                {/* Transaction Preview */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">You send:</span>
                    <span className="font-mono">₿{btcAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">You receive:</span>
                    <span className="font-mono text-green-600">
                      {formatCurrency(parseFloat(localAmount) * (1 - agent.fee / 100), selectedCurrency)}
                    </span>
                  </div>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Bitcoin Exchange
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Cash Pickup
                  </span>
                </div>

                {/* Expanded Details */}
                {selectedAgent?.id === agent.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Operating Hours</p>
                        <div className="flex items-center text-sm text-neutral-700">
                          <Clock className="h-4 w-4 mr-2" />
                          Mon-Sat: 8:00 AM - 8:00 PM
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Services Available</p>
                        <ul className="text-sm text-neutral-700 space-y-1">
                          <li>• Bitcoin to cash exchange</li>
                          <li>• Secure escrow protection</li>
                          <li>• ID verification required</li>
                          <li>• Same-day processing</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <div className="h-96 w-full relative z-0">
              <MapContainer
                center={userLocation || [0.3476, 32.5825]}
                zoom={13}
                style={{ 
                  height: '100%', 
                  width: '100%',
                  borderRadius: '0.5rem'
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {userLocation && <CenterMap center={userLocation} />}
                
                {userLocation && (
                  <Marker 
                    position={userLocation}
                    icon={createBlinkingUserIcon()}
                  />
                )}
                
                {agents.map((agent) => (
                  <Marker
                    key={agent.id}
                    position={[0.3476, 32.5825]} // Default coordinates for now
                    icon={createAgentIcon(true)}
                    eventHandlers={{
                      click: (event) => {
                        handleMarkerClick(agent, event);
                      },
                    }}
                  />
                ))}
              </MapContainer>
            </div>

            {/* Custom popup */}
            {popupAgent && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={closePopup}
                  style={{ backgroundColor: 'transparent' }}
                />
                
                <div
                  className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200"
                  style={{
                    left: `${popupPosition.x}px`,
                    top: `${popupPosition.y}px`,
                    transform: 'translate(-50%, -100%)',
                    marginTop: '-10px',
                    maxWidth: '320px',
                    minWidth: '280px',
                  }}
                >
                  <div 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid white',
                    }}
                  />
                  
                  <button
                    onClick={closePopup}
                    className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div className="p-4">
                    {renderAgentDetails(popupAgent)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BitcoinAgentStep;