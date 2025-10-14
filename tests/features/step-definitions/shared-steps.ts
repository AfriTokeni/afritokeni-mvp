/**
 * Shared step definitions and setup
 * Used across all feature tests
 */

import { Before, setDefaultTimeout } from '@cucumber/cucumber';
import { mockJuno } from '../../mocks/juno.js';
import * as junoCore from '@junobuild/core';

// Mock Juno functions
(junoCore as any).setDoc = mockJuno.setDoc;
(junoCore as any).getDoc = mockJuno.getDoc;
(junoCore as any).listDocs = mockJuno.listDocs;

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

// Shared world object
export const world: any = {};

Before(function () {
  // Clear all world state
  Object.keys(world).forEach(key => delete world[key]);
  
  // Initialize fresh state
  world.userId = 'test-user-' + Date.now();
  world.balance = 0;
  world.btcBalance = 0;
  world.usdcBalance = 0;
  
  mockJuno.clear();
});
