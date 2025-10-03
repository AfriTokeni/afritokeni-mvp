# AfriTokeni: SMS-Based Bitcoin Banking for Africa

AfriTokeni is an SMS-accessible Bitcoin banking platform built on Internet Computer Protocol (ICP) that serves Africa's 14.6M unbanked adults. Our system enables Bitcoin transactions via SMS commands on feature phones, bridging the digital divide in financial services.

## 🎯 Project Highlights

- **🏛️ FIRST SMS-ACCESSIBLE DAO**: Live SNS governance on IC mainnet - vote via SMS or web!
- **SMS-First Design**: Complete Bitcoin banking via SMS commands - no internet required
- **Real Bitcoin Integration**: Live Bitcoin transactions using BlockCypher API with secure escrow system
- **Agent Network**: Physical cash-to-Bitcoin exchange through verified local agents
- **Multi-Currency Support**: All 39 African currencies with dynamic fee pricing
- **83% Cost Reduction**: Significantly cheaper than traditional mobile money solutions
- **Universal Access**: Works on 98% of phones across Africa (feature phones + smartphones)

## Demo Video

[AfriTokeni Demo](https://www.loom.com/share/f442426d1f754e9c91870c8efc45ce89?sid=44fff060-6e3f-466d-b199-2e0dc1e6420d)

## Live Application

You can access the live production application here: **[https://dkk74-oyaaa-aaaal-askxq-cai.icp0.io/](https://dkk74-oyaaa-aaaal-askxq-cai.icp0.io/)**

## 🌟 Key Features

### 👥 **For Users**
- **💰 Multi-Currency Wallets**: Support for all 39 African currencies (NGN, KES, GHS, ZAR, UGX, etc.)
- **₿ Bitcoin Integration**: Buy/sell Bitcoin with local currency through secure escrow system
- **📱 Universal Access**: Works on any phone - SMS commands or modern web interface
- **💸 Send Money**: Transfer funds to any user via phone number across different currencies
- **🏧 Cash Services**: Deposit/withdraw cash through verified agent network
- **🔐 KYC Verification**: Secure identity verification with document upload
- **📊 Transaction History**: Complete financial activity tracking and reporting
- **🔔 SMS Notifications**: Real-time transaction alerts and confirmations

### 🏪 **For Agents**
- **💼 Agent Dashboard**: Professional interface for managing customer transactions
- **💳 Liquidity Management**: Fund operations via bank transfer/mobile money, withdraw earnings
- **₿ Bitcoin Operations**: Help customers exchange Bitcoin for cash with live rates
- **👥 Customer Management**: Process deposits, withdrawals, and Bitcoin exchanges
- **📈 Earnings Tracking**: Real-time commission tracking and settlement system
- **🗺️ Location Services**: GPS-based customer matching and service area management
- **📱 SMS Integration**: Process transactions via SMS for offline customers
- **🔒 Security Features**: 6-digit verification codes and transaction escrow protection

### 👨‍💼 **For Administrators**
- **🔍 KYC Management**: Review and approve user/agent identity verification
- **📊 System Monitoring**: Transaction oversight and compliance management
- **🛡️ Security Controls**: Admin authentication and role-based access control
- **📈 Analytics Dashboard**: Platform usage and financial flow monitoring

## 🏛️ DAO Governance (SNS)

**AfriTokeni is governed by a live SNS DAO on IC mainnet!**

### **Live SNS Canisters:**
- **Governance**: `kly22-hyaaa-aaaac-qceeq-cai`
- **AFRI Token (ICRC-1)**: `kf2xs-4iaaa-aaaac-qcefq-cai`
- **Root**: `kq5g7-5aaaa-aaaac-qcega-cai`
- **Swap**: `kx4al-qyaaa-aaaac-qcegq-cai`
- **Index**: `kc3rg-rqaaa-aaaac-qcefa-cai`

### **Token Details:**
- **Total Supply**: 1,000,000,000 AFRI
- **Distribution**: 250M neurons, 750M swap
- **Symbol**: AFRI
- **Standard**: ICRC-1 (SNS)

### **How to Participate:**
- **Vote via Web**: Visit `/users/dao` in the app
- **Vote via SMS**: Send `VOTE YES PROP-001` (no internet required!)
- **Check Balance**: `AFRI BAL` via SMS
- **View Proposals**: `PROPOSALS` via SMS

**🎉 First SMS-accessible DAO in history!** Unbanked Africans can now participate in on-chain governance via feature phones.

## 🏗️ Technical Architecture

AfriTokeni uses a hybrid architecture combining Internet Computer Protocol (ICP) blockchain with traditional web services for maximum accessibility.

### **Core Components**

#### **Frontend (React/TypeScript)**
- **User Interface**: Modern responsive web app for smartphones
- **Agent Dashboard**: Professional fintech interface for agent operations  
- **Admin Panel**: KYC management and system oversight
- **SMS Interface**: Feature phone simulation and testing

#### **Backend (Internet Computer Protocol)**
- **Juno Satellite**: Backend-as-a-Service on ICP blockchain
- **Decentralized Storage**: All user data, transactions, and balances stored on-chain
- **Internet Identity**: Passwordless authentication for web users
- **HTTP Outcalls**: Direct API calls to external services (SMS, Bitcoin, forex)

#### **Bitcoin Integration**
- **Real Bitcoin Operations**: Live address generation, balance checking, transaction broadcasting
- **BlockCypher API**: Mainnet/testnet Bitcoin network integration
- **Escrow System**: Secure 6-digit code verification for agent exchanges
- **Hardware Wallet Support**: Integration with Ledger, Trezor for advanced users

#### **SMS Gateway (Node.js/Express)**
- **AfricasTalking API**: SMS and USSD processing for feature phones
- **Webhook Server**: Processes offline transactions and notifications
- **Command Processing**: Complete financial operations via text messages

### **Data Architecture**
```typescript
Collections: users, agents, transactions, balances, 
            bitcoin_transactions, bitcoin_wallets, 
            user_roles, email_subscriptions
```

### **Security Features**
- **Multi-Factor Authentication**: SMS + Internet Identity
- **Transaction Escrow**: 6-digit verification codes
- **KYC Compliance**: Document verification for users and agents
- **Encrypted Storage**: Private keys encrypted with AES-256
- **Role-Based Access**: User/Agent/Admin permission system


## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) and npm
- [Docker](https://www.docker.com/get-started) (for Juno)
- [ngrok](https://ngrok.com/download) (for SMS testing)

### Step 1: Clone and Install
```bash
git clone https://github.com/AfriTokeni/afritokeni-mvp.git
cd afritokeni-mvp
npm install
```

### Step 2: Start Juno Development Emulator
```bash
juno dev start
```
This starts the local ICP blockchain emulator required for authentication.

### Step 3: Create and Configure Juno Satellite
1. Open [http://localhost:5866](http://localhost:5866) in your browser
2. Create a new satellite and copy the Satellite ID
3. Update `juno.config.ts` with your satellite ID:
   ```typescript
   export default defineConfig({
     satellite: {
       ids: {
         development: "YOUR_SATELLITE_ID_HERE",
       },
       source: "dist",
     },
   });
   ```

### Step 4: Create Required Collections
Login and create datastore collections:
```bash
juno login --mode development --emulator
juno config --mode development
```
Create these collections in [Juno Datastore UI](http://localhost:5866/datastore):
- `users`, `transactions`, `balances`, `agents`
- `bitcoin_transactions`, `bitcoin_wallets`, `user_roles`

### Step 5: Start Frontend
```bash
npm run dev
```

### Step 6: Setup SMS Backend (Optional)
```bash
# Create .env with AfricasTalking credentials
echo "VITE_AT_API_KEY=your_key\nVITE_AT_USERNAME=sandbox\nVITE_PORT=3001" > .env

# Build and start backend
npm run build:backend
npm run start:backend

# Expose with ngrok for SMS testing
ngrok http 3001
```

## 💰 Real Financial System

AfriTokeni operates as a complete transaction-based financial system with **zero hardcoded balances**:

### Core Features
- **Transaction-Based Balances**: All balances calculated from real transaction history
- **39 African Currencies**: NGN, KES, GHS, ZAR, UGX, TZS, RWF, ETB, etc.
- **Agent Network**: Physical cash ↔ digital currency conversion
- **Bitcoin Integration**: Direct Bitcoin ↔ local currency exchange via agents
- **Multi-Currency Transfers**: Send money across different African currencies

### Financial Flows
1. **Cash Deposits**: Users bring cash to agents → digital balance increases
2. **Cash Withdrawals**: Users get cash from agents → digital balance decreases  
3. **User Transfers**: Send money to other users via phone number
4. **Bitcoin Exchange**: Buy/sell Bitcoin through agent network with escrow protection
5. **Agent Settlement**: Agents withdraw earnings via bank/mobile money

## 📱 SMS Commands

AfriTokeni works on any phone via SMS. Key commands:

- `*AFRI#` - Access main menu
- `BTC BAL` - Check Bitcoin balance  
- `BTC RATE UGX` - Get exchange rates
- `BTC BUY 50000 UGX` - Buy Bitcoin with local currency
- `BTC SELL 0.001` - Sell Bitcoin for cash via agents
- `SEND 10000 UGX +256701234567` - Send money to another user

## ICP Features Used

*   **Juno**: Used as a comprehensive Backend-as-a-Service (BaaS) to simplify development on the Internet Computer.
*   **Decentralized Datastore**: All application data, including user profiles, balances, transaction history, and Bitcoin transaction records, is stored on-chain in a decentralized database.
*   **Internet Identity**: Provides secure, passwordless authentication for web application users.
*   **HTTP Outcalls**: A powerful feature that allows the on-chain canister to directly and securely make API calls to external Web 2.0 services. This was essential for integrating with the AfricasTalking API to send SMS messages and respond to USSD requests, as well as for fetching live Bitcoin exchange rates and blockchain data.
*   **On-Chain Hosting**: The frontend assets and canister logic are hosted directly on the Internet Computer, providing a tamper-proof and unstoppable user experience.
*   **WebAssembly Integration**: Leverages WASM for cryptographic operations in Bitcoin address generation and transaction signing using libraries like `tiny-secp256k1`.

## Challenges Faced

### Webhook Server Deployment
A primary challenge was deploying the Node.js webhook server, which interacts with the AfricasTalking API, directly onto Juno/ICP. Due to difficulties in configuring the necessary external API routes and handlers within a canister, we adopted a hybrid approach. The webhook server was deployed to **Render**, a traditional cloud service, which then communicates with our Juno datastore on the Internet Computer.

### WebAssembly Integration
Integrating Bitcoin cryptographic libraries like `tiny-secp256k1` required careful configuration of Vite to handle WebAssembly modules. This was resolved by adding `vite-plugin-wasm` and `vite-plugin-top-level-await` to properly support WASM-based cryptographic operations in the browser environment.

## 🚀 Future Roadmap

Our vision is to make AfriTokeni the leading Bitcoin banking platform for Africa's unbanked population. Here's our path from MVP to continental scale.

### **Phase 1: Production Hardening (Q1 2026)**
🎯 **Goal**: Secure, scalable platform ready for pilot deployment

**Security & Infrastructure**
- Comprehensive security audit of all components
- ICP threshold signatures for Bitcoin key management
- Production-grade SMS gateway deployment
- CI/CD pipelines and monitoring systems
- Full test suite (unit, integration, end-to-end)

**Regulatory Foundation**
- Uganda financial services compliance
- Bitcoin custody and exchange licensing
- Agent network legal framework
- KYC/AML compliance systems

### **Phase 2: Uganda Pilot (Q2-Q3 2026)**
🎯 **Goal**: Validate product-market fit with 1,000 users and 50 agents

**Market Entry**
- Kampala metropolitan area launch
- Agent recruitment and training program
- User onboarding and education campaigns
- Community partnerships and local marketing

**Product Optimization**
- Real-world usage data collection
- SMS command optimization for local languages
- Agent liquidity management refinement
- Customer support infrastructure

### **Phase 3: National Scale (Q4 2026 - Q2 2027)**
🎯 **Goal**: 50,000 users across Uganda with sustainable unit economics

**Geographic Expansion**
- Rural area penetration strategy
- Multi-language SMS support (Luganda, Swahili)
- Agent network scaling to 500+ locations
- Partnership with mobile network operators

**Advanced Features**
- Cross-border remittances to Kenya/Tanzania
- Native stablecoin support (USDC, USDT) alongside Bitcoin
- Merchant payment integration
- Savings and credit products
- Insurance partnerships

### **Phase 4: Continental Vision (2027+)**
🎯 **Goal**: Pan-African Bitcoin banking network

**Multi-Country Expansion**
- Kenya, Nigeria, Ghana market entry
- Regulatory compliance in 10+ countries
- Cross-border Bitcoin remittance corridors
- Local currency support for all 39 African currencies

**Ecosystem Development**
- Developer API for third-party integrations
- Agent franchise model
- Bitcoin education and literacy programs
- Central bank digital currency (CBDC) integration

### **Technology Evolution**
- **ICP Native Bitcoin**: Migrate to ICP's native Bitcoin integration
- **Decentralized SMS**: Explore on-chain SMS processing
- **AI-Powered Support**: Automated customer service in local languages
- **Satellite Internet**: Starlink integration for remote area connectivity

### **Impact Goals by 2027**
- **10 Million Users**: Across 15 African countries
- **100,000 Agents**: Comprehensive rural coverage
- **$1 Billion Volume**: Monthly transaction processing
- **Financial Inclusion**: Banking the previously unbanked population



