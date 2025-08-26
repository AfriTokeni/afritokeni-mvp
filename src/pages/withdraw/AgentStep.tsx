import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ArrowLeft } from 'lucide-react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { DataService, Agent as DBAgent } from '../../services/dataService';
import type { Agent } from './types';

interface AgentStepProps {
  userLocation: [number, number] | null;
  locationError: string | null;
  ugxAmount?: number;
  usdcAmount?: number;
  onBackToAmount: () => void;
  onAgentSelect: (agent: Agent) => void;
}

// Convert database agent to UI agent format
const convertDbAgentToUIAgent = (dbAgent: DBAgent): Agent => {
  return {
    id: dbAgent.id,
    name: dbAgent.businessName,
    status: dbAgent.status === 'available' ? 'online' : 
            dbAgent.status === 'busy' ? 'busy' : 'offline',
    location: [dbAgent.location.coordinates.lat, dbAgent.location.coordinates.lng],
    locationName: `${dbAgent.location.city}, ${dbAgent.location.state}`,
    address: dbAgent.location.address,
    contact: 'Contact via app', // Could be updated when contact info is added to Agent schema
    operatingHours: 'Business hours vary', // Could be updated when business hours are added
    availableBalance: dbAgent.cashBalance
  };
};

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
  if (status === 'online') bgColor = 'bg-green-500';
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

const AgentStep: React.FC<AgentStepProps> = ({
  userLocation,
  locationError,
  ugxAmount,
  usdcAmount,
  onBackToAmount,
  onAgentSelect,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isMobileDialogOpen, setIsMobileDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch nearby agents
  useEffect(() => {
    const fetchNearbyAgents = async () => {
      if (!userLocation) return;
      
      setIsLoading(true);
      try {
        const [lat, lng] = userLocation;
        const dbAgents = await DataService.getNearbyAgents(lat, lng, 10, ['available', 'busy']);
        const uiAgents = dbAgents.map(convertDbAgentToUIAgent);
        setAgents(uiAgents);
      } catch (error) {
        console.error('Error fetching nearby agents:', error);
        setAgents([]); // Fallback to empty array
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyAgents();
  }, [userLocation]);

  const handleMarkerClick = (agent: Agent) => {
    setSelectedAgent(agent);
    if (window.innerWidth < 768) {
      setIsMobileDialogOpen(true);
    }
  };

  const availableAgents = agents.filter(agent => agent.availableBalance > 0);

  const renderAgentDetails = (agent: Agent) => (
    <div className="max-w-xs">
      <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-2">{agent.name}</h3>
      <div className="space-y-2 text-xs sm:text-sm">
        <p>
          <span className="font-semibold">Status:</span>{' '}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            agent.status === 'online'
              ? 'bg-green-100 text-green-800'
              : agent.status === 'busy'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {agent.status}
          </span>
        </p>
        <p>
          <span className="font-semibold">Location:</span> {agent.locationName}
        </p>
        <p>
          <span className="font-semibold">Distance:</span>{' '}
          {userLocation
            ? calculateDistance(
                userLocation[0], userLocation[1],
                agent.location[0], agent.location[1]
              )
            : 'Unknown'}
        </p>
        <p>
          <span className="font-semibold">Contact:</span> {agent.contact}
        </p>
        <p>
          <span className="font-semibold">Operating Hours:</span> {agent.operatingHours}
        </p>
        <p>
          <span className="font-semibold">Available Balance:</span> {agent.availableBalance.toLocaleString()} UGX
        </p>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAgentSelect(agent);
          }}
          className="flex-1 px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 text-xs font-semibold transition-colors duration-200"
        >
          Select Agent
        </button>
      </div>
    </div>
  );
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBackToAmount}
          className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-xs sm:text-sm lg:text-base">Back to Amount</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900">Select Agent</h2>
            {(ugxAmount || usdcAmount) && (
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm font-medium text-neutral-600 mb-1">Withdrawal Amount</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold font-mono text-neutral-900">
                  {ugxAmount ? `${ugxAmount.toLocaleString()} UGX` : ''}
                  {ugxAmount && usdcAmount && ' • '}
                  {usdcAmount ? `${usdcAmount.toFixed(2)} USDT` : ''}
                </p>
              </div>
            )}
          </div>
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                viewMode === 'map' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
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

        {isLoading ? (
          <div className="w-full h-64 sm:h-80 lg:h-[500px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-neutral-900 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-neutral-600 text-xs sm:text-sm lg:text-base">Loading nearby agents...</p>
            </div>
          </div>
        ) : viewMode === 'map' && userLocation && (
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
                    position={agent.location}
                    icon={createAgentIcon(agent.status)}
                    eventHandlers={{
                      click: () => handleMarkerClick(agent),
                    }}
                  >
                  <Popup className="hidden md:block">
                    {renderAgentDetails(agent)}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {!isLoading && viewMode === 'list' && (
          <div className="w-full h-64 sm:h-80 lg:h-[500px] overflow-y-auto">
            {availableAgents.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-neutral-500">
                <p className="font-medium text-xs sm:text-sm lg:text-base">No available agents at the moment.</p>
                <p className="text-xs text-neutral-600 mt-1">Please try again later or contact support.</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {availableAgents.map((agent) => (
                  <li
                    key={agent.id}
                    className="p-3 sm:p-6 hover:bg-neutral-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-neutral-900 break-words">{agent.name}</h3>
                        <p className="text-neutral-600 text-xs sm:text-sm mt-1 break-words">{agent.locationName}</p>
                        <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <span className="text-neutral-600 font-medium text-xs">
                            {userLocation
                              ? calculateDistance(
                                  userLocation[0], userLocation[1],
                                  agent.location[0], agent.location[1]
                                )
                              : 'Distance unknown'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            agent.status === 'online'
                              ? 'bg-green-100 text-green-800'
                              : agent.status === 'busy'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-2 font-mono">
                          Available: <span className="font-bold">{agent.availableBalance.toLocaleString()} UGX</span>
                        </p>
                      </div>
                      <button
                        onClick={() => onAgentSelect(agent)}
                        disabled={agent.status !== 'online'}
                        className="w-full sm:w-auto sm:ml-4 bg-neutral-900 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold text-xs sm:text-sm lg:text-base"
                      >
                        Select
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Mobile Agent Details Dialog */}
      {selectedAgent && isMobileDialogOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="bg-white w-full rounded-t-3xl p-3 sm:p-6 max-h-[70vh] overflow-y-auto border-t shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold">Agent Details</h3>
              <button
                onClick={() => setIsMobileDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            {renderAgentDetails(selectedAgent)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentStep;
