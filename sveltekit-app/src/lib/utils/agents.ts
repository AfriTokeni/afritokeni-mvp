// Agent utilities and mock data - EXACT 1:1 with React

export interface AgentReview {
	id: string;
	agentId: string;
	userId: string;
	userName: string;
	rating: number;
	comment: string;
	transactionId?: string;
	createdAt: string;
}

export interface Agent {
	id: string;
	userId: string;
	businessName: string;
	location: {
		country: string;
		state: string;
		city: string;
		address: string;
		coordinates: {
			lat: number;
			lng: number;
		};
	};
	isActive: boolean;
	cashBalance: number;
	digitalBalance: number;
	commissionRate: number;
	createdAt: string;
	rating?: number;
	reviewCount?: number;
	reviews?: AgentReview[];
}

export interface UserLocation {
	lat: number;
	lng: number;
}

// Haversine formula - calculate distance between two coordinates
export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371; // Radius of the Earth in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// Mock agents data - matching React
export const mockAgents: Agent[] = [
	{
		id: '1',
		userId: 'agent1',
		businessName: 'Kampala Central Exchange',
		location: {
			country: 'Uganda',
			state: 'Central',
			city: 'Kampala',
			address: 'Plot 12, Kampala Road',
			coordinates: { lat: 0.3476, lng: 32.5825 }
		},
		isActive: true,
		cashBalance: 5000000,
		digitalBalance: 3000000,
		commissionRate: 2.5,
		createdAt: new Date().toISOString(),
		rating: 4.8,
		reviewCount: 156
	},
	{
		id: '2',
		userId: 'agent2',
		businessName: 'Nakawa Money Services',
		location: {
			country: 'Uganda',
			state: 'Central',
			city: 'Kampala',
			address: 'Nakawa Industrial Area',
			coordinates: { lat: 0.3324, lng: 32.6186 }
		},
		isActive: true,
		cashBalance: 3000000,
		digitalBalance: 2000000,
		commissionRate: 3.0,
		createdAt: new Date().toISOString(),
		rating: 4.5,
		reviewCount: 89
	},
	{
		id: '3',
		userId: 'agent3',
		businessName: 'Entebbe Financial Hub',
		location: {
			country: 'Uganda',
			state: 'Central',
			city: 'Entebbe',
			address: 'Airport Road, Entebbe',
			coordinates: { lat: 0.0640, lng: 32.4435 }
		},
		isActive: false,
		cashBalance: 1000000,
		digitalBalance: 500000,
		commissionRate: 2.8,
		createdAt: new Date().toISOString(),
		rating: 4.2,
		reviewCount: 45
	}
];
