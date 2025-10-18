/**
 * Shared step definitions and setup
 * Used across all feature tests
 */

import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { mockJuno } from '../../mocks/juno.js';
import * as junoCore from '@junobuild/core';

// Initialize Juno with satellite ID for tests
const JUNO_SATELLITE_ID = 'uxrrr-q7777-77774-qaaaq-cai';

// Set Juno satellite ID in environment for tests
process.env.VITE_JUNO_SATELLITE_ID = JUNO_SATELLITE_ID;

// Mock Juno internal state to bypass satellite ID check
const junoState = { satelliteId: JUNO_SATELLITE_ID, container: null };
(junoCore as any).satelliteId = () => JUNO_SATELLITE_ID;

// Mock Juno functions completely - no real Juno calls in tests
(junoCore as any).setDoc = mockJuno.setDoc;
(junoCore as any).getDoc = mockJuno.getDoc;
(junoCore as any).listDocs = mockJuno.listDocs;
(junoCore as any).deleteDoc = async () => {};
(junoCore as any).initSatellite = async () => junoState;
(junoCore as any).authSubscribe = () => () => {}; // No-op unsubscribe
(junoCore as any).listAssets = async () => ({ items: [], items_length: 0n, matches_length: 0n, items_page: 0n, matches_pages: 0n });

setDefaultTimeout(30000);

// ICP Integration constants
export const LOCAL_REPLICA_URL = 'http://127.0.0.1:4943';
export const CKBTC_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
export const CKUSDC_CANISTER_ID = 'uzt4z-lp777-77774-qaabq-cai';

// ICRC-1 Interface
export const ICRC1_IDL = ({ IDL }: any) => IDL.Service({
  icrc1_balance_of: IDL.Func(
    [IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })],
    [IDL.Nat],
    ['query']
  ),
  icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
  icrc1_name: IDL.Func([], [IDL.Text], ['query']),
  icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
});

// Define world object type
export interface World {
  [key: string]: any;
}

// Create world object
export const world: World = {};

Before(function () {
  // Clear all world state
  Object.keys(world).forEach(key => delete world[key]);

  // Initialize fresh state
  world.userId = 'test-user-' + Date.now();
  world.balance = 0;
  world.btcBalance = 0;
  // Don't initialize usdcBalance - let it be undefined so we can detect ckUSDC context

  mockJuno.clear();
  
  // Ensure NODE_ENV is set to test by default
  process.env.NODE_ENV = 'test';
});

After(function () {
  // Restore NODE_ENV to test after each scenario
  process.env.NODE_ENV = 'test';
});
