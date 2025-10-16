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

# Deploy ckBTC and ckUSDC ledgers
echo "💰 Deploying ckBTC and ckUSDC ledgers..."
dfx deploy ckbtc_ledger || echo "⚠️  ckBTC Ledger already deployed or failed"
dfx deploy ckusdc_ledger || echo "⚠️  ckUSDC Ledger already deployed or failed"

# Get canister IDs
CKBTC_CANISTER=$(dfx canister id ckbtc_ledger 2>/dev/null || echo "")
CKUSDC_CANISTER=$(dfx canister id ckusdc_ledger 2>/dev/null || echo "")

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
