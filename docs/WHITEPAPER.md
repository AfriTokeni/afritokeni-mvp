# AfriTokeni Whitepaper
## SMS-Accessible Crypto Banking for Africa

**Version 1.0 | October 2025**

---

## Executive Summary

AfriTokeni is a revolutionary financial inclusion platform that brings instant, low-cost cryptocurrency banking to Africa's 14.6 million unbanked adults. By leveraging the Internet Computer Protocol (ICP) and USSD technology, we enable Bitcoin and stablecoin transactions on any phone—no internet required.

### Key Innovation
- **ckBTC (ICP Bitcoin)**: Instant Bitcoin transfers in <1 second with ~$0.01 fees
- **ckUSDC (Stablecoin)**: Volatility protection with 1:1 USD peg
- **USSD Access**: Works on 100% of phones, including feature phones
- **Agent Network**: Physical cash-to-crypto exchange through verified local agents
- **DAO Governance**: Community-owned platform with SMS voting

### Market Opportunity
- **Target Market**: 54% unbanked adults in Uganda (14.6M people)
- **Total Addressable Market**: $133B mobile money market growing at 25.73% annually
- **Infrastructure**: 98% 2G coverage, 84% feature phone dominance
- **Cost Advantage**: 83% cheaper than current mobile money solutions

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [Three-Asset System](#4-three-asset-system)
5. [USSD Banking Interface](#5-ussd-banking-interface)
6. [Security & Escrow](#6-security--escrow)
7. [Agent Network](#7-agent-network)
8. [DAO Governance](#8-dao-governance)
9. [Revenue Model](#9-revenue-model)
10. [Roadmap](#10-roadmap)

---

## 1. Problem Statement

### 1.1 Financial Exclusion in Africa

**14.6 million Ugandans** (54% of adults) remain unbanked despite widespread mobile phone adoption. Traditional financial services fail to serve:

- **Rural populations**: Banks won't operate in remote villages
- **Feature phone users**: 84% of Ugandans use basic phones without internet
- **Low-income individuals**: High fees (up to 13%) make small transactions unviable
- **Cross-border workers**: Remittances cost 5-10% in fees

### 1.2 Current Solutions Fall Short

**Mobile Money (M-Pesa, MTN MoMo, Airtel Money)**:
- ❌ High fees: 10-13% total cost (fees + FX markup)
- ❌ Limited coverage: Only works within specific countries
- ❌ Centralized control: Single point of failure
- ❌ No Bitcoin access: Can't participate in global crypto economy

**Bitcoin/Crypto**:
- ❌ Requires smartphone + internet
- ❌ Slow: 10-60 minute confirmations
- ❌ Expensive: $1-50 transaction fees
- ❌ Volatile: Price swings make it unsuitable for daily use

### 1.3 The Gap

There is no solution that provides:
1. **Instant** cryptocurrency transfers (<1 second)
2. **Cheap** fees (~$0.01 per transaction)
3. **Accessible** via SMS/USSD on any phone
4. **Stable** value option to avoid volatility
5. **Decentralized** infrastructure resistant to censorship

**AfriTokeni fills this gap.**

---

## 2. Solution Overview

### 2.1 Core Value Proposition

AfriTokeni provides **instant, low-cost crypto banking accessible via USSD** on any phone, combining:

1. **ckBTC (ICP Bitcoin)**: Fast Bitcoin for those who want speed
2. **ckUSDC (Stablecoin)**: Stable value for those who want predictability
3. **Local Currencies**: 39 African currencies for daily transactions
4. **Agent Network**: Physical cash on/off ramps
5. **DAO Governance**: Community ownership and control

### 2.2 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Feature Phone          Smartphone                      │
│  ┌──────────┐          ┌──────────┐                    │
│  │ Dial     │          │  Web     │                    │
│  │ *123#    │          │  App     │                    │
│  │          │          │          │                    │
│  │ USSD     │          │ Full UI  │                    │
│  │ Menu     │          │ Dashboard│                    │
│  └──────────┘          └──────────┘                    │
│       │                     │                           │
│       └─────────┬───────────┘                          │
│                 │                                       │
│                 ▼                                       │
│      ┌─────────────────────┐                          │
│      │  ICP Blockchain     │                          │
│      │  (Juno Platform)    │                          │
│      └─────────────────────┘                          │
│                 │                                       │
│       ┌─────────┴─────────┐                           │
│       │                   │                           │
│       ▼                   ▼                           │
│  ┌─────────┐         ┌─────────┐                     │
│  │ ckBTC   │         │ ckUSDC  │                     │
│  │ Service │         │ Service │                     │
│  └─────────┘         └─────────┘                     │
│       │                   │                           │
│       └─────────┬─────────┘                          │
│                 │                                       │
│                 ▼                                       │
│      ┌─────────────────────┐                          │
│      │  Agent Network      │                          │
│      │  (Cash Exchange)    │                          │
│      └─────────────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Key Differentiators

| Feature | AfriTokeni | Mobile Money | Traditional Crypto |
|---------|------------|--------------|-------------------|
| **Speed** | <1 second | Minutes-Hours | 10-60 minutes |
| **Fees** | ~$0.01 | 10-13% | $1-50 |
| **Access** | Any phone (USSD) | Any phone (SMS) | Smartphone only |
| **Stability** | ckUSDC option | Yes | No |
| **Bitcoin** | ckBTC included | No | Yes |
| **Decentralized** | Yes (ICP) | No | Yes |
| **Coverage** | 39 countries | 1-3 countries | Global |

---

## 3. Technical Architecture

### 3.1 Technology Stack

**Frontend**:
- React 19.2 with TypeScript
- TailwindCSS for styling
- Vite 7 for build tooling
- React Router for navigation

**Backend**:
- Juno (ICP) for decentralized storage
- ICP Canisters for smart contracts
- ICRC-1 standard for token operations
- Internet Identity for authentication

**Blockchain Integration**:
- ckBTC: ICP-native Bitcoin (1:1 backed)
- ckUSDC: ICP-native USDC stablecoin
- Principal-based addressing
- Chain-key cryptography

**Communication**:
- Africa's Talking SMS Gateway
- USSD session management
- Webhook processing
- Multi-language support (English, Luganda, Swahili)

### 3.2 ICP-Native Architecture

AfriTokeni runs entirely on the Internet Computer Protocol:

```
┌────────────────────────────────────────────────────┐
│              ICP CANISTER ARCHITECTURE             │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  Frontend    │  │  Datastore   │              │
│  │  Canister    │  │  Canister    │              │
│  │  (Juno)      │  │  (Juno)      │              │
│  └──────────────┘  └──────────────┘              │
│         │                  │                       │
│         └────────┬─────────┘                      │
│                  │                                 │
│         ┌────────┴────────┐                       │
│         │                 │                       │
│    ┌────▼────┐      ┌────▼────┐                 │
│    │ ckBTC   │      │ ckUSDC  │                 │
│    │ Ledger  │      │ Ledger  │                 │
│    │ Canister│      │ Canister│                 │
│    └────┬────┘      └────┬────┘                 │
│         │                 │                       │
│    ┌────▼────┐      ┌────▼────┐                 │
│    │ ckBTC   │      │ ckUSDC  │                 │
│    │ Minter  │      │ Minter  │                 │
│    │ Canister│      │ Canister│                 │
│    └─────────┘      └─────────┘                 │
│                                                     │
└────────────────────────────────────────────────────┘
```

**Key Benefits**:
- **No AWS/Google Cloud**: Pure blockchain infrastructure
- **Censorship Resistant**: No single point of failure
- **Low Cost**: ~$0.01 per transaction
- **Instant Finality**: <1 second confirmations
- **Scalable**: Handles millions of transactions per day

### 3.3 Data Architecture

**Collections** (Juno Datastore):
- `users`: User profiles and authentication
- `agents`: Agent network information
- `transactions`: All financial transactions
- `ckbtc_transactions`: ckBTC-specific operations
- `ckusdc_transactions`: ckUSDC-specific operations
- `escrow_transactions`: Secure exchange codes
- `pending_transactions`: Two-step confirmations
- `withdrawal_requests`: Cash withdrawal processing
- `deposit_requests`: Cash deposit processing

**Security**:
- Principal-based authentication
- PIN verification for USSD users
- Rate limiting (10 requests/minute)
- Fraud detection algorithms
- Multi-signature for large transactions

---

## 4. Three-Asset System

AfriTokeni provides three types of assets to meet different user needs:

### 4.1 Local African Currencies

**Purpose**: Daily transactions and cash services

**Supported Currencies**: 39 African currencies
- Nigeria (NGN), Kenya (KES), Ghana (GHS), South Africa (ZAR)
- Uganda (UGX), Tanzania (TZS), Rwanda (RWF), Ethiopia (ETB)
- And 31 more across the continent

**Use Cases**:
- Sending money to family/friends
- Paying for goods and services
- Receiving payments
- Cash deposits/withdrawals via agents

**How It Works**:
- Digital balances stored in Juno
- Backed by agent liquidity pools
- Real-time exchange rates
- Instant transfers between users

### 4.2 ckBTC (ICP Bitcoin)

**Purpose**: Fast Bitcoin for speed-focused users

**Specifications**:
- **Backing**: 1:1 with real Bitcoin
- **Speed**: <1 second transfers
- **Fees**: ~$0.01 per transaction
- **Standard**: ICRC-1 token on ICP
- **Decimals**: 8 (same as Bitcoin)

**Advantages**:
- ✅ Instant transfers (vs 10-60 min for Bitcoin)
- ✅ Near-zero fees (vs $1-50 for Bitcoin)
- ✅ USSD accessible (vs smartphone-only)
- ✅ ICP security (chain-key cryptography)

**Use Cases**:
- International remittances
- Store of value
- Bitcoin trading
- Cross-border payments

**Technical Implementation**:
```typescript
// ckBTC Transfer
await CkBTCService.transfer({
  senderId: userPrincipal,
  recipient: recipientPrincipal,
  amount: 0.001, // BTC
  memo: "Payment for goods"
});
// Completes in <1 second with ~$0.01 fee
```

### 4.3 ckUSDC (Stablecoin)

**Purpose**: Stable value for volatility-averse users

**Specifications**:
- **Peg**: 1:1 with US Dollar
- **Speed**: <1 second transfers
- **Fees**: ~$0.01 per transaction
- **Standard**: ICRC-1 token on ICP
- **Decimals**: 6 (same as USDC)

**Advantages**:
- ✅ No volatility (stable $1 value)
- ✅ Instant transfers
- ✅ Near-zero fees
- ✅ USSD accessible
- ✅ Perfect for savings

**Use Cases**:
- Savings accounts
- Salary payments
- Merchant payments
- Remittances (stable value)

**Why ckUSDC Matters**:
Many Africans want crypto benefits (speed, low fees, accessibility) WITHOUT Bitcoin's price volatility. ckUSDC provides:
- Predictable value for budgeting
- Protection from inflation
- Stable store of wealth
- Peace of mind for daily use

### 4.4 Asset Comparison

| Feature | Local Currency | ckBTC | ckUSDC |
|---------|---------------|-------|--------|
| **Speed** | Instant | Instant | Instant |
| **Fees** | 2.5-12% | ~$0.01 | ~$0.01 |
| **Volatility** | Moderate | High | None |
| **Use Case** | Daily transactions | Bitcoin exposure | Stable savings |
| **USSD Access** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cash Exchange** | ✅ Via agents | ✅ Via agents | ✅ Via agents |

---

## 5. USSD Banking Interface

### 5.1 Why USSD?

**USSD (Unstructured Supplementary Service Data)** is perfect for Africa:

- **Works on 100% of phones**: Feature phones and smartphones
- **No internet required**: Uses cellular network signaling
- **Session-based**: Interactive menus like ATMs
- **Instant**: Real-time responses
- **Familiar**: Africans already use USSD for mobile money

### 5.2 USSD Menu Structure

```
*123# → AfriTokeni Main Menu

1. Send Money
   1.1 Send Local Currency
   1.2 Send ckBTC
   1.3 Send ckUSDC

2. Check Balance
   2.1 Local Currency Balance
   2.2 ckBTC Balance
   2.3 ckUSDC Balance

3. Cash Services
   3.1 Deposit Cash (via agent)
   3.2 Withdraw Cash (via agent)

4. Exchange
   4.1 Buy ckBTC
   4.2 Buy ckUSDC
   4.3 Sell ckBTC
   4.4 Sell ckUSDC

5. Find Agents
   5.1 Nearest agents
   5.2 By location

6. Transaction History
   6.1 Last 10 transactions
   6.2 This month
   6.3 Search by date

7. Account
   7.1 Profile
   7.2 Change PIN
   7.3 Help

8. DAO Governance
   8.1 View proposals
   8.2 Vote on proposal
   8.3 Create proposal
```

### 5.3 Example USSD Flows

**Send ckBTC**:
```
User: *123#
System: Welcome to AfriTokeni
1. Send Money
2. Check Balance
...

User: 1
System: Send Money
1. Local Currency
2. ckBTC
3. ckUSDC

User: 2
System: Send ckBTC
Enter amount (BTC):

User: 0.001
System: Send 0.001 ckBTC
Enter recipient phone:

User: +256700123456
System: Confirm:
Send 0.001 ckBTC (~$42.50)
To: +256700123456
Fee: ~$0.01
1. Confirm
2. Cancel

User: 1
System: ✅ Sent!
0.001 ckBTC sent to +256700123456
Completed in <1 second
```

**Check ckUSDC Balance**:
```
User: *123#
System: AfriTokeni Menu
...
2. Check Balance

User: 2
System: Check Balance
1. Local Currency
2. ckBTC
3. ckUSDC

User: 3
System: ckUSDC Balance:
$125.50 USDC
(≈ 471,375 UGX)

Last transaction:
Received $50 from John
2 hours ago
```

### 5.4 Multi-Language Support

All USSD menus available in:
- **English**: Primary language
- **Luganda**: Uganda's main local language
- **Swahili**: East Africa lingua franca

Language auto-detected or user-selectable.

---

## 6. Security & Escrow

### 6.1 Escrow System

**Problem**: How do you trust an agent you've never met?

**Solution**: AfriTokeni holds crypto in escrow until both parties confirm.

**How It Works**:

1. **User initiates exchange**:
   - Selects amount and agent
   - AfriTokeni generates unique escrow address
   - 6-digit exchange code created (e.g., `BTC-847291` or `USD-123456`)

2. **User sends crypto**:
   - Sends ckBTC/ckUSDC to escrow address
   - AfriTokeni holds funds securely
   - Agent notified when funds confirmed

3. **In-person meeting**:
   - User meets agent at agreed location
   - User shows exchange code
   - Agent verifies identity

4. **Agent scans code**:
   - Agent enters code in app
   - AfriTokeni releases crypto to agent
   - User receives cash instantly

5. **Safety mechanisms**:
   - 24-hour automatic refund if not completed
   - Dispute resolution system
   - Agent reputation tracking
   - GPS location verification

**Benefits**:
- ✅ User protected: Agent can't take crypto without code
- ✅ Agent protected: Can't be scammed with fake transactions
- ✅ Platform protected: Escrow prevents fraud
- ✅ Transparent: All parties see transaction status

### 6.2 Security Features

**Authentication**:
- Internet Identity for web users
- PIN verification for USSD users
- Two-factor authentication option
- Biometric support (web)

**Transaction Security**:
- Two-step confirmation for large amounts
- Rate limiting (10 requests/minute)
- Fraud detection algorithms
- Suspicious activity alerts

**Data Protection**:
- End-to-end encryption
- ICP decentralized storage
- No single point of failure
- GDPR compliant

**Agent Verification**:
- KYC requirements
- Background checks
- Liquidity requirements
- Performance monitoring
- Rating system

---

## 7. Agent Network

### 7.1 Agent Role

Agents are the physical bridge between digital crypto and physical cash. They:

- **Accept cash deposits**: Convert cash → digital balance
- **Process withdrawals**: Convert digital balance → cash
- **Exchange crypto**: Buy/sell ckBTC and ckUSDC
- **Provide support**: Help users with transactions
- **Build trust**: Local presence in communities

### 7.2 Agent Economics

**Revenue Streams**:
1. **Transaction fees**: 2.5-12% based on location
2. **Exchange spreads**: 1-2% on crypto trades
3. **Premium services**: Express/emergency fees (+30-80%)
4. **Liquidity provision**: Interest on reserves

**Fee Structure** (Dynamic Pricing):

| Location | Base Fee | Typical Range |
|----------|----------|---------------|
| Urban (City) | 2.5% | 2.5-4% |
| Suburban | 3.5% | 3-5% |
| Rural (Village) | 5.5% | 4-7% |
| Remote Area | 9.5% | 7-12% |

**Additional Factors**:
- **Distance**: +0.5-5% based on km from user
- **Time**: Night +40%, Weekend +15%
- **Urgency**: Express +30%, Emergency +80%
- **Market demand**: Dynamic adjustment

**Example Earnings**:
- Urban agent: $50-100/day (100-200 transactions)
- Rural agent: $30-60/day (30-60 transactions)
- Remote agent: $20-40/day (10-20 transactions)

### 7.3 Agent Requirements

**To become an agent**:
1. **KYC Verification**: Government ID, proof of address
2. **Liquidity**: Minimum $500 cash + $500 crypto
3. **Location**: Physical storefront or known location
4. **Training**: Complete agent certification
5. **Equipment**: Smartphone with AfriTokeni app

**Agent Benefits**:
- Flexible working hours
- Be your own boss
- Serve your community
- Earn competitive income
- Build local reputation

---

## 8. DAO Governance

### 8.1 Community Ownership

AfriTokeni is governed by its users through a Decentralized Autonomous Organization (DAO):

**Governance Token**: AFRI
- **Total Supply**: 1,000,000,000 AFRI
- **Distribution**:
  - 40% Agents (400M)
  - 30% Users (300M)
  - 20% Treasury (200M)
  - 10% Team (100M, 4-year vesting)

**Earning AFRI Tokens**:
- **Users**: Earn per transaction volume
- **Agents**: Earn per transaction processed
- **Referrals**: Bonus for bringing new users
- **Governance**: Bonus for voting participation

### 8.2 Voting Power

**1 AFRI = 1 Vote**

**Vote via**:
- Web dashboard (full interface)
- USSD commands (SMS voting)
- Mobile app

**Voting Process**:
```
USSD: *123*8*2# → Vote on Proposal

System: Proposal #42
"Reduce urban agent fees from 3% to 2.5%"

Proposed by: Agent Association
Voting ends: 3 days

Current votes:
✅ Yes: 45,234,123 AFRI (62%)
❌ No: 27,891,456 AFRI (38%)

Your voting power: 1,250 AFRI

1. Vote YES
2. Vote NO
3. View details

User: 1

System: ✅ Vote recorded!
You voted YES with 1,250 AFRI
Thank you for participating!
```

### 8.3 Governance Scope

**What the DAO controls**:
- Fee structures (agent commissions, platform fees)
- New currency additions
- Agent standards and requirements
- Treasury management
- Platform upgrades
- Dispute resolution policies
- Marketing budget allocation

**Proposal Types**:
1. **Fee Adjustments**: Change transaction fees
2. **Currency Addition**: Add new African currencies
3. **Agent Standards**: Update agent requirements
4. **Treasury Spending**: Allocate funds
5. **Technical Upgrades**: Approve platform changes
6. **Policy Changes**: Update terms and policies

**Proposal Requirements**:
- Minimum 10,000 AFRI to create proposal
- 7-day voting period
- 51% approval threshold
- 10% quorum requirement

### 8.4 Treasury Management

**Treasury Holdings**:
- Platform fees (0.5% of all transactions)
- Agent liquidity pool
- Insurance fund
- Development fund
- Marketing budget

**Treasury Uses** (DAO-approved):
- Agent liquidity support
- User insurance claims
- Platform development
- Marketing campaigns
- Community grants
- Emergency reserves

---

## 9. Revenue Model

### 9.1 Revenue Streams

**1. Platform Fees** (0.5% of all transactions)
- Charged on every transfer
- Transparent and predictable
- Lower than competitors (10-13%)

**2. Agent Network Fees** (10% of agent commissions)
- Platform takes 10% of agent earnings
- Agents keep 90%
- Incentivizes agent growth

**3. Exchange Spreads** (0.5% on crypto trades)
- Small spread on ckBTC/ckUSDC exchanges
- Competitive with market rates
- Transparent pricing

**4. Premium Services**
- Express transactions: +30% fee
- Emergency transactions: +80% fee
- Priority support: Subscription
- API access: Enterprise pricing

### 9.2 Financial Projections

**Year 1** (10,000 users, 100 agents):
- Monthly transactions: $500,000
- Platform fees (0.5%): $2,500/month
- Agent fees (10% of commissions): $2,000/month
- Exchange spreads: $1,500/month
- **Total Monthly Revenue**: $6,000
- **Annual Revenue**: $72,000

**Year 2** (100,000 users, 1,000 agents):
- Monthly transactions: $5,000,000
- Platform fees: $25,000/month
- Agent fees: $20,000/month
- Exchange spreads: $15,000/month
- **Total Monthly Revenue**: $60,000
- **Annual Revenue**: $720,000

**Year 3** (1,000,000 users, 10,000 agents):
- Monthly transactions: $50,000,000
- Platform fees: $250,000/month
- Agent fees: $200,000/month
- Exchange spreads: $150,000/month
- **Total Monthly Revenue**: $600,000
- **Annual Revenue**: $7,200,000

**Year 5** (10,000,000 users, 100,000 agents):
- Monthly transactions: $500,000,000
- Platform fees: $2,500,000/month
- Agent fees: $2,000,000/month
- Exchange spreads: $1,500,000/month
- **Total Monthly Revenue**: $6,000,000
- **Annual Revenue**: $72,000,000

### 9.3 Cost Structure

**Fixed Costs**:
- ICP hosting: $500/month
- SMS gateway: $1,000/month
- Development team: $15,000/month
- Operations: $3,000/month
- **Total Fixed**: $19,500/month

**Variable Costs**:
- Transaction processing: 0.1% of volume
- Customer support: Scales with users
- Marketing: 20% of revenue

**Break-even**: ~5,000 active users

---

## 10. Roadmap

### Phase 1: Foundation (Q4 2025) ✅ COMPLETE

**Deliverables**:
- ✅ Core platform (React + ICP)
- ✅ ckBTC integration
- ✅ ckUSDC integration
- ✅ USSD interface
- ✅ Agent dashboard
- ✅ Escrow system
- ✅ Multi-currency support (39 currencies)
- ✅ DAO governance framework

**Status**: Production-ready MVP deployed

### Phase 2: Launch (Q1 2026)

**Goals**:
- Deploy to ICP mainnet
- Launch in Uganda (pilot market)
- Onboard 100 agents
- Acquire 10,000 users
- Process $500K monthly volume

**Milestones**:
- Africa's Talking SMS integration
- Real ckBTC/ckUSDC canister deployment
- Agent training program
- Marketing campaign launch
- KYC automation

### Phase 3: Scale (Q2-Q3 2026)

**Goals**:
- Expand to Kenya, Nigeria, Ghana
- Onboard 1,000 agents
- Acquire 100,000 users
- Process $5M monthly volume

**Features**:
- Mobile app (iOS/Android)
- Advanced analytics
- Agent insurance fund
- Referral program
- Multi-language expansion

### Phase 4: Continental (Q4 2026 - 2027)

**Goals**:
- All 39 African countries
- 10,000 agents
- 1,000,000 users
- $50M monthly volume

**Features**:
- Cross-border remittances
- Merchant payment system
- Savings products
- Micro-loans
- Insurance products

### Phase 5: Ecosystem (2028+)

**Vision**:
- 100,000 agents
- 10,000,000 users
- $500M monthly volume
- Full financial ecosystem

**Features**:
- DeFi integration
- NFT marketplace
- Tokenized assets
- Investment products
- Pan-African payment network

---

## Conclusion

AfriTokeni represents the future of financial inclusion in Africa. By combining:

- **ICP-native crypto** (ckBTC + ckUSDC)
- **USSD accessibility** (works on any phone)
- **Agent network** (physical cash bridge)
- **DAO governance** (community ownership)
- **Fair pricing** (83% cheaper than alternatives)

We provide a complete financial system that serves the unbanked, empowers agents, and builds wealth in African communities.

**The future of money is instant, affordable, and accessible to everyone.**

**Join us in banking the unbanked.**

---

## Contact & Resources

- **Website**: https://afritokeni.com
- **Live App**: https://dkk74-oyaaa-aaaal-askxq-cai.icp0.io/
- **GitHub**: https://github.com/AfriTokeni/afritokeni-mvp
- **Email**: hello@afritokeni.com
- **Twitter**: @AfriTokeni

**For Agents**: agent@afritokeni.com
**For Investors**: invest@afritokeni.com
**For Press**: press@afritokeni.com

---

**AfriTokeni Whitepaper v1.0**
**© 2025 AfriTokeni. All rights reserved.**
