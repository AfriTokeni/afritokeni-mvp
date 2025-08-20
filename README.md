# AfriTokeni MVP

**SMS-Based Financial System on Internet Computer Protocol for Uganda**



AfriTokeni is an innovative SMS-based financial system built on the Internet Computer Protocol (ICP) designed to provide accessible financial services to Uganda's underserved populations. By leveraging SMS technology and blockchain infrastructure, we're creating a solution that serves the **54% of adults who remain unbanked** while offering services **83% cheaper** than current mobile money solutions.

## 🌍 Project Overview

### The Opportunity
- **$133 billion** mobile money market growing at 25.73% annually
- **14.6 million unbanked adults** (54% of Uganda's population)
- **98% 2G coverage** with mature SMS infrastructure
- **84% feature phone dominance** creating ideal conditions for SMS-based services

### Our Solution
A comprehensive SMS-based financial platform that combines:
- **ICP's reverse gas model** - eliminating transaction fees for end users
- **Threshold signature security** - multi-layered protection against fraud
- **Agent network integration** - leveraging existing cash-out infrastructure
- **Local language support** - Luganda and Swahili interfaces

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Internet Computer SDK (dfx)
- Access to SMS gateway (Africa's Talking recommended)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/afritokeni-mvp.git
cd afritokeni-mvp
npm install
```

### 2. Start Local Development

```bash
# Start the local ICP replica
dfx start --background

# Deploy canisters locally
dfx deploy

# Start the frontend development server
npm run dev
```

### 3. Configure Your Environment

Set up your environment variables:

```bash
cp .env.example .env.local
```

Update `.env.local` with your configuration:

```env
VITE_SMS_GATEWAY_API_KEY=your_africas_talking_api_key
VITE_SMS_GATEWAY_USERNAME=your_username
VITE_CANISTER_ID_BACKEND=your_backend_canister_id
```

### 4. Set Up SMS Gateway Integration

Configure your SMS webhook endpoint in your SMS provider dashboard to point to:
```
https://your-canister-id.ic0.app/sms-webhook
```

## 🏗️ Architecture

### System Components

```
SMS Gateway ↔ HTTP Webhook ↔ ICP Canister ↔ Financial Operations
```

**Core Canisters:**
- **Authentication Canister** - User identity and PIN management
- **SMS Processing Canister** - Message parsing and command routing
- **Financial Canister** - Transaction logic and balance management
- **Notification Canister** - SMS confirmations and alerts
- **History Canister** - Transaction records and audit trails

### Security Architecture
- **2-of-3 Threshold Signatures** - User PIN + Device Fingerprint + System Validation
- **Multi-Party Computation** - Distributed key management
- **Progressive Authentication** - SMS OTP for high-value transactions
- **Transaction Monitoring** - Real-time fraud detection

## 📱 SMS Interface

### Basic Commands

```
*AFRI# - Main menu
1. Send Money
2. Receive Money  
3. Check Balance
4. Withdraw Cash
5. Transaction History
```

### Example Usage

**Send Money:**
```
SMS: SEND 50000 256701234567
Reply: Confirm sending UGX 50,000 to John Doe (256701234567)? Reply YES with your PIN
SMS: YES 1234
Reply: Success! UGX 50,000 sent to John Doe. New balance: UGX 150,000
```

**Check Balance:**
```
SMS: BAL
Reply: Your balance is UGX 200,000. Last transaction: -UGX 50,000 on 19/08/2025
```

## 🏦 Cash Withdrawal System

### Agent Network Integration

**Find Nearby Agents:**
```
SMS: AGENTS
Reply: Nearest agents:
1. Kampala Rd Shop - 0.2km
2. Nakawa Market - 0.8km
3. Mobile Agent John - 1.2km
```

**Initiate Withdrawal:**
```
SMS: WITHDRAW 100000 1
Reply: Withdrawal code: AF7829. Visit Kampala Rd Shop with your ID. Code expires in 2 hours.
```

### Withdrawal Process
1. User initiates withdrawal via SMS
2. System generates secure verification code
3. User visits selected agent with national ID
4. Agent verifies identity and code
5. Cash dispensed, transaction confirmed via SMS

## 💰 Economic Model

### Cost Advantages
- **Transaction Costs:** $0.0000022 average (83% cheaper than mobile money)
- **Transfer Fees:** UGX 200 vs UGX 500 (MTN Mobile Money)
- **Profit Margins:** 95% on transactions

### Revenue Projections
- **Break-even:** 2,000 active users
- **Target Revenue:** UGX 100M/month at 10,000 users
- **ROI:** 280% over 3 years

## 🛡️ Security Features

### Multi-Layer Protection
1. **SIM Swapping Protection** - Device fingerprinting and behavioral analysis
2. **SS7 Vulnerability Mitigation** - Message encryption and validation
3. **Transaction Limits** - Daily/monthly caps with progressive increases
4. **Cooling-off Periods** - Delays for high-value transactions
5. **Agent Verification** - Multi-factor authentication for cash-out

### Risk Management
- Hot/warm/cold wallet architecture
- Comprehensive insurance coverage
- Real-time transaction monitoring
- Automated fraud detection

## 🌐 Deployment

### Production Deployment

1. **Regulatory Approval** - Bank of Uganda licensing
2. **SMS Gateway Setup** - Production API keys and webhooks
3. **Agent Network** - Partnership agreements and training
4. **Canister Deployment** - Mainnet deployment with proper cycles

```bash
# Deploy to IC mainnet
dfx deploy --network ic

# Set production environment variables
dfx canister call backend set_production_config
```

## 📊 Development Roadmap

### Phase 1: Foundation (6 months)
- [x] Core SMS-canister communication
- [x] Basic transaction functionality
- [x] Security implementation
- [ ] Regulatory approval
- [ ] SMS gateway integration

### Phase 2: Pilot (6 months)
- [ ] Kampala deployment (1,000 users)
- [ ] Agent network establishment
- [ ] User experience optimization
- [ ] Performance monitoring

### Phase 3: Scale (12 months)
- [ ] Major cities expansion (50,000 users)
- [ ] Advanced features (savings, loans)
- [ ] Multi-language support
- [ ] Cross-border remittances

### Phase 4: National (18 months)
- [ ] Nationwide rollout
- [ ] Government integration
- [ ] Multi-asset support
- [ ] Regional expansion

## 🤝 Contributing

We welcome contributions from developers, financial inclusion experts, and community members.

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Format code
npm run format

# Lint code
npm run lint
```

### Key Areas for Contribution
- SMS command parsing and validation
- Security enhancements
- User interface improvements
- Agent network tools
- Documentation and tutorials

## 📚 Documentation

- [Technical Architecture](./docs/architecture.md)
- [SMS API Reference](./docs/sms-api.md)
- [Security Guidelines](./docs/security.md)
- [Agent Network Guide](./docs/agents.md)
- [Regulatory Compliance](./docs/compliance.md)

## 🔗 Links & Resources

- [Internet Computer Protocol](https://internetcomputer.org/)
- [Juno Build Platform](https://juno.build)
- [Bank of Uganda Fintech Sandbox](https://www.bou.or.ug/)
- [Africa's Talking SMS Gateway](https://africastalking.com/)
- [Uganda Mobile Money Statistics](https://www.bou.or.ug/statistics/)

## 📞 Support & Community

- **Email:** support@afritokeni.com
- **Telegram:** [@AfriTokeniCommunity](https://t.me/afritokenicommunity)
- **Twitter:** [@AfriTokeni](https://twitter.com/afritokeni)
- **Discord:** [Join our server](https://discord.gg/afritokeni)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bank of Uganda for regulatory guidance
- Internet Computer Foundation for technical support
- Uganda's mobile money agents and users for insights
- Financial inclusion advocates across East Africa

---

**Building financial inclusion, one SMS at a time.** 🇺🇬📱💰

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command          | Action                                                      |
| :--------------- | :---------------------------------------------------------- |
| `npm install`    | Installs dependencies                                       |
| `npm run dev`    | Starts frontend dev server at `localhost:5173`              |
| `juno dev start` | Quickstart the local development emulator |
| `npm run build`  | Build your production site to `./dist/`                     |
| `juno deploy`    | Deploy your project to a Satellite                          |

## 🚀 Launch

Explore this [guide](https://juno.build/docs/add-juno-to-an-app/create-a-satellite) to launch your Satellite into orbit via Juno's [administration console](https://console.juno.build).
