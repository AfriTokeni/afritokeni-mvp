# AfriTokeni
## SMS-Accessible Crypto Banking for Africa

**Instant, low-cost cryptocurrency banking for Africa's 14.6M unbanked adults.**

---

## 🎯 What is AfriTokeni?

AfriTokeni brings Bitcoin and stablecoin banking to any phone—no internet required. Using USSD technology and the Internet Computer Protocol (ICP), we enable:

- **ckBTC (ICP Bitcoin)**: Instant transfers in <1 second with ~$0.01 fees
- **ckUSDC (Stablecoin)**: Stable value pegged to $1 USD
- **USSD Access**: Works on 100% of phones (feature phones + smartphones)
- **Agent Network**: Physical cash-to-crypto exchange
- **DAO Governance**: Community-owned with SMS voting

**83% cheaper than mobile money. 600x faster than Bitcoin. Accessible to everyone.**

---

## 📖 Documentation

### **[READ THE COMPLETE WHITEPAPER](./docs/WHITEPAPER.md)**

Everything you need to know about AfriTokeni:
- 🎯 Problem statement & solution
- 💰 Three-asset system (Local + ckBTC + ckUSDC)
- 📱 USSD banking interface
- 🔒 Security & escrow system
- 🏪 Agent network economics
- 🏛️ DAO governance
- 💵 Revenue model & projections
- 🚀 Roadmap to 10M users

---

## 🚀 Quick Start

### Live Application

**Production**: https://dkk74-oyaaa-aaaal-askxq-cai.icp0.io/

### Demo Video

[Watch the Demo](https://www.loom.com/share/f442426d1f754e9c91870c8efc45ce89)

### Local Development

```bash
# Clone the repository
git clone https://github.com/AfriTokeni/afritokeni-mvp.git
cd afritokeni-mvp

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🌟 Key Features

### For Users
- **Multi-Currency Wallets**: 39 African currencies (NGN, KES, GHS, UGX, etc.)
- **ckBTC**: Instant Bitcoin transfers (<1 sec, ~$0.01 fees)
- **ckUSDC**: Stable value ($1 peg, no volatility)
- **USSD Banking**: Works on any phone via *123#
- **Cash Services**: Deposit/withdraw via agent network
- **Send Money**: Transfer to anyone by phone number
- **DAO Voting**: Vote on platform decisions via SMS

### For Agents
- **Earn 2-12%**: Commission based on location
- **Flexible Hours**: Be your own boss
- **Crypto Exchange**: Buy/sell ckBTC and ckUSDC
- **Cash Services**: Process deposits and withdrawals
- **Dashboard**: Professional agent management tools
- **Liquidity Management**: Track cash and crypto reserves

### For the Platform
- **100% ICP-Native**: No AWS, no centralized servers
- **Decentralized**: Censorship-resistant infrastructure
- **Secure**: Escrow system with 6-digit codes
- **Scalable**: Handles millions of transactions
- **Community-Owned**: DAO governance with AFRI token

---

## 🏗️ Technical Stack

**Frontend**:
- React 19.2 + TypeScript
- TailwindCSS
- Vite 7
- React Router

**Backend**:
- Juno (ICP) - Decentralized storage
- ICP Canisters - Smart contracts
- ICRC-1 - Token standard
- Internet Identity - Authentication

**Blockchain**:
- ckBTC - ICP-native Bitcoin (1:1 backed)
- ckUSDC - ICP-native USDC stablecoin
- Chain-key cryptography
- <1 second finality

**Communication**:
- Africa's Talking SMS Gateway
- USSD session management
- Multi-language support (English, Luganda, Swahili)

---

## 📊 Market Opportunity

- **Target**: 14.6M unbanked Ugandans (54% of adults)
- **Market**: $133B mobile money market (25.73% annual growth)
- **Infrastructure**: 98% 2G coverage, 84% feature phones
- **Cost Advantage**: 83% cheaper than current solutions

---

## 🎯 Use Cases

### 1. Remittances
Send money home instantly with ~$0.01 fees (vs 10-13% for mobile money)

### 2. Savings
Store value in ckUSDC to avoid inflation and volatility

### 3. Bitcoin Access
Buy/sell Bitcoin via USSD on any phone

### 4. Cash Services
Deposit and withdraw physical cash through local agents

### 5. Merchant Payments
Accept crypto payments and convert to local currency

---

## 🔒 Security

- **Escrow System**: 6-digit codes protect both users and agents
- **24hr Refunds**: Automatic refund if transaction not completed
- **Rate Limiting**: 10 requests/minute to prevent abuse
- **Fraud Detection**: AI-powered suspicious activity monitoring
- **KYC Verification**: Agent and user identity verification
- **ICP Security**: Chain-key cryptography and decentralized storage

---

## 🏛️ DAO Governance

**AFRI Token Distribution**:
- 40% Agents (400M)
- 30% Users (300M)
- 20% Treasury (200M)
- 10% Team (100M, 4-year vesting)

**Vote on**:
- Fee structures
- New currency additions
- Agent standards
- Treasury spending
- Platform upgrades
- Policy changes

**Vote via**:
- Web dashboard
- USSD commands (*123*8#)
- Mobile app

---

## 📱 USSD Commands

```
*123# → Main Menu

1. Send Money (Local/ckBTC/ckUSDC)
2. Check Balance
3. Cash Services (Deposit/Withdraw)
4. Exchange (Buy/Sell crypto)
5. Find Agents
6. Transaction History
7. Account Settings
8. DAO Governance (Vote)
```

**Example**:
```
*123*1*2# → Send ckBTC
*123*2*3# → Check ckUSDC balance
*123*8*2# → Vote on proposal
```

---

## 🚀 Roadmap

### Phase 1: Foundation ✅ COMPLETE
- Core platform (React + ICP)
- ckBTC + ckUSDC integration
- USSD interface
- Agent dashboard
- Escrow system
- DAO governance

### Phase 2: Launch (Q1 2026)
- Deploy to ICP mainnet
- Launch in Uganda
- 100 agents, 10K users
- $500K monthly volume

### Phase 3: Scale (Q2-Q3 2026)
- Expand to Kenya, Nigeria, Ghana
- 1,000 agents, 100K users
- $5M monthly volume
- Mobile app launch

### Phase 4: Continental (Q4 2026 - 2027)
- All 39 African countries
- 10,000 agents, 1M users
- $50M monthly volume
- Full financial ecosystem

### Phase 5: Ecosystem (2028+)
- 100,000 agents, 10M users
- $500M monthly volume
- DeFi integration
- Pan-African payment network

---

## 💡 Why AfriTokeni?

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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md).

### Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 📞 Contact

- **Website**: https://afritokeni.com
- **Email**: hello@afritokeni.com
- **Twitter**: @AfriTokeni
- **GitHub**: https://github.com/AfriTokeni

**For Agents**: agent@afritokeni.com  
**For Investors**: invest@afritokeni.com  
**For Press**: press@afritokeni.com

---

## 🌍 Our Mission

**Bank the unbanked. Empower Africa. Build wealth.**

AfriTokeni is more than a platform—it's a movement to bring financial inclusion to every African, regardless of location, phone type, or internet access.

**Join us in building the future of money in Africa.**

---

**Made with ❤️ for Africa | Powered by Internet Computer Protocol**
