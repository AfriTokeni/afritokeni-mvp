export interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  location: [number, number];
  locationName: string;
  address: string;
  contact: string;
  operatingHours: string;
  availableBalance: number;
}

export type WithdrawStep = 'amount' | 'agent' | 'confirmation';
