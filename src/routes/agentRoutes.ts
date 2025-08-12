import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  History, 
  Settings,
  MapPin,
  TrendingUp,
  LucideIcon
} from 'lucide-react';

export interface Route {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

export const agent_desktop_routes: Route[] = [
  {
    id: 'dashboard',
    path: '/agents/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'customers',
    path: '/agents/customers',
    label: 'Customers',
    icon: Users,
  },
  {
    id: 'transactions',
    path: '/agents/transactions',
    label: 'Transactions',
    icon: CreditCard,
  },
  {
    id: 'analytics',
    path: '/agents/analytics',
    label: 'Analytics',
    icon: TrendingUp,
  },
  {
    id: 'location',
    path: '/agents/location',
    label: 'Location',
    icon: MapPin,
  },
  {
    id: 'settings',
    path: '/agents/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const agent_mobile_routes: Route[] = [
  {
    id: 'dashboard',
    path: '/agents/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'customers',
    path: '/agents/customers',
    label: 'Customers',
    icon: Users,
  },
  {
    id: 'transactions',
    path: '/agents/transactions',
    label: 'Transactions',
    icon: History,
  },
  {
    id: 'settings',
    path: '/agents/settings',
    label: 'Settings',
    icon: Settings,
  },
];
