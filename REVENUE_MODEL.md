# AfriTokeni Revenue Model & Business Viability

## 🎯 Executive Summary

AfriTokeni generates **real revenue** through 4 concrete streams, NOT through theoretical accounting of transaction fee splits. This document clarifies how the platform actually makes money.

---

## 💰 Real Revenue Streams

### **1. Agent Settlement Fees** (Primary Revenue - 40% of total)

**What it is**: When agents withdraw their earned commissions to their bank accounts or mobile money.

**How it works**:
```
Agent earns commissions: 1,000,000 UGX
Agent requests settlement (withdrawal)
Platform charges: 2% settlement fee = 20,000 UGX
Agent receives: 980,000 UGX (real bank transfer)
Platform keeps: 20,000 UGX (REAL MONEY in platform bank account)
```

**Revenue calculation**:
- Average agent earnings: 500,000 UGX/month
- Settlement frequency: 2x per month
- Settlement fee: 2%
- Revenue per agent: 20,000 UGX/month
- 1,000 agents = 20,000,000 UGX/month (~$5,400 USD)

**Implementation status**: ❌ NOT IMPLEMENTED
- Settlement fee currently shows "Free" in UI
- No fee deduction in settlement processing
- No platform revenue capture

**What needs to be built**:
- Add 2% fee calculation in `AgentSettlement.tsx`
- Create `platform_revenue` collection in Juno
- Record real revenue on each settlement
- Update agent balance after fee deduction

---

### **2. Agent Liquidity Fees** (Secondary Revenue - 25% of total)

**What it is**: When agents deposit money to fund their operational digitalBalance.

**How it works**:
```
Agent needs to fund operations: 5,000,000 UGX
Agent deposits via bank transfer/mobile money
Platform charges: 1% funding fee = 50,000 UGX
Agent receives: 4,950,000 UGX digitalBalance
Platform keeps: 50,000 UGX (REAL MONEY)
```

**Revenue calculation**:
- Average funding: 2,000,000 UGX per agent
- Funding frequency: 1x per month
- Funding fee: 1%
- Revenue per agent: 20,000 UGX/month
- 1,000 agents = 20,000,000 UGX/month (~$5,400 USD)

**Implementation status**: ❌ NOT IMPLEMENTED
- Funding currently shows "Free for bank transfers"
- No fee deduction in funding processing
- No platform revenue capture

**What needs to be built**:
- Add 1% fee calculation in `AgentFunding.tsx`
- Deduct fee from funded amount
- Record platform revenue
- Show fee breakdown to agent before confirmation

---

### **3. Bitcoin Exchange Spread** (High-Margin Revenue - 20% of total)

**What it is**: Platform markup on Bitcoin buy/sell transactions.

**How it works**:
```
Market BTC price: $45,000
Platform buys at: $45,000 (from exchange)
Platform sells to user at: $45,450 (1% markup)
User pays: $45,450
Platform profit: $450 (REAL MONEY)
```

**Revenue calculation**:
- Average Bitcoin transaction: $500
- Spread: 1%
- Revenue per transaction: $5
- 1,000 transactions/month = $5,000/month

**Implementation status**: ⚠️ PARTIALLY IMPLEMENTED
- Bitcoin service exists
- No spread calculation in pricing
- Uses market rate directly (no markup)

**What needs to be built**:
- Add 1% spread to `BitcoinService.getExchangeRate()`
- Show "Platform rate" vs "Market rate" to users
- Calculate and record spread profit
- Implement buy/sell rate difference

---

### **4. Monthly Agent Subscription** (Recurring Revenue - 15% of total)

**What it is**: Monthly platform fee for active agents.

**How it works**:
```
Active agent fee: 50,000 UGX/month (~$13.50 USD)
Charged automatically on 1st of each month
Agent must maintain active status to process transactions
```

**Revenue calculation**:
- Fee per agent: 50,000 UGX/month
- 1,000 active agents = 50,000,000 UGX/month (~$13,500 USD)

**Implementation status**: ❌ NOT IMPLEMENTED
- No subscription system
- No monthly billing
- Agents operate for free

**What needs to be built**:
- Create subscription management system
- Implement monthly billing cycle
- Auto-deduct from agent balance
- Suspend inactive agents who don't pay

---

## 📊 Transaction Fee Split (70/30) - NOT REAL REVENUE

### **Current Implementation**

On every transaction, dynamic fees are calculated:
```typescript
// dynamicFeeService.ts
Total fee: 2.8% (on 100,000 UGX = 2,800 UGX)
Agent commission: 70% = 1,960 UGX → Added to agent.cashBalance
Platform share: 30% = 840 UGX → NOWHERE (just calculated, not stored)
```

### **Why This is NOT Real Revenue**

The platform doesn't actually "get" the 30% because:

1. **No money changes hands**: It's just database numbers
2. **Agent already has the cash**: User gave physical cash to agent
3. **Platform has no bank account involved**: No real money transfer
4. **It's accounting only**: Used for metrics and analytics

### **What the 30% Actually Represents**

It's a **theoretical platform share** used for:
- Business analytics
- Understanding total fees collected
- Agent performance metrics
- NOT actual money in platform bank account

### **Implementation**

The 30% should be tracked for analytics:
```typescript
// platform_metrics collection (analytics only)
{
  month: 'October 2025',
  totalTransactionVolume: 50_000_000,
  totalFeesCharged: 1_500_000,
  agentCommissionsPaid: 1_050_000, // 70%
  platformTheoreticalShare: 450_000, // 30% (NOT REAL MONEY)
  realRevenueFromSettlement: 50_000, // ACTUAL MONEY
  realRevenueFromLiquidity: 30_000, // ACTUAL MONEY
  realRevenueFromBitcoin: 20_000, // ACTUAL MONEY
  realRevenueFromSubscriptions: 13_500 // ACTUAL MONEY
}
```

