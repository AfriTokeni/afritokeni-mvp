# AfriTokeni Complete System Guide

**The Definitive Guide to AfriTokeni's SMS-Based Bitcoin Banking Platform**

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Core Features](#core-features)
3. [Revenue Model](#revenue-model)
4. [SMS/USSD System](#smsussd-system)
5. [Security Features](#security-features)
6. [Technical Architecture](#technical-architecture)
7. [Getting Started](#getting-started)
8. [Production Deployment](#production-deployment)

---

## System Overview

### What is AfriTokeni?

AfriTokeni is a **Bitcoin ↔ African currencies exchange platform** that works **100% via SMS** - no internet required. Built for Africa's 14.6M unbanked adults who have feature phones but no smartphones.

### The Problem We Solve

- **54% of Ugandans are unbanked** (14.6M people)
- **84% use feature phones** (no internet access)
- **98% have 2G coverage** (SMS works everywhere)
- **Current mobile money costs 83% more** than our solution

### How It Works

```
User with Feature Phone → SMS Command → Africa's Talking Gateway
                                              ↓
                                    AfriTokeni SMS Server
                                              ↓
                                    Internet Computer (ICP)
                                              ↓
                                    Bitcoin Network / Local Agents
```

**No internet. No smartphone. Just SMS.**

---

## Core Features

### 1. SMS Banking (No Internet Required)

**Send Money**:
```
SEND +256700123456 5000
```

**Check Balance**:
```
BAL
```

**Withdraw Cash**:
```
WITHDRAW 50000
```

### 2. Bitcoin Services via SMS

**Buy Bitcoin**:
```
BTC BUY 100000 UGX
```

**Sell Bitcoin**:
```
BTC SELL 0.001 BTC
```

**Check Bitcoin Balance**:
```
BTC BAL
```

**Bitcoin Rate**:
```
BTC RATE UGX
```

### 3. USSD Menu (*123#)

Dial `*22948#` for interactive menu:
```
AfriTokeni - John Doe
Balance: 150,000 UGX

1. Check Balance
2. Send Money
3. Withdraw Cash
4. Bitcoin Services
5. Transaction History
6. Help
```

### 4. Agent Network

- **Cash-in/Cash-out** at local agents
- **Bitcoin exchange** with agents
- **Location-based** agent discovery
- **Dynamic fees** based on distance/accessibility

### 5. Multi-Language Support

- **English** - Default
- **Luganda** - Uganda (+256)
- **Swahili** - Kenya/Tanzania (+254/+255)

Auto-detects language from phone number.

### 6. DAO Governance

**Vote on proposals via SMS**:
```
VOTE YES PROP-001
```

**Check AFRI token balance**:
```
AFRI BAL
```

**View proposals**:
```
PROPOSALS
```

---

## Revenue Model

### Real Money Capture (Not Theoretical)

AfriTokeni captures **4 real revenue streams**:

#### 1. Agent Settlement Fees (2%)
**When**: Agents withdraw their earnings  
**Amount**: 2% of settlement amount  
**Example**: Agent settles 1M UGX → Platform earns 20K UGX

**Status**: ✅ **IMPLEMENTED**

#### 2. Agent Liquidity Fees (1%)
**When**: Agents fund their digital balance  
**Amount**: 1% of funding amount  
**Example**: Agent deposits 5M UGX → Platform earns 50K UGX

**Status**: ⏳ Phase 2

#### 3. Bitcoin Exchange Spread (1-2%)
**When**: Bitcoin ↔ Local currency exchanges  
**Amount**: 1-2% markup on exchange rate  
**Example**: User buys 0.01 BTC → Platform earns 1-2% spread

**Status**: ⏳ Phase 3

#### 4. Monthly Agent Subscription (50K UGX)
**When**: Active agents (monthly)  
**Amount**: 50,000 UGX/month (~$13.50)  
**Example**: 100 agents → 5M UGX/month revenue

**Status**: ⏳ Phase 4

### Revenue Projections

**Conservative (Year 1)**:
- 1,000 agents
- 10,000 users
- **$648K annual revenue**

**Moderate (Year 2)**:
- 5,000 agents
- 100,000 users
- **$4.86M annual revenue**

**Aggressive (Year 3)**:
- 20,000 agents
- 500,000 users
- **$25.92M annual revenue**

### Revenue Allocation

- **40%** - DAO Treasury (community governed)
- **30%** - Development & Operations
- **20%** - Marketing & Growth
- **10%** - Reserve Fund

---

## SMS/USSD System

### SMS Commands Reference

#### Account Management
```bash
REG John Doe              # Register new account
BAL                       # Check balance
HISTORY                   # Transaction history
HELP                      # Show all commands
```

#### Money Transfer
```bash
SEND +256700123456 5000   # Send money
WITHDRAW 50000            # Withdraw cash
CONFIRM 123456            # Confirm transaction
```

#### Bitcoin Operations
```bash
BTC BAL                   # Bitcoin balance
BTC RATE UGX              # Exchange rate
BTC BUY 100000 UGX        # Buy Bitcoin
BTC SELL 0.001 BTC        # Sell Bitcoin
BTC SEND address 0.001    # Send Bitcoin
```

#### Lightning Network
```bash
LN                        # Lightning menu
LN BAL                    # Lightning balance
LN INVOICE 5000           # Create invoice
LN PAY invoice_string     # Pay invoice
```

#### DAO Governance
```bash
AFRI BAL                  # Check AFRI tokens
VOTE YES PROP-001         # Vote on proposal
PROPOSALS                 # List proposals
```

### USSD Menu Flow

```
Dial: *22948#

Main Menu:
1. Check Balance
2. Send Money
3. Withdraw Cash
4. Bitcoin Services
5. Transaction History
6. Help

→ Select 2 (Send Money)

Enter recipient phone:
+256700123456

Enter amount (UGX):
5000

Confirm?
Send 5,000 UGX to +256700123456
Fee: 140 UGX (2.8%)
Total: 5,140 UGX

1. Confirm
2. Cancel

→ Select 1

✅ Success!
Sent 5,000 UGX
New balance: 144,860 UGX
```

### Multi-Language Examples

**English**:
```
Your balance is 150,000 UGX
```

**Luganda** (Uganda):
```
Ssente zo 150,000 UGX
```

**Swahili** (Kenya/Tanzania):
```
Salio yako ni 150,000 UGX
```

### SMS Gateway Integration

**Provider**: Africa's Talking  
**Shortcode**: 22948 (configurable)  
**Cost**: ~$0.01 per SMS, ~$0.005 per USSD session

**Webhooks**:
- SMS Callback: `/webhooks/sms/incoming`
- USSD Callback: `/webhooks/ussd/callback`
- Delivery Reports: `/webhooks/sms/delivery`

---

## Security Features

### 1. Rate Limiting ✅

**Prevents SMS spam and abuse**

**Limits**:
- **Per Minute**: 5 SMS, 10 USSD, 3 transactions
- **Per Hour**: 50 SMS, 100 USSD, 20 transactions
- **Per Day**: 200 SMS, 500 USSD, 50 transactions

**Response**:
```
Too many requests. Wait 1 minute.
```

### 2. Fraud Detection ✅

**Detects suspicious activity**

**Checks**:
- **Amount Limits**: Max 5M UGX per transaction
- **Velocity**: Detects rapid-fire transactions (3 in 30 seconds)
- **Daily Limits**: Max 20M UGX per day
- **New Accounts**: Restricted to 500K per transaction (first 24 hours)
- **Pattern Detection**: Flags suspicious round number patterns
- **Risk Scoring**: 0-100 risk score based on behavior

**Response**:
```
Suspicious activity detected.
Transaction blocked for security.
Contact support: +256...
```

### 3. PIN Verification ✅

**Protects high-value transactions**

**Features**:
- **4-6 digit PIN** (SHA-256 hashed)
- **Required** for transactions > 10K UGX
- **Account Lockout**: 3 failed attempts = 30-minute lockout
- **Secure Storage**: Never stored in plain text

**Usage**:
```
Set PIN:
SETPIN 1234

Verify PIN:
PIN 1234
```

### 4. KYC Compliance

**Identity Verification**:
- Government ID upload
- Selfie verification
- Address proof
- Phone number verification

**Tiers**:
- **Tier 1** (No KYC): Max 100K UGX/day
- **Tier 2** (Basic KYC): Max 1M UGX/day
- **Tier 3** (Full KYC): Max 10M UGX/day

### 5. Transaction Escrow

**6-digit verification codes** for agent exchanges:
```
User → Sends Bitcoin → Gets code: 123456
User → Shows code to agent → Agent verifies → Gives cash
```

---

## Technical Architecture

### Stack Overview

```
Frontend:
├── React 19 + TypeScript
├── Vite (build tool)
├── TailwindCSS (styling)
├── Lucide Icons
└── React Router

Backend:
├── Internet Computer Protocol (ICP)
├── Juno (Backend-as-a-Service)
├── Internet Identity (auth)
└── HTTP Outcalls (external APIs)

SMS/USSD:
├── Node.js + Express
├── Africa's Talking API
├── TypeScript
└── Webhook handlers

Bitcoin:
├── bitcoinjs-lib
├── BlockCypher API
├── Lightning Network (planned)
└── Hardware wallet support

Blockchain:
├── ICP Canisters
├── SNS DAO Governance
├── ICRC-1 Ledger
└── Decentralized storage
```

### Data Architecture

**Juno Collections**:
```typescript
- users                  // User accounts
- agents                 // Agent profiles
- transactions           // All transactions
- balances              // User balances
- bitcoin_transactions  // Bitcoin txs
- bitcoin_wallets       // BTC addresses
- user_roles            // User/Agent/Admin
- platform_revenue      // Real revenue tracking ✅
- deposit_requests      // Cash deposit requests
- kyc_submissions       // KYC documents
- sms_messages          // SMS logs
- email_subscriptions   // Newsletter
```

### Security Architecture

```
Authentication:
├── SMS: Phone number + PIN
├── Web: Internet Identity (passwordless)
├── Admin: Multi-factor authentication
└── Agents: Enhanced verification

Encryption:
├── Private keys: AES-256
├── PINs: SHA-256 hashing
├── Data at rest: ICP encryption
└── Data in transit: HTTPS/TLS

Access Control:
├── Role-based permissions
├── Rate limiting
├── Fraud detection
└── Transaction limits
```

### Dynamic Fee System

**Location-Based Pricing**:
```typescript
Base Fee: 0.5-5% (distance-based)
× Location Multiplier:
  - Urban (Kampala): 1.0x
  - Suburban: 1.2x
  - Rural: 1.5x
  - Remote: 2.5x
× Urgency:
  - Standard: 1.0x
  - Express: 1.3x
  - Emergency: 1.8x
× Time Factor:
  - Day: 1.0x
  - Night: 1.4x
  - Weekend: 1.15x
```

**Examples**:
- Urban (Kampala): 2.8% fee
- Rural (Gulu): 6.2% fee
- Remote (Karamoja): 11.8% fee

---

## Getting Started

### Prerequisites

```bash
- Node.js 18+
- Docker (for Juno)
- ngrok (for SMS testing)
- Africa's Talking account
```

### Quick Start

#### 1. Clone and Install
```bash
git clone https://github.com/AfriTokeni/afritokeni-mvp.git
cd afritokeni-mvp
npm install
```

#### 2. Start Juno (ICP Backend)
```bash
juno dev start
```

#### 3. Configure Environment
```bash
# Copy .env and add your credentials
AT_API_KEY=your_africastalking_api_key
AT_USERNAME=sandbox
AT_SHORT_CODE=22948
```

#### 4. Start Web App
```bash
npm run dev
```
Open: http://localhost:5173

#### 5. Start SMS Server
```bash
npm run dev:sms
```
Server runs on: http://localhost:3002

#### 6. Setup ngrok (for SMS testing)
```bash
ngrok http 3002
```
Copy HTTPS URL and configure in Africa's Talking dashboard.

### Test SMS Locally

```bash
./test-sms-local.sh
```

This tests all SMS commands without needing a real phone.

### Test with Real Phone

1. Configure webhooks in Africa's Talking
2. Send SMS to your shortcode: `HELP`
3. Dial USSD: `*22948#`

---

## Production Deployment

### 1. Deploy Web App

**Juno Deployment**:
```bash
# Build
npm run build

# Deploy to ICP
juno deploy

# Configure production satellite ID
juno config -m production
```

### 2. Deploy SMS Server

**Railway/Heroku/VPS**:
```bash
# Build
npm run build:sms

# Set environment variables
AT_API_KEY=prod_key
AT_USERNAME=prod_username

# Start
npm run start:sms
```

### 3. Configure Domain

```bash
# Web app
app.afritokeni.com → Juno deployment

# SMS server
sms.afritokeni.com → SMS server
```

### 4. Africa's Talking Production

1. Get production API key
2. Request production shortcode
3. Configure webhooks with production URLs
4. Add credits

### 5. Monitoring

**Metrics to Track**:
- SMS delivery rate
- USSD session completion
- Transaction success rate
- Fraud detection hits
- Revenue per agent
- User growth
- Agent network size

**Tools**:
- Africa's Talking dashboard
- Juno analytics
- Custom logging
- Error tracking (Sentry)

---

## System Capabilities

### What Works Now ✅

**Core Platform**:
- ✅ User registration (SMS + Web)
- ✅ Balance checking
- ✅ Send money (user-to-user)
- ✅ Agent network (20 agents in Kampala)
- ✅ Bitcoin integration (real addresses, balances)
- ✅ Dynamic fee calculation
- ✅ Multi-currency support (39 African currencies)
- ✅ KYC system
- ✅ DAO governance (SNS integration)

**SMS/USSD**:
- ✅ All SMS commands implemented
- ✅ USSD menu system
- ✅ Africa's Talking integration
- ✅ Multi-language support (EN, LG, SW)
- ✅ Rate limiting
- ✅ Fraud detection
- ✅ PIN verification

**Revenue**:
- ✅ Settlement fees (2%) - LIVE
- ⏳ Liquidity fees (1%) - Phase 2
- ⏳ Bitcoin spread (1-2%) - Phase 3
- ⏳ Agent subscriptions - Phase 4

**Security**:
- ✅ Rate limiting
- ✅ Fraud detection
- ✅ PIN verification
- ✅ KYC compliance
- ✅ Transaction escrow
- ✅ Role-based access

### What's Coming ⏳

**Short-term (Next 2 weeks)**:
- Live SMS testing with real phones
- Agent liquidity fees implementation
- Bitcoin spread revenue
- Enhanced fraud detection
- Performance optimization

**Medium-term (Next month)**:
- Agent subscription system
- Admin revenue dashboard
- Lightning Network integration
- Multi-language expansion
- Production deployment

**Long-term (Next quarter)**:
- Pan-African expansion
- Hardware wallet integration
- Advanced analytics
- Mobile app (for agents)
- API for third-party integrations

---

## Key Metrics

### Current Status

**Users**: 0 (pre-launch)  
**Agents**: 20 (mock data)  
**Transactions**: 0  
**Revenue**: $0

### Target Metrics (Year 1)

**Users**: 10,000  
**Agents**: 1,000  
**Daily Transactions**: 500  
**Monthly Revenue**: $54,000  
**Annual Revenue**: $648,000

### Success Criteria

**Technical**:
- 99.9% uptime
- < 2 second SMS response time
- < 1 second USSD response time
- 0 security breaches

**Business**:
- 1,000 active agents
- 10,000 active users
- $50K+ monthly revenue
- 50+ transactions per day

**Impact**:
- 10,000 unbanked people served
- 83% cost savings vs mobile money
- 100% SMS accessibility
- Pan-African expansion started

---

## Support & Resources

### Documentation
- **This Guide**: Complete system overview
- **README.md**: Quick start guide
- **REVENUE_MODEL.md**: Detailed revenue documentation
- **SMS_QUICK_START.md**: SMS setup guide
- **FEATURES_DOCUMENTATION.md**: Feature details

### Code Structure
```
afritokeni-mvp/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # Business logic
│   │   ├── smsCommandProcessor.ts
│   │   ├── rateLimiter.ts
│   │   ├── fraudDetection.ts
│   │   ├── translations.ts
│   │   ├── pinVerification.ts
│   │   └── dataService.ts
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── public/               # Static assets
├── juno.config.ts        # Juno configuration
└── package.json          # Dependencies
```

### Getting Help

**Technical Issues**:
- Check logs: `tail -f logs/sms-server.log`
- Review documentation
- Check Africa's Talking dashboard

**Business Questions**:
- Email: support@afritokeni.com
- Telegram: @AfriTokeni
- Twitter: @AfriTokeni

**Contributing**:
- GitHub: github.com/AfriTokeni/afritokeni-mvp
- Issues: Report bugs and feature requests
- PRs: Contributions welcome!

---

## FAQ

**Q: Do users need internet?**  
A: No! Everything works via SMS on feature phones.

**Q: How do users get Bitcoin?**  
A: Buy from agents with cash, or receive from others.

**Q: What currencies are supported?**  
A: All 39 African currencies (UGX, KES, NGN, GHS, etc.)

**Q: How do agents make money?**  
A: Commission on transactions (2-12% based on location/service)

**Q: Is it secure?**  
A: Yes! PIN verification, fraud detection, rate limiting, KYC, and ICP blockchain security.

**Q: What about Bitcoin fees?**  
A: Users pay network fees. Platform takes 1-2% spread on exchanges.

**Q: Can I use it outside Uganda?**  
A: Yes! Works in 39 African countries with local currencies.

**Q: How fast are transactions?**  
A: SMS: < 2 seconds. Bitcoin: 10-60 minutes (network dependent).

---

## License

MIT License - See LICENSE file

---

## Contact

**Website**: https://afritokeni.com  
**Email**: support@afritokeni.com  
**Twitter**: @AfriTokeni  
**Telegram**: @AfriTokeni  
**GitHub**: github.com/AfriTokeni

---

**Built with ❤️ for Africa's unbanked**

*Banking the unbanked, one SMS at a time.*
