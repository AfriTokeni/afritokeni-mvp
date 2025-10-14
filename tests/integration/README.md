# Integration Tests with Local ICP

## Overview
These tests run against a local ICP replica with deployed ckBTC and ckUSDC ledger canisters.

## Prerequisites
1. **DFX installed**: `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
2. **Local replica running**: `npm run icp:start`
3. **Canisters deployed**: `npm run icp:deploy`

## Quick Start

### Run all integration tests:
```bash
npm run icp:test
```

This will:
1. Start local ICP replica
2. Deploy ckBTC and ckUSDC ledgers
3. Run integration tests
4. Stop the replica

### Manual testing:
```bash
# Start replica
npm run icp:start

# Deploy canisters
npm run icp:deploy

# Run tests
npm run test:integration

# Watch mode
npm run test:integration:watch

# Stop replica
npm run icp:stop
```

## What's Tested

### ckBTC Ledger
- ✅ Token metadata (symbol, name, decimals)
- ✅ Balance queries
- ⏳ Transfers (TODO)
- ⏳ Minting (TODO)

### ckUSDC Ledger
- ✅ Token metadata (symbol, name, decimals)
- ✅ Balance queries
- ⏳ Transfers (TODO)
- ⏳ Minting (TODO)

### Full User Flows (TODO)
- Deposit → Transfer → Exchange → Withdraw
- Multi-user scenarios
- Error handling
- Escrow flows

## Canister IDs
After deployment, canister IDs are stored in `.dfx/local/canister_ids.json`:
```json
{
  "ckbtc_ledger": {
    "local": "bd3sg-teaaa-aaaaa-qaaba-cai"
  },
  "ckusdc_ledger": {
    "local": "bkyz2-fmaaa-aaaaa-qaaaq-cai"
  }
}
```

## Troubleshooting

### Replica not starting
```bash
# Kill any existing dfx processes
pkill dfx
rm -rf .dfx

# Start fresh
npm run icp:start
```

### Canister deployment fails
```bash
# Clean and redeploy
dfx stop
npm run icp:start
npm run icp:deploy
```

### Tests failing
- Ensure replica is running: `dfx ping`
- Check canister status: `dfx canister status ckbtc_ledger`
- View logs: `dfx canister logs ckbtc_ledger`
