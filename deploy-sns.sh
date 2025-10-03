#!/bin/bash

# AfriTokeni SNS Deployment Script
# Deploys Service Nervous System for DAO governance

set -e

echo "🚀 Deploying AfriTokeni SNS (Service Nervous System)..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current principal
PRINCIPAL=$(dfx identity get-principal)
echo -e "${BLUE}Using principal: ${PRINCIPAL}${NC}"

# Step 1: Validate SNS configuration
echo -e "\n${BLUE}Step 1: Validating SNS configuration...${NC}"
if ! command -v sns &> /dev/null; then
    echo -e "${RED}SNS CLI not found. Installing...${NC}"
    cargo install --git https://github.com/dfinity/sns-cli sns
fi

sns validate sns_init.yaml

# Step 2: Deploy SNS locally for testing (optional)
echo -e "\n${BLUE}Step 2: Testing SNS locally...${NC}"
dfx start --background --clean

# Deploy NNS (required for SNS)
echo "Deploying NNS canisters..."
dfx nns install

# Deploy SNS
echo "Deploying SNS canisters..."
sns deploy --init-config-file sns_init.yaml --network local

# Step 3: Get canister IDs
echo -e "\n${GREEN}✅ SNS Deployed Successfully!${NC}"
echo -e "\n${BLUE}Canister IDs:${NC}"
dfx canister id sns_governance --network local
dfx canister id sns_ledger --network local
dfx canister id sns_root --network local
dfx canister id sns_swap --network local

# Step 4: Create proposal to add dapp to SNS
echo -e "\n${BLUE}Step 4: Creating proposal to add AfriTokeni dapp to SNS...${NC}"

# Note: In production, this would be done via NNS proposal
# For now, we'll output the command

echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Deploy to mainnet: sns deploy --init-config-file sns_init.yaml --network ic"
echo "2. Submit NNS proposal to create SNS"
echo "3. Community votes on NNS proposal"
echo "4. If approved, SNS swap begins"
echo "5. After swap, SNS controls AfriTokeni dapp"

echo -e "\n${GREEN}🎉 SNS setup complete!${NC}"
