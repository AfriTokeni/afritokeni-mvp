# ckERC20 Stablecoin Integration Plan for AfriTokeni

## Branch: `feature/ckerc20-stablecoin-integration`

## Overview

This document outlines the integration of **ckERC20 tokens** (Chain-Key ERC20) into AfriTokeni, specifically focusing on **ckUSDC** as a stablecoin option alongside Bitcoin. This addresses a critical need for price stability in African financial transactions while maintaining the decentralized, ICP-native architecture.

---

## Critical Context: AfriTokeni's Current Architecture

### Current State (Bitcoin-Only)
- **Direct Bitcoin ↔ African currencies** exchange (NO stablecoins currently)
- Bitcoin volatility creates challenges for daily transactions
- Agent network handles physical cash exchanges
- Escrow system protects both users and agents
- SMS + Web hybrid authentication
- 39 African currencies supported (NGN, KES, GHS, UGX, etc.)

### Previous USDT/USDC Contamination (RESOLVED)
- ❌ System previously had incorrect USDT references (removed)
- ✅ Now correctly implements Bitcoin-only flows
- ⚠️ **NEW APPROACH**: ckUSDC as ICP-native stablecoin (NOT Ethereum USDT)

---

## Why ckERC20 (ckUSDC) for AfriTokeni?

### Problem Statement
1. **Bitcoin Volatility**: BTC price swings make it difficult for users to hold stable value
2. **Daily Transactions**: Users need stable value for savings, not just Bitcoin speculation
3. **Agent Liquidity**: Agents need stable reserves without Bitcoin price risk
4. **Remittances**: Families sending money home need predictable amounts

### ckUSDC Solution Benefits
1. **ICP-Native**: Runs on Internet Computer canisters (no Ethereum gas fees)
2. **1:1 USDC Peg**: Backed by Circle's USDC on Ethereum (Sepolia testnet initially)
3. **Fast & Cheap**: ICP transaction speeds with minimal fees
4. **SMS Compatible**: Can be integrated into SMS command system
5. **Programmable**: Smart contract capabilities for escrow, auto-conversion, etc.

---

## Technical Architecture: ckERC20 on ICP

### What is ckERC20?
- **Chain-Key ERC20**: ICP's bridge technology for Ethereum tokens
- **Twin Token System**: 
  - USDC on Ethereum Sepolia (testnet)
  - ckUSDC on ICP (minted 1:1 when USDC is deposited)
- **Minter Canister**: Manages deposits, withdrawals, and token minting
- **Ledger Canister**: Tracks ckUSDC balances on ICP

### Key Components (from Tutorial)
1. **Sepolia USDC Contract**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
2. **ckSepoliaUSDC Ledger Canister**: Stores balances
3. **ckSepoliaUSDC Minter Canister**: Handles deposits/withdrawals
4. **Helper Contract**: Facilitates Ethereum → ICP deposits
5. **Byte32 Address Conversion**: Principal ID ↔ Ethereum address

---

## Lightning Network on ICP: Current Status

### Research Findings
Based on web search results:

1. **NO Native Lightning Support (Yet)**
   - ICP has native **Bitcoin integration** (on-chain only)
   - Lightning Network nodes **cannot run directly on ICP canisters** currently
   - Community discussions exist but no official implementation

2. **What ICP DOES Support**
   - ✅ Native Bitcoin integration (send/receive BTC on-chain)
   - ✅ Chain-key ECDSA signing (threshold signatures)
   - ✅ Bitcoin address generation in canisters
   - ✅ Direct Bitcoin network interaction
   - ❌ Lightning Network nodes (not yet)

3. **Workarounds for Lightning-Like Speed**
   - Use **ckBTC** (Chain-Key Bitcoin) for instant ICP-native transfers
   - Integrate with external Lightning services (OpenNode, LND APIs)
   - Wait for future ICP Lightning integration (roadmap item)

### Recommendation for AfriTokeni
- **Phase 1 (Current)**: Use on-chain Bitcoin + ckUSDC for stability
- **Phase 2 (Future)**: Add ckBTC for instant Bitcoin transfers on ICP
- **Phase 3 (Long-term)**: Integrate Lightning when ICP supports it natively

---

## Implementation Plan: ckUSDC Integration

### Phase 1: Backend Canister Setup (Week 1)

#### 1.1 Create ckUSDC Service Canister
```rust
// src/afritokeni_backend/src/ckerc20_service.rs

use ic_cdk::api::call::call;
use candid::{CandidType, Principal};

#[derive(CandidType)]
pub struct CkUSDCConfig {
    pub ledger_canister_id: Principal,
    pub minter_canister_id: Principal,
    pub helper_contract_address: String,
}

// Get ckUSDC balance for a principal
pub async fn get_ckusdc_balance(principal: Principal) -> Result<u64, String> {
    // Call ledger canister to get balance
}

// Convert Principal to Byte32 for Ethereum deposits
pub fn principal_to_byte32(principal: Principal) -> String {
    // Convert ICP Principal to Ethereum-compatible address
}

// Store transaction hash after deposit
pub fn store_deposit_hash(hash: String) -> Result<(), String> {
    // Store in stable memory for tracking
}
```

