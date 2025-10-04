# AfriTokeni DAO Architecture

## 🏗️ Architecture Decision: SNS (Not Custom Juno DAO)

We're using **ICP's Service Nervous System (SNS)** for production-grade DAO governance instead of building custom logic.

### Why SNS?

1. **ICP Hackathon Alignment** - Shows deep ICP ecosystem understanding
2. **Production Ready** - Battle-tested by OpenChat, Sonic, etc.
3. **ICRC-1 Standard** - Industry-standard token
4. **On-chain Execution** - Proposals execute automatically
5. **Community Trust** - Recognized DAO framework

## 📊 Current Implementation Status

### ✅ Completed
- **SNS Configuration** (`sns_init.yaml`)
  - Token distribution (45% community, 20% investors, 20% treasury, 10% team, 5% advisors)
  - Governance parameters
  - Voting rewards structure

- **Deployment Scripts** (`deploy-sns.sh`)
  - Local testing setup
  - Mainnet deployment ready

- **Service Layer** (Prepared for SNS)
  - `afriTokenService.ts` - Structured for ICRC-1 ledger calls
  - `governanceService.ts` - Structured for SNS governance calls
  - All Juno-specific code removed/commented

- **Frontend** (`DAODashboard.tsx`)
  - UI ready for SNS integration
  - SMS voting commands implemented

### ⏳ Pending (Post-SNS Deployment)

1. **SNS Canister Integration**
   ```typescript
   // Replace TODO comments with actual SNS calls
   import { Actor, HttpAgent } from '@dfinity/agent';
   import { idlFactory as ledgerIdl } from './sns_ledger.did.js';
   import { idlFactory as governanceIdl } from './sns_governance.did.js';
   ```

2. **ICRC-1 Ledger Calls**
   - `icrc1_balance_of()` - Get token balance
   - `icrc1_transfer()` - Reward users
   - `icrc1_total_supply()` - Get total supply

3. **SNS Governance Calls**
   - `manage_neuron()` - Create proposals, vote, stake
   - `list_proposals()` - Get active proposals
   - `get_proposal()` - Get proposal details

## 🔄 Data Flow

### Current (Temporary)
```
SMS/Web → Our Services → Mock Data → Response
```

### After SNS Deployment
```
SMS/Web → Our Services → SNS Canisters → ICP Blockchain → Response
```

### SMS Voting Flow
```
1. User: "VOTE YES PROP-001" via SMS
2. SMS Gateway → Our Backend Canister
3. Backend → SNS Governance Canister
4. SNS records vote on-chain
5. SMS confirmation sent to user
```

## 🎯 Integration Steps

### Step 1: Deploy SNS
```bash
chmod +x deploy-sns.sh
./deploy-sns.sh
```

### Step 2: Get Canister IDs
```bash
dfx canister id sns_governance --network ic
dfx canister id sns_ledger --network ic
dfx canister id sns_root --network ic
```

### Step 3: Update Frontend
Replace TODO comments in services with actual SNS calls using canister IDs.

### Step 4: Test SMS Integration
```
User SMS: AFRI
Response: Balance from SNS ledger

User SMS: VOTE YES PROP-001
Response: Vote recorded on SNS
```

## 📝 Key Differences: Custom DAO vs SNS

| Feature | Custom (Juno) | SNS (ICP) |
|---------|--------------|-----------|
| Token Standard | Custom | ICRC-1 (Standard) |
| Storage | Juno Datastore | ICP Canisters |
| Governance | Custom Logic | SNS Framework |
| Execution | Manual | Automatic On-chain |
| DEX Listing | Manual | Automatic |
| Credibility | Lower | Higher (ICP Official) |
| Hackathon Impact | Medium | **HIGH** ✨ |

## 🚀 Why This Wins the Hackathon

1. **Technical Sophistication**
   - Using ICP's flagship DAO technology
   - ICRC-1 token standard compliance
   - On-chain governance execution

2. **Innovation**
   - **First SMS-accessible SNS DAO**
   - Bringing ICP governance to feature phones
   - 14.6M unbanked Ugandans can vote on-chain

3. **Real-World Impact**
   - Production-ready from day 1
   - Can scale to millions of users
   - True decentralization via SNS

4. **Ecosystem Integration**
   - Automatic DEX listings
   - ICP treasury grant eligible
   - Community recognition

## 📚 Resources

- [SNS Documentation](https://internetcomputer.org/docs/current/developer-docs/daos/sns/)
- [ICRC-1 Standard](https://github.com/dfinity/ICRC-1)
- [SNS Examples](https://github.com/dfinity/sns-testing)

---

**Status**: Ready for SNS deployment  
**Next Step**: Deploy SNS and integrate canister IDs  
**Impact**: First SMS-accessible SNS DAO in the world 🌍
