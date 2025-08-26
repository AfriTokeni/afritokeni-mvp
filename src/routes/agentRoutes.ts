import {  
  Users, 
  CreditCard, 
  Settings,
  LucideIcon,
  Banknote,
  Home,
  LayoutDashboard
} from 'lucide-react';

export interface Route {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

export const agent_desktop_routes: Route[] = [
  {
    id: 'home',
    path: '/agents/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'withdraw',
    path: '/agents/withdraw',
    label: 'Withdraw',
    icon: Banknote,
  },
  {
    id: 'deposit',
    path: '/agents/deposit',
    label: 'Deposit',
    icon: CreditCard,
  },
  {
    id: 'customers',
    path: '/agents/customers',
    label: 'Customers',
    icon: Users,
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
    id: 'home',
    path: '/agents/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    id: 'withdraw',
    path: '/agents/withdraw',
    label: 'Withdraw',
    icon: Banknote,
  },
  {
    id: 'deposit',
    path: '/agents/deposit',
    label: 'Deposit',
    icon: CreditCard,
  },
  {
    id: 'customers',
    path: '/agents/customers',
    label: 'Customers',
    icon: Users,
  },
  {
    id: 'settings',
    path: '/agents/settings',
    label: 'Settings',
    icon: Settings,
  },
];