#### 1.2 Update Juno Collections
```typescript
// Add new collection: ckusdc_transactions
{
  collection: "ckusdc_transactions",
  fields: {
    userId: string,
    txHash: string,
    amount: number,
    currency: string,
    type: "deposit" | "withdrawal" | "exchange",
    status: "pending" | "confirmed" | "failed",
    timestamp: Date
  }
}
```

### Phase 2: Frontend Integration (Week 2)

#### 2.1 Create ckUSDC Service
```typescript
// src/services/ckUSDCService.ts

import { ethers } from 'ethers';
import { Principal } from '@dfinity/principal';

export class CkUSDCService {
  private static SEPOLIA_USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  private static MINTER_HELPER_ADDRESS = "..."; // From tutorial
  
  // Approve USDC spending
  static async approveUSDC(amount: number): Promise<string> {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      this.SEPOLIA_USDC_ADDRESS,
      erc20ABI,
      signer
    );
    
    const amountInSmallestUnit = ethers.utils.parseUnits(amount.toString(), 6);
    const tx = await contract.approve(this.MINTER_HELPER_ADDRESS, amountInSmallestUnit);
    await tx.wait();
    return tx.hash;
  }
  
  // Deposit USDC to get ckUSDC
  static async depositUSDC(amount: number, principalId: string): Promise<string> {
    // Convert Principal to Byte32
    const byte32Address = await this.convertPrincipalToByte32(principalId);
    
    // Deposit via helper contract
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      this.MINTER_HELPER_ADDRESS,
      helperABI,
      signer
    );
    
    const tx = await contract.deposit(
      this.SEPOLIA_USDC_ADDRESS,
      ethers.utils.parseUnits(amount.toString(), 6),
      byte32Address
    );
    await tx.wait();
    return tx.hash;
  }
  
  // Check ckUSDC balance on ICP
  static async getBalance(principalId: string): Promise<number> {
    // Call backend canister
    const principal = Principal.fromText(principalId);
    const balance = await backend.check_ckusdc_balance(principal);
    return Number(balance) / 1e6; // Convert from smallest unit
  }
}
```

#### 2.2 Update User Dashboard
```typescript
// Add ckUSDC balance card alongside Bitcoin balance
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Local Currency Balance */}
  <BalanceCard currency={user.preferredCurrency} amount={localBalance} />
  
  {/* Bitcoin Balance */}
  <BalanceCard currency="BTC" amount={btcBalance} />
  
  {/* NEW: ckUSDC Balance */}
  <BalanceCard 
    currency="ckUSDC" 
    amount={ckusdcBalance}
    icon={<DollarSign className="text-green-500" />}
  />
</div>
```

### Phase 3: SMS Integration (Week 3)

#### 3.1 New SMS Commands
```
USDC BAL                    - Check ckUSDC balance
USDC DEPOSIT [amount]       - Get deposit instructions
USDC SEND +256... [amount]  - Send ckUSDC to another user
USDC BUY [amount] [currency] - Buy ckUSDC with local currency via agent
USDC SELL [amount] [currency] - Sell ckUSDC for local currency
```

#### 3.2 SMS Processing Logic
```typescript
// src/services/smsService.ts - Add ckUSDC handlers

async function processSMSCommand(command: string, userId: string): Promise<string> {
  const parts = command.toUpperCase().split(' ');
  
  if (parts[0] === 'USDC') {
    switch (parts[1]) {
      case 'BAL':
        return await handleUSDCBalance(userId);
      case 'DEPOSIT':
        return await handleUSDCDeposit(userId, parseFloat(parts[2]));
      case 'SEND':
        return await handleUSDCSend(userId, parts[2], parseFloat(parts[3]));
      case 'BUY':
        return await handleUSDCBuy(userId, parseFloat(parts[2]), parts[3]);
      case 'SELL':
        return await handleUSDCSell(userId, parseFloat(parts[2]), parts[3]);
    }
  }
}
```

### Phase 4: Agent Integration (Week 4)

#### 4.1 Agent ckUSDC Features
- **Buy ckUSDC from Users**: Agent gives cash, receives ckUSDC
- **Sell ckUSDC to Users**: Agent receives cash, sends ckUSDC
- **ckUSDC Liquidity Management**: Agents maintain ckUSDC reserves
- **Auto-Conversion**: Option to auto-convert Bitcoin ↔ ckUSDC based on volatility

#### 4.2 Agent Dashboard Updates
```typescript
// Add ckUSDC management section
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <AgentBalanceCard title="Cash Balance" amount={cashBalance} />
  <AgentBalanceCard title="Digital Balance" amount={digitalBalance} />
  <AgentBalanceCard title="Bitcoin Balance" amount={btcBalance} />
  <AgentBalanceCard title="ckUSDC Reserve" amount={ckusdcBalance} /> {/* NEW */}
</div>
```

---

## Business Logic: Three-Asset System

