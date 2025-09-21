import React, { useEffect, useState } from 'react';
import { MapPin, User, Star, List, MapIcon as Map, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrencyAmount, type AfricanCurrency } from '../../types/currency';

// Fix for default Leaflet icon paths in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { AgentSelectionStepProps } from '../../types/depositTypes';
import { Agent } from '../../services/dataService';

// No need for leaflet popup CSS since we're using custom React popup

const AgentSelectionStep: React.FC<AgentSelectionStepProps> = ({
  agents,
  selectedAgent,
  amount,
  selectedCurrency,
  userLocation,
  viewMode,
  isLoadingAgents,
  isCreating,
  onAgentSelect,
  onViewModeChange,
  onCreateDepositRequest,
}) => {
  // Ensure unique agents to prevent duplicates
  const uniqueAgents = agents.filter((agent, index, self) => 
    index === self.findIndex(a => a.id === agent.id)
  );
  
  // Debug log to track agent duplication and map rendering
  console.log('AgentSelectionStep rendered with agents:', agents.length, 'unique:', uniqueAgents.length);
  if (agents.length !== uniqueAgents.length) {
    console.warn('Duplicate agents detected!', agents.map(a => a.id));
  }
  
  // Map rendering debug
  useEffect(() => {
    console.log('🗺️ View mode changed to:', viewMode);
    console.log('🗺️ User location:', userLocation);
    
    if (viewMode === 'map') {
      // Give the map container time to render then check if Leaflet is working
      setTimeout(() => {
        const mapContainers = document.querySelectorAll('.leaflet-container');
        console.log('🗺️ Found Leaflet containers:', mapContainers.length);
        if (mapContainers.length === 0) {
          console.error('🗺️ No Leaflet containers found - map may not be rendering');
        } else {
          console.log('🗺️ Map container found, checking tiles...');
          const tiles = document.querySelectorAll('.leaflet-tile');
          console.log('🗺️ Found tiles:', tiles.length);
        }
      }, 1000);
    }
  }, [viewMode, userLocation]);

  // State for custom popup that bypasses leaflet z-index issues
  const [popupAgent, setPopupAgent] = useState<Agent | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle marker clicks to show custom popup
  const handleMarkerClick = (agent: Agent, event: L.LeafletMouseEvent) => {
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
    onAgentSelect(agent);
  };

  // Close popup
  const closePopup = () => {
    setPopupAgent(null);
  };

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

  const createAgentIcon = (status: string) => {
    let bgColor = 'bg-gray-500';
    if (status === 'available') bgColor = 'bg-green-500';
    if (status === 'busy') bgColor = 'bg-yellow-500';
    if (status === 'offline') bgColor = 'bg-red-500';

    return L.divIcon({
      html: `
        <div class="relative">
          <div class="flex items-center justify-center w-10 h-10 ${bgColor} rounded-full text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark-icon lucide-landmark">
              <path d="M10 18v-7"/><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z"/>
              <path d="M14 18v-7"/>
              <path d="M18 18v-7"/>
              <path d="M3 22h18"/>
              <path d="M6 18v-7"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-3 w-4 h-4 ${bgColor} rounded-full border-2 border-white"></div>
        </div>
      `,
      className: 'bg-transparent border-none',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
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

  const CenterMap = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 13);
    }, [center, map]);
    return null;
  };

  const renderAgentDetails = (agent: typeof agents[0]) => (
    <div className="max-w-xs">
      <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-2">{agent.businessName}</h3>
      <div className="space-y-2 text-xs sm:text-sm">
        <p>
          <span className="font-semibold">Status:</span>{' '}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            agent.status === 'available'
              ? 'bg-green-100 text-green-800'
              : agent.status === 'busy'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {agent.status}
          </span>
        </p>
        <p>
          <span className="font-semibold">Location:</span> {agent.location.address}
        </p>
        <p>
          <span className="font-semibold">Distance:</span>{' '}
          {userLocation
            ? calculateDistance(
                userLocation[0], userLocation[1],
                agent.location.coordinates.lat, agent.location.coordinates.lng
              )
            : 'Unknown'}
        </p>
        <p>
          <span className="font-semibold">Contact:</span> Via app
        </p>
        <p>
          <span className="font-semibold">Operating Hours:</span> Business hours vary
        </p>
        <p>
          <span className="font-semibold">Available Balance:</span> {agent.digitalBalance?.toLocaleString() || 'N/A'} {selectedCurrency || 'UGX'}
        </p>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateDepositRequest(agent);
          }}
          disabled={isCreating}
          className="flex-1 px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed text-xs font-semibold transition-colors duration-200"
        >
          {isCreating ? 'Creating...' : 'Select Agent'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sm:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Select Agent</h2>
          <p className="text-neutral-600">
            Choose an agent to deposit {formatCurrencyAmount(parseFloat(amount), selectedCurrency as AfricanCurrency)}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
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
              onClick={() => onViewModeChange('map')}
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

        {isLoadingAgents ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900"></div>
              <span>Finding nearby agents...</span>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="grid gap-4">
            {uniqueAgents.map((agent) => (
              <div
                key={agent.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedAgent?.id === agent.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{agent.businessName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-neutral-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{agent.location.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>4.5/5</span>
                        </div>
                        {userLocation && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">
                              {calculateDistance(
                                userLocation[0], 
                                userLocation[1], 
                                agent.location.coordinates.lat, 
                                agent.location.coordinates.lng
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <p className="text-sm text-neutral-600">Available</p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Online</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Select Agent button clicked', agent);
                        onCreateDepositRequest(agent);
                      }}
                      disabled={isCreating}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                      {isCreating ? 'Creating...' : 'Select Agent'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-96 w-full relative z-0" style={{ minHeight: '384px' }}>
            <MapContainer
              center={userLocation || [0.3476, 32.5825]} // Default to Kampala if no user location
              zoom={13}
              style={{ 
                height: '100%', 
                width: '100%', 
                minHeight: '384px', 
                position: 'relative', 
                zIndex: 1,
                borderRadius: '0.5rem'
              }}
              className="leaflet-map-container"
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
              
              {uniqueAgents.map((agent) => (
                <Marker
                  key={agent.id}
                  position={[agent.location.coordinates.lat, agent.location.coordinates.lng]}
                  icon={createAgentIcon('available')}
                  eventHandlers={{
                    click: (event) => {
                      handleMarkerClick(agent, event);
                    },
                  }}
                />
              ))}
            </MapContainer>
          </div>
        )}

        {isCreating && (
          <div className="text-center mt-6">
            <div className="inline-flex items-center space-x-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-900"></div>
              <span>Creating deposit request...</span>
            </div>
          </div>
        )}
      </div>

      {/* Custom popup that renders outside map to avoid z-index issues */}
      {popupAgent && (
        <>
          {/* Backdrop to close popup */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={closePopup}
            style={{ backgroundColor: 'transparent' }}
          />
          
          {/* Popup content */}
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
            {/* Arrow pointing down */}
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
            
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Agent details content */}
            <div className="p-4">
              {renderAgentDetails(popupAgent)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentSelectionStep;