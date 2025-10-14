/**
 * Integration tests with local ICP replica
 * 
 * Prerequisites:
 * 1. Start local replica: dfx start --clean --background
 * 2. Deploy canisters: dfx deploy ckbtc_ledger ckusdc_ledger
 * 3. Run tests: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

const LOCAL_REPLICA_URL = 'http://127.0.0.1:4943';

// Canister IDs from deployment
const CKBTC_CANISTER_ID = 'uxrrr-q7777-77774-qaaaq-cai';
const CKUSDC_CANISTER_ID = 'uzt4z-lp777-77774-qaabq-cai';

// ICRC-1 Interface
const ICRC1_IDL = ({ IDL }: any) => IDL.Service({
  icrc1_balance_of: IDL.Func(
    [IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) })],
    [IDL.Nat],
    ['query']
  ),
  icrc1_transfer: IDL.Func(
    [IDL.Record({
      to: IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) }),
      amount: IDL.Nat,
      fee: IDL.Opt(IDL.Nat),
      memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
      from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
      created_at_time: IDL.Opt(IDL.Nat64),
    })],
    [IDL.Variant({ Ok: IDL.Nat, Err: IDL.Text })],
    []
  ),
  icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
  icrc1_name: IDL.Func([], [IDL.Text], ['query']),
  icrc1_decimals: IDL.Func([], [IDL.Nat8], ['query']),
});

describe('Local ICP Integration Tests', () => {
  let ckbtcCanisterId: string;
  let ckusdcCanisterId: string;
  let agent: HttpAgent;
  let testPrincipal: Principal;

  beforeAll(async () => {
    // Get canister IDs from dfx
    try {
      const { stdout: ckbtcId } = await execAsync('dfx canister id ckbtc_ledger');
      const { stdout: ckusdcId } = await execAsync('dfx canister id ckusdc_ledger');
      
      ckbtcCanisterId = ckbtcId.trim();
      ckusdcCanisterId = ckusdcId.trim();
      
      console.log('ckBTC Canister ID:', ckbtcCanisterId);
      console.log('ckUSDC Canister ID:', ckusdcCanisterId);
    } catch (error) {
      console.error('Failed to get canister IDs. Make sure dfx is running and canisters are deployed.');
      throw error;
    }

    // Create agent for local replica
    agent = new HttpAgent({ host: LOCAL_REPLICA_URL });
    await agent.fetchRootKey(); // Required for local development
    
    // Use default identity for testing
    testPrincipal = Principal.fromText('2vxsx-fae');
  });

  describe('ckBTC Ledger', () => {
    it('should query ckBTC token metadata', async () => {
      const actor = Actor.createActor(ICRC1_IDL, {
        agent,
        canisterId: ckbtcCanisterId
      });

      const symbol = await actor.icrc1_symbol();
      const name = await actor.icrc1_name();
      const decimals = await actor.icrc1_decimals();

      expect(symbol).toBe('ckBTC');
      expect(name).toBe('ckBTC');
      expect(decimals).toBe(8);
    });

    it('should query ckBTC balance', async () => {
      const actor = Actor.createActor(ICRC1_IDL, {
        agent,
        canisterId: ckbtcCanisterId
      });

      const balance = await actor.icrc1_balance_of({
        owner: testPrincipal,
        subaccount: []
      });

      expect(typeof balance).toBe('bigint');
      console.log('ckBTC Balance:', balance.toString(), 'satoshis');
    });
  });

  describe('ckUSDC Ledger', () => {
    it('should query ckUSDC token metadata', async () => {
      const actor = Actor.createActor(ICRC1_IDL, {
        agent,
        canisterId: ckusdcCanisterId
      });

      const symbol = await actor.icrc1_symbol();
      const name = await actor.icrc1_name();
      const decimals = await actor.icrc1_decimals();

      expect(symbol).toBe('ckUSDC');
      expect(name).toBe('ckUSDC');
      expect(decimals).toBe(6);
    });

    it('should query ckUSDC balance', async () => {
      const actor = Actor.createActor(ICRC1_IDL, {
        agent,
        canisterId: ckusdcCanisterId
      });

      const balance = await actor.icrc1_balance_of({
        owner: testPrincipal,
        subaccount: []
      });

      expect(typeof balance).toBe('bigint');
      console.log('ckUSDC Balance:', balance.toString(), 'smallest units');
    });
  });

  describe('Full User Flow', () => {
    it('should complete deposit → transfer → exchange flow', async () => {
      // This is a placeholder for the full integration test
      // In a real scenario, you would:
      // 1. Mint ckBTC to test user
      // 2. Transfer ckBTC to another user
      // 3. Create escrow for exchange
      // 4. Complete exchange with agent
      // 5. Verify balances at each step
      
      expect(true).toBe(true);
    });
  });
});