### Asset Types in AfriTokeni
1. **Local African Currencies** (NGN, KES, GHS, UGX, etc.)
   - Primary user balance
   - Used for daily transactions
   - Agent cash exchanges

2. **Bitcoin (BTC)**
   - Investment/savings asset
   - Cross-border transfers
   - Volatile but valuable

3. **ckUSDC (NEW)**
   - Stable value storage
   - Price-stable transactions
   - Agent liquidity reserves
   - Remittance stability

### Exchange Flows
```
User Flow Options:
1. Cash → Local Currency → ckUSDC (stable savings)
2. Cash → Local Currency → Bitcoin (investment)
3. ckUSDC → Local Currency → Cash (stable withdrawal)
4. Bitcoin → Local Currency → Cash (BTC sale)
5. ckUSDC ↔ Bitcoin (rebalancing)

Agent Flow Options:
1. Maintain ckUSDC reserves for stable liquidity
2. Convert excess Bitcoin to ckUSDC during volatility
3. Offer ckUSDC exchange services to users
```

---

## Migration Strategy

### Backward Compatibility
- ✅ Existing Bitcoin flows remain unchanged
- ✅ SMS commands for BTC still work
- ✅ No breaking changes to current users
- ✅ ckUSDC is OPTIONAL, not required

### User Communication
```
SMS Announcement:
"AfriTokeni now supports USDC stablecoin! Keep stable value without Bitcoin volatility. 
Send 'USDC HELP' for commands. Your Bitcoin balance is safe and unchanged."
```

### Agent Onboarding
- Train agents on ckUSDC benefits
- Provide initial ckUSDC liquidity
- Update agent training materials
- Add ckUSDC to commission structure

---

## Security Considerations

### Smart Contract Risks
1. **Minter Canister Security**: Audited by DFINITY
2. **Ethereum Bridge Risk**: Sepolia testnet initially (move to mainnet later)
3. **Principal Conversion**: Ensure correct Byte32 address generation
4. **Transaction Verification**: Confirm deposits before minting ckUSDC

### User Protection
1. **Escrow for ckUSDC Exchanges**: Same as Bitcoin escrow system
2. **Transaction Limits**: Daily limits for ckUSDC transfers
3. **KYC Requirements**: Same KYC for ckUSDC as Bitcoin
4. **Agent Verification**: Agents must be verified to handle ckUSDC

---

## Testing Plan

### Phase 1: Testnet (Sepolia)
- [ ] Deploy ckUSDC integration on Sepolia testnet
- [ ] Test deposit flow (Ethereum → ICP)
- [ ] Test withdrawal flow (ICP → Ethereum)
- [ ] Test SMS commands with test users
- [ ] Test agent exchange flows

### Phase 2: Mainnet Preparation
- [ ] Security audit of ckUSDC integration
- [ ] Load testing with 1000+ simulated users
- [ ] Agent training and certification
- [ ] User education materials

### Phase 3: Gradual Rollout
- [ ] Beta launch with 10 agents in Kampala
- [ ] Monitor for 2 weeks
- [ ] Expand to 100 agents across Uganda
- [ ] Full launch after 1 month

---

## Success Metrics

### Technical Metrics
- ckUSDC transaction success rate > 99%
- Average deposit confirmation time < 5 minutes
- SMS command response time < 3 seconds
- Zero security incidents

### Business Metrics
- 30% of users adopt ckUSDC within 3 months
- 50% of agents maintain ckUSDC reserves
- 20% reduction in Bitcoin volatility complaints
- 40% increase in stable value storage

---

## Resources & References

### Official Documentation
- [ckERC20 Tutorial](https://github.com/Stephen-Kimoi/ckERC20-tutorial)
- [ICP Bitcoin Integration](https://internetcomputer.org/bitcoin-integration/faq)
- [Bitcoin DeFi on ICP](https://bitcoindefi.dev/)
- [DFINITY Developer Docs](https://internetcomputer.org/docs)

### Technical Dependencies
- `@dfinity/principal` - Principal ID handling
- `ethers.js` - Ethereum interaction
- `@dfinity/agent` - ICP canister calls
- Circle USDC contracts (Sepolia testnet)

---

## Next Steps

1. **Immediate**: Review this plan with team
2. **Week 1**: Set up ckUSDC testnet environment
3. **Week 2**: Implement backend canister integration
4. **Week 3**: Build frontend UI for ckUSDC
5. **Week 4**: SMS integration and testing
6. **Week 5**: Agent training and beta launch

---

## Questions to Resolve

1. **Mainnet Timeline**: When to move from Sepolia to Ethereum mainnet?
2. **Fee Structure**: What commission for ckUSDC exchanges?
3. **Liquidity**: How to bootstrap initial ckUSDC liquidity for agents?
4. **Regulation**: Any regulatory concerns with stablecoins in Uganda?
5. **Lightning**: Should we wait for ICP Lightning support or use external APIs?

---

**Status**: Planning Phase  
**Branch**: `feature/ckerc20-stablecoin-integration`  
**Last Updated**: 2025-10-09  
**Owner**: AfriTokeni Development Team
