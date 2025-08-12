import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ArrowLeft } from 'lucide-react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import type { Agent } from './types';

interface AgentStepProps {
  userLocation: [number, number] | null;
  locationError: string | null;
  ugxAmount?: number;
  usdcAmount?: number;
  onBackToAmount: () => void;
  onAgentSelect: (agent: Agent) => void;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Kampala Central Agent',
    status: 'online',
    location: [0.3136, 32.5811],
    locationName: 'Kampala Road, Central Business District',
    address: 'Plot 12, Kampala Road, Central Business District, Kampala',
    contact: '+256 123 456 789',
    operatingHours: 'Mon-Fri: 8am - 6pm',
    availableBalance: 25000
  },
  {
    id: '2',
    name: 'Entebbe Airport Agent',
    status: 'online',
    location: [0.0428, 32.4637],
    locationName: 'Entebbe International Airport, Main Terminal',
    address: 'Entebbe International Airport, Departure Hall, Gate 3',
    contact: '+256 123 456 780',
    operatingHours: 'Daily: 6am - 10pm',
    availableBalance: 18000
  },
  {
    id: '3',
    name: 'Jinja Town Agent',
    status: 'busy',
    location: [0.4244, 33.2041],
    locationName: 'Main Street, Jinja Town Center',
    address: 'Shop 15, Main Street Shopping Complex, Jinja',
    contact: '+256 123 456 781',
    operatingHours: 'Mon-Sat: 8am - 7pm',
    availableBalance: 32000
  },
];

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

  const handleMarkerClick = (agent: Agent) => {
    setSelectedAgent(agent);
    if (window.innerWidth < 768) {
      setIsMobileDialogOpen(true);
    }
  };

    const availableAgents = mockAgents.filter(agent => agent.availableBalance > 0);

  const renderAgentDetails = (agent: Agent) => (
    <div className="max-w-xs">
      <h3 className="font-bold text-lg mb-2">{agent.name}</h3>
      <div className="space-y-2 text-sm">
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
          className="flex-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
        >
          Select Agent
        </button>
      </div>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBackToAmount}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Amount</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Select Agent</h2>
            {(ugxAmount || usdcAmount) && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Withdrawal Amount</p>
                <p className="text-lg font-semibold text-gray-800">
                  {ugxAmount ? `${ugxAmount.toLocaleString()} UGX` : ''}
                  {ugxAmount && usdcAmount && ' • '}
                  {usdcAmount ? `${usdcAmount.toFixed(2)} USDC` : ''}
                </p>
              </div>
            )}
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              List View
            </button>
          </div>
        </div>

        {locationError && (
          <div className="p-4 bg-yellow-50 text-yellow-800 text-sm">
            {locationError}
          </div>
        )}

        {viewMode === 'map' && userLocation && (
          <div className="w-full h-96 lg:h-[500px] relative">
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

        {viewMode === 'list' && (
          <div className="w-full h-96 lg:h-[500px] overflow-y-auto">
            {availableAgents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No available agents at the moment.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {availableAgents.map((agent) => (
                  <li
                    key={agent.id}
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{agent.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{agent.locationName}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {userLocation
                              ? calculateDistance(
                                  userLocation[0], userLocation[1],
                                  agent.location[0], agent.location[1]
                                )
                              : 'Distance unknown'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            agent.status === 'online'
                              ? 'bg-green-100 text-green-800'
                              : agent.status === 'busy'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Available: {agent.availableBalance.toLocaleString()} UGX
                        </p>
                      </div>
                      <button
                        onClick={() => onAgentSelect(agent)}
                        disabled={agent.status !== 'online'}
                        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end md:hidden">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Agent Details</h3>
              <button
                onClick={() => setIsMobileDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
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
