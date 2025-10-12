import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ArrowLeft, MapPin, Star, List, MapIcon as Map, X, Navigation, Phone, Clock } from 'lucide-react';
import L from 'leaflet';
import { useDemoMode } from '../../context/DemoModeContext';
import { useMap } from 'react-leaflet';

// Fix for default Leaflet icon paths in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { DataService, Agent as DBAgent } from '../../services/dataService';

interface AgentStepProps {
  userLocation: [number, number] | null;
  locationError: string | null;
  localAmount: number;
  btcAmount: string;
  userCurrency: string;
  onBackToAmount: () => void;
  onAgentSelect: (selectedAgent: DBAgent) => void;
  isCreatingTransaction?: boolean;
  transactionError?: string | null;
}

// Removed conversion function - using DBAgent directly

// Removed unused helper function

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
  const bgColor = isActive ? 'bg-green-500' : 'bg-gray-400';
  
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

const formatDistance = (agent: DBAgent, userLocation: [number, number] | null): string => {
  if (!userLocation) return '';
  const distance = parseFloat(calculateDistance(
    userLocation[0],
    userLocation[1],
    agent.location.coordinates.lat,
    agent.location.coordinates.lng
  ).replace(' km', '').replace(' meters', ''));
  
  if (calculateDistance(userLocation[0], userLocation[1], agent.location.coordinates.lat, agent.location.coordinates.lng).includes('meters')) {
    return `${Math.round(distance)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

const formatBalance = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

const CenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

const AgentStep: React.FC<AgentStepProps> = ({
  userLocation,
  locationError,
  localAmount,
  btcAmount,
  userCurrency,
  onBackToAmount,
  onAgentSelect,
  isCreatingTransaction = false,
  transactionError,
}) => {
  const { isDemoMode } = useDemoMode();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [agents, setAgents] = useState<DBAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<DBAgent | null>(null);
  const [popupAgent, setPopupAgent] = useState<DBAgent | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fetch nearby agents
  useEffect(() => {
    const fetchNearbyAgents = async () => {
      if (!userLocation) return;
      
      setIsLoading(true);
      try {
        if (isDemoMode) {
          // Load demo agents
          const demoAgents: any[] = [];
          setAgents(demoAgents);
        } else {
          const [lat, lng] = userLocation;
          const dbAgents = await DataService.getNearbyAgents(lat, lng, 10, ['available', 'busy']);
          setAgents(dbAgents);
        }
      } catch (error) {
        console.error('Error fetching nearby agents:', error);
        setAgents([]); // Fallback to empty array
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyAgents();
  }, [userLocation, isDemoMode]);

  // Fix popup z-index to ensure visibility above map
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-popup-pane {
        z-index: 1000 !important;
      }
      .leaflet-popup {
        z-index: 1000 !important;
      }
      .leaflet-popup-content-wrapper {
        z-index: 1001 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const availableAgents = agents.filter(agent => agent.digitalBalance > 0);

  // Handle marker clicks to show custom popup
  const handleMarkerClick = (agent: DBAgent, event: L.LeafletMouseEvent) => {
    // Get the marker's screen position
    const marker = event.target;
    const map = marker._map;
    const point = map.latLngToContainerPoint(marker.getLatLng());
    
    // Get the map container's position
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    
    // Calculate popup position relative to viewport
    setPopupPosition({
      x: mapRect.left + point.x,
      y: mapRect.top + point.y - 10 // Offset to appear above marker
    });
    setPopupAgent(agent);
    setSelectedAgent(agent);
  };

  // Close popup
  const closePopup = () => {
    setPopupAgent(null);
  };

  const renderAgentDetails = (agent: DBAgent) => (
    <div className="min-w-48">
      {/* Agent Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {agent.businessName}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            {agent.location.address}
          </div>
          {userLocation && (
            <div className="flex items-center text-sm text-gray-500">
              <Navigation className="h-4 w-4 mr-1" />
              {formatDistance(agent, userLocation)} away
            </div>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          agent.status === 'available'
            ? 'bg-green-100 text-green-800' 
            : agent.status === 'busy'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {agent.status === 'available' ? 'Online' : agent.status === 'busy' ? 'Busy' : 'Offline'}
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Digital Balance</p>
          <p className="font-mono font-semibold text-gray-900">
            {formatBalance(agent.digitalBalance || 0)} {userCurrency || 'UGX'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Cash Available</p>
          <p className="font-mono font-semibold text-gray-900">
            {formatBalance(agent.cashBalance || 0)} {userCurrency || 'UGX'}
          </p>
        </div>
      </div>

      {/* Rating (Mock) */}
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="ml-2 text-sm text-gray-600">4.0 (23 reviews)</span>
      </div>

      {/* Services */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Cash Deposit
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Withdrawal
        </span>
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          Bitcoin Exchange
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAgentSelect(agent);
          }}
          disabled={isCreatingTransaction}
          className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isCreatingTransaction ? 'Creating Withdrawal...' : 'Select Agent'}
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200">
          <Phone className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBackToAmount}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-xs sm:text-sm lg:text-base">Back to Amount</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Select Agent</h2>
            {localAmount && (
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Withdrawal Amount</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold font-mono text-gray-900">
                  {localAmount.toLocaleString()} {userCurrency}
                  {btcAmount && ` • ₿${parseFloat(btcAmount).toFixed(8)}`}
                </p>
              </div>
            )}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="h-4 w-4" />
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
          </div>
        </div>

        {locationError && (
          <div className="p-3 sm:p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm">
            <p className="font-medium">Location Error</p>
            <p className="text-xs sm:text-sm">{locationError}</p>
          </div>
        )}

        {transactionError && (
          <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-400 text-red-800 text-sm">
            <p className="font-medium">Transaction Error</p>
            <p className="text-xs sm:text-sm">{transactionError}</p>
          </div>
        )}

        {isLoading ? (
          <div className="w-full h-64 sm:h-80 lg:h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base">Loading nearby agents...</p>
            </div>
          </div>
        ) : viewMode === 'map' && userLocation ? (
          <div className="relative">
            <div className="w-full h-64 sm:h-80 lg:h-[500px] relative">
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <CenterMap center={userLocation} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={userLocation} icon={createBlinkingUserIcon()}>
                  <Popup>Your Location</Popup>
                </Marker>
                {availableAgents.map((agent) => (
                  <Marker
                    key={agent.id}
                    position={[agent.location.coordinates.lat, agent.location.coordinates.lng]}
                    icon={createAgentIcon(agent.status === 'available')}
                    eventHandlers={{
                      click: (e) => handleMarkerClick(agent, e)
                    }}
                  />
                ))}
              </MapContainer>
            </div>

            {/* Custom Popup Overlay */}
            {popupAgent && (
              <div
                className="fixed z-[10000] bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
                style={{
                  left: `${popupPosition.x - 200}px`, // Center popup relative to marker
                  top: `${popupPosition.y - 20}px`,
                  transform: 'translateY(-100%)'
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">Agent Details</h4>
                  <button
                    onClick={closePopup}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {renderAgentDetails(popupAgent)}
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="w-full h-64 sm:h-80 lg:h-[500px] overflow-y-auto">
            {availableAgents.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="font-medium text-xs sm:text-sm lg:text-base">No available agents at the moment.</p>
                <p className="text-xs text-gray-600 mt-1">Please try again later or contact support.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {availableAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer ${
                      selectedAgent?.id === agent.id ? 'ring-2 ring-gray-900' : ''
                    }`}
                    onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                  >
                    {/* Agent Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {agent.businessName}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {agent.location.address}
                        </div>
                        {userLocation && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Navigation className="h-4 w-4 mr-1" />
                            {formatDistance(agent, userLocation)} away
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'available'
                          ? 'bg-green-100 text-green-800' 
                          : agent.status === 'busy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {agent.status === 'available' ? 'Online' : agent.status === 'busy' ? 'Busy' : 'Offline'}
                      </div>
                    </div>

                    {/* Agent Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Digital Balance</p>
                        <p className="font-mono font-semibold text-gray-900">
                          {formatBalance(agent.digitalBalance || 0)} {userCurrency || 'UGX'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cash Available</p>
                        <p className="font-mono font-semibold text-gray-900">
                          {formatBalance(agent.cashBalance || 0)} {userCurrency || 'UGX'}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {selectedAgent?.id === agent.id && (
                      <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                        {/* Rating */}
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">4.0 (23 reviews)</span>
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Cash Deposit
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Withdrawal
                          </span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Bitcoin Exchange
                          </span>
                        </div>

                        {/* Operating Hours */}
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Operating Hours</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              <span>Mon-Fri: 8AM-6PM</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              <span>Sat-Sun: 9AM-4PM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAgentSelect(agent);
                        }}
                        disabled={isCreatingTransaction}
                        className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isCreatingTransaction ? 'Creating Withdrawal...' : 'Select Agent'}
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

    </div>
  );
};

export default AgentStep;
