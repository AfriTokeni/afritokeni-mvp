import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Send,
  Bitcoin,
  History,
  User,
  MapPin,
  LayoutDashboard,
  Banknote,
} from "lucide-react";
import { RouteID } from '../types/routes';


export interface Route {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

export const user_desktop_routes: Route[] = [
  {
    id: "home" as RouteID,
    path: "/users/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
    {
        id: "send" as RouteID,
        path: "/users/send",
        label: "Send Money",
        icon: Send,
    },
    {
        id: "lightning" as RouteID,
        path: "/users/lightning",
        label: "Send Bitcoin",
        icon: Send,
    },
    {
        id: "agents" as RouteID,
        path: "/users/agents",
        label: "Find Agents",
        icon: MapPin,
    },
    {
        id: "history" as RouteID,
        path: "/users/history",
        label: "Transaction History",
        icon: History,
    },
    {
        id: "withdraw" as RouteID,
        path: "/users/withdraw",
        label: "Withdraw Money",
        icon: Banknote,
    },
    {
        id: "profile" as RouteID,
        path: "/users/profile",
        label: "Profile & Settings",
        icon: User,
    },
];

export const user_mobile_routes: Route[] = [
  {
    id: "home" as RouteID,
    path: "/users/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    id: "send" as RouteID,
    path: "/users/send",
    label: "Send",
    icon: Send,
  },
  {
    id: "lightning" as RouteID,
    path: "/users/lightning",
    label: "Send Bitcoin",
    icon: Send,
  },
  {
    id: "agents" as RouteID,
    path: "/users/agents",
    label: "Agents",
    icon: MapPin,
  },
  {
    id: "history" as RouteID,
    path: "/users/history",
    label: "History",
    icon: History,
  },
  {
    id: "withdraw" as RouteID,
    path: "/users/withdraw",
    label: "Withdraw",
    icon: Banknote,
  },
  {
    id: "profile" as RouteID,
    path: "/users/profile",
    label: "Profile",
    icon: User,
  },
]