---

## 💵 Total Revenue Projections

### **Year 1 (Conservative)**
- **Agents**: 500 active agents
- **Users**: 10,000 users
- **Monthly Volume**: $500,000

**Monthly Revenue Breakdown**:
1. Settlement fees (2%): $5,000
2. Liquidity fees (1%): $3,000
3. Bitcoin spread (1%): $2,000
4. Agent subscriptions: $6,750
**Total Monthly**: $16,750
**Total Annual**: $201,000

### **Year 3 (Growth)**
- **Agents**: 10,000 active agents
- **Users**: 500,000 users
- **Monthly Volume**: $10,000,000

**Monthly Revenue Breakdown**:
1. Settlement fees (2%): $100,000
2. Liquidity fees (1%): $60,000
3. Bitcoin spread (1%): $50,000
4. Agent subscriptions: $135,000
**Total Monthly**: $345,000
**Total Annual**: $4,140,000

### **Year 5 (Scale)**
- **Agents**: 50,000 active agents
- **Users**: 5,000,000 users
- **Monthly Volume**: $100,000,000

**Monthly Revenue Breakdown**:
1. Settlement fees (2%): $1,000,000
2. Liquidity fees (1%): $600,000
3. Bitcoin spread (1%): $500,000
4. Agent subscriptions: $675,000
**Total Monthly**: $2,775,000
**Total Annual**: $33,300,000

---

## 🏦 Revenue Allocation Strategy

All platform revenue is allocated:

### **40% - Operational Costs** ($80,400/year → $1.66M/year → $13.3M/year)
- SMS gateway costs (Africa's Talking)
- Server infrastructure (ICP, cloud services)
- API costs (BlockCypher, forex, etc.)
- Compliance and licensing
- Customer support
- Banking and payment processing fees

### **30% - DAO Treasury** ($60,300/year → $1.24M/year → $10M/year)
- Controlled by SNS governance
- Community proposals and voting
- Agent liquidity pools
- User incentive programs
- Emergency insurance fund
- Community development grants

### **20% - Development & Growth** ($40,200/year → $828K/year → $6.66M/year)
- Engineering team salaries
- Product development
- Marketing and user acquisition
- Agent recruitment and training
- Geographic expansion
- Partnerships and integrations

### **10% - Emergency Reserve** ($20,100/year → $414K/year → $3.33M/year)
- Agent insurance fund
- User refunds and disputes
- Security incidents
- Regulatory fines
- Legal contingencies
- Platform stability buffer

---

## 🔧 Implementation Checklist

### **Phase 1: Settlement Fees** (Week 1)
- [ ] Add 2% fee calculation to `AgentSettlement.tsx`
- [ ] Create `platform_revenue` collection in Juno
- [ ] Implement fee deduction logic
- [ ] Update agent balance after settlement
- [ ] Add revenue tracking dashboard
- [ ] Test settlement flow end-to-end

### **Phase 2: Liquidity Fees** (Week 2)
- [ ] Add 1% fee calculation to `AgentFunding.tsx`
- [ ] Implement fee deduction from funded amount
- [ ] Record platform revenue
- [ ] Show fee breakdown in UI
- [ ] Test funding flow end-to-end

### **Phase 3: Bitcoin Spread** (Week 3)
- [ ] Add 1% spread to `BitcoinService.getExchangeRate()`
- [ ] Implement buy/sell rate difference
- [ ] Calculate and record spread profit
- [ ] Show market vs platform rate to users
- [ ] Test Bitcoin exchange flow

### **Phase 4: Agent Subscriptions** (Week 4)
- [ ] Create subscription management system
- [ ] Implement monthly billing cycle
- [ ] Auto-deduct subscription fee
- [ ] Suspend non-paying agents
- [ ] Add subscription dashboard
- [ ] Test billing automation

### **Phase 5: Analytics & Reporting** (Week 5)
- [ ] Create admin revenue dashboard
- [ ] Implement revenue tracking metrics
- [ ] Add monthly/yearly reports
- [ ] Integrate with DAO treasury
- [ ] Build public transparency page

---

## 📈 Success Metrics

### **Key Performance Indicators**

**Revenue Metrics**:
- Monthly Recurring Revenue (MRR)
- Revenue per Agent
- Revenue per User
- Revenue Growth Rate
- Revenue Mix (% from each stream)

**Operational Metrics**:
- Agent Churn Rate
- User Churn Rate
- Transaction Volume
- Average Transaction Size
- Settlement Frequency

**Profitability Metrics**:
- Gross Margin
- Operating Margin
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- LTV/CAC Ratio

---

## ⚠️ Critical Notes

1. **The 30% transaction fee split is NOT real revenue** - it's accounting only
2. **Real revenue comes from 4 concrete streams** - settlement, liquidity, Bitcoin, subscriptions
3. **All revenue must be captured in real bank accounts** - not just Juno database numbers
4. **Platform viability depends on implementing these revenue streams** - currently NOT implemented
5. **Without real revenue capture, AfriTokeni cannot sustain operations** - this is critical business logic

---

## 🎯 Next Steps

1. **Review and approve this revenue model** with stakeholders
2. **Prioritize implementation** of the 4 revenue streams
3. **Set up platform bank accounts** for real money capture
4. **Implement Phase 1 (Settlement Fees)** as proof of concept
5. **Monitor and iterate** based on real-world data

---

*Last Updated: October 2025*
*Status: Revenue streams documented, implementation pending*
