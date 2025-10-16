#!/bin/bash
# Run USSD integration tests against local ICP replica

set -e

echo "🚀 Starting USSD ckBTC Integration Tests"
echo "========================================"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx not found. Install with: sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

# Start local ICP replica
echo "🔧 Starting local ICP replica..."
dfx start --background --clean

# Wait for replica to be ready
echo "⏳ Waiting for replica to be ready..."
sleep 5

# Deploy ckBTC ledger locally
echo "💰 Deploying ckBTC ledger..."
dfx deploy icrc1_ledger_canister --argument "(variant { Init = record {
  token_name = \"ckBTC Test\";
  token_symbol = \"ckBTC\";
  minting_account = record { owner = principal \"$(dfx identity get-principal)\" };
  initial_balances = vec {};
  metadata = vec {};
  transfer_fee = 10;
  archive_options = record {
    trigger_threshold = 2000;
    num_blocks_to_archive = 1000;
    controller_id = principal \"$(dfx identity get-principal)\";
  };
}})" || echo "⚠️  Ledger already deployed or failed"

# Get ckBTC canister ID
CKBTC_CANISTER=$(dfx canister id icrc1_ledger_canister 2>/dev/null || echo "")

if [ -z "$CKBTC_CANISTER" ]; then
    echo "❌ Failed to get ckBTC canister ID"
    dfx stop
    exit 1
fi

echo "✅ ckBTC Ledger deployed at: $CKBTC_CANISTER"

# Export for tests
export CKBTC_LEDGER_CANISTER_ID=$CKBTC_CANISTER

# Run integration tests
echo ""
echo "🧪 Running USSD ckBTC integration tests..."
echo "=========================================="
npm run test:integration

# Cleanup
echo ""
echo "🧹 Cleaning up..."
dfx stop

echo ""
echo "✅ Tests complete!"
