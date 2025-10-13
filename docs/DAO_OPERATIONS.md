# AfriTokeni DAO Operations Guide
## Practical Commands for Token Management & Governance

---

## YOUR DEPLOYED SNS CANISTERS

```bash
SNS_GOVERNANCE=kly22-hyaaa-aaaac-qceeq-cai
SNS_LEDGER=kf2xs-4iaaa-aaaac-qcefq-cai
SNS_ROOT=kq5g7-5aaaa-aaaac-qcega-cai
SNS_SWAP=kx4al-qyaaa-aaaac-qcegq-cai
SNS_INDEX=kc3rg-rqaaa-aaaac-qcefa-cai
```

---

## 1. CHECK YOUR AFRI BALANCE

### Method 1: NNS Wallet (Easiest)
1. Go to https://nns.ic0.app
2. Login with your Internet Identity
3. Click "Neurons" tab
4. View your staked AFRI tokens

### Method 2: dfx CLI
```bash
# Get your principal ID
dfx identity get-principal

# Check your AFRI balance
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_balance_of '(record { 
  owner = principal "$(dfx identity get-principal)"; 
  subaccount = null 
})'

# Result is in e8s format (divide by 100,000,000 to get AFRI)
# Example: 5000000000000000 e8s = 50,000,000 AFRI
```

### Method 3: AfriTokeni Dashboard
1. Login to https://afritokeni.com/dao
2. Your AFRI balance displays at top
3. Shows: Available + Staked + Earned

---

## 2. TRANSFER AFRI TOKENS

### Important: e8s Format
- 1 AFRI = 100,000,000 e8s
- 50M AFRI = 50_000_000_00000000 e8s
- 10M AFRI = 10_000_000_00000000 e8s
- 1M AFRI = 1_000_000_00000000 e8s

### Transfer to Faith (Co-founder)
```bash
# Get Faith's principal ID first
# She needs to: Create Internet Identity at https://identity.ic0.app
# Then share her principal with you

# Transfer 50M AFRI to Faith
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_transfer '(record {
  to = record { 
    owner = principal "<FAITH_PRINCIPAL_ID>"; 
    subaccount = null 
  };
  amount = 50_000_000_00000000;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
})'
```

### Transfer to Investors
```bash
# Investor 1: 5M AFRI
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_transfer '(record {
  to = record { 
    owner = principal "<INVESTOR1_PRINCIPAL>"; 
    subaccount = null 
  };
  amount = 5_000_000_00000000;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
})'

# Investor 2: 3M AFRI
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_transfer '(record {
  to = record { 
    owner = principal "<INVESTOR2_PRINCIPAL>"; 
    subaccount = null 
  };
  amount = 3_000_000_00000000;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
})'
```

### Fund Treasury for Automatic Rewards
```bash
# Transfer 200M AFRI to treasury for user/agent rewards
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_transfer '(record {
  to = record { 
    owner = principal "<TREASURY_PRINCIPAL_ID>"; 
    subaccount = null 
  };
  amount = 200_000_000_00000000;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
})'
```

---

## 3. AUTOMATIC TOKEN DISTRIBUTION

### How It Works
The system automatically distributes AFRI tokens when users/agents complete actions.

**Implementation:** See `src/services/afriTokenService.ts`

### Reward Amounts

**Users Earn:**
- 10 AFRI per transaction
- 15 AFRI for large transactions (>100K UGX)
- 25 AFRI per successful referral
- 5 AFRI per day per 1000 AFRI staked (0.5% daily APY)

**Agents Earn:**
- 50 AFRI per deposit processed
- 50 AFRI per withdrawal processed
- 100 AFRI per Bitcoin exchange
- Bonus multipliers for high ratings

### Backend Integration
```typescript
// Reward user after transaction
await AfriTokenService.rewardTransaction(userId, transactionAmount);

// Reward agent after service
await AfriTokenService.rewardAgentService(agentId, 'deposit');

// Reward referral
await AfriTokenService.rewardReferral(referrerId);
```

### Monitor Treasury Balance
```bash
# Check treasury balance
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_balance_of '(record { 
  owner = principal "<TREASURY_PRINCIPAL_ID>"; 
  subaccount = null 
})'

# Check total AFRI supply
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_total_supply
```

---

## 4. GOVERNANCE PROPOSALS

### Create Proposal (Parameter Change)

**Example: Lower Withdrawal Fee from 3% to 2%**

```bash
dfx canister --network ic call kly22-hyaaa-aaaac-qceeq-cai manage_neuron '(record {
  subaccount = blob "<YOUR_NEURON_SUBACCOUNT>";
  command = variant {
    MakeProposal = record {
      url = "https://afritokeni.com/proposals/lower-fees";
      title = "Lower withdrawal fee from 3% to 2%";
      summary = "Current 3% fee is too high. Reduce to 2% to compete with mobile money.";
      action = variant {
        Motion = record {
          motion_text = "Set withdrawal_fee_percent = 2.0"
        }
      }
    }
  }
})'
```

### Proposal Requirements
- Minimum 10,000 AFRI to create proposal
- 7-day voting period
- 51% approval threshold
- 10% quorum requirement (100M AFRI must vote)

### Voting Process
1. Proposal created and visible in DAO dashboard
2. Token holders vote YES/NO for 7 days
3. If passed (51% YES + 10% quorum), DAO executes automatically
4. Config updated, new fee takes effect immediately

**No code submission needed for parameter changes!**

---

## 5. STAKING & VOTING POWER

### Create Neuron (Stake AFRI)
```bash
# Stake AFRI tokens to create voting neuron
# Longer dissolve delay = More voting power

# 6 months: 1x voting power
# 1 year: 1.5x voting power
# 2 years: 2x voting power
# 4 years: 3x voting power
```

**Use NNS Wallet for staking:**
1. Go to https://nns.ic0.app
2. Click "Neurons" → "Stake Neuron"
3. Enter AFRI amount
4. Choose dissolve delay
5. Confirm transaction

### Vote on Proposals
```bash
# Via NNS Wallet (easiest)
# 1. Go to https://nns.ic0.app
# 2. Click "Neurons" → Select your neuron
# 3. View active proposals
# 4. Vote YES or NO

# Via dfx CLI
dfx canister --network ic call kly22-hyaaa-aaaac-qceeq-cai manage_neuron '(record {
  subaccount = blob "<YOUR_NEURON_SUBACCOUNT>";
  command = variant {
    RegisterVote = record {
      proposal = opt record { id = <PROPOSAL_ID> };
      vote = variant { Yes };
    }
  }
})'
```

---

## 6. VERIFY SNS DEPLOYMENT

```bash
# Check SNS governance status
dfx canister --network ic status kly22-hyaaa-aaaac-qceeq-cai

# Check SNS ledger status
dfx canister --network ic status kf2xs-4iaaa-aaaac-qcefq-cai

# Get total AFRI supply
dfx canister --network ic call kf2xs-4iaaa-aaaac-qcefq-cai icrc1_total_supply

# List all neurons (top token holders)
dfx canister --network ic call kly22-hyaaa-aaaac-qceeq-cai list_neurons '(record { limit = 10 })'
```

---

## 7. FOUNDER ACTION CHECKLIST

### Immediate Actions
- [ ] Check your AFRI balance
- [ ] Get Faith's principal ID
- [ ] Transfer 50M AFRI to Faith
- [ ] Get investor principal IDs
- [ ] Transfer AFRI to investors
- [ ] Fund treasury with 200M AFRI for rewards

### Ongoing Management
- [ ] Monitor treasury balance weekly
- [ ] Vote on proposals as they come
- [ ] Create proposals for platform improvements
- [ ] Track automatic reward distributions
- [ ] Review agent/user earning rates

---

## 8. TROUBLESHOOTING

### "Insufficient balance" error
- Check your balance first
- Remember: amounts are in e8s (multiply by 100,000,000)
- Ensure you have enough AFRI for transfer + fee

### "Invalid principal" error
- Verify principal ID format
- Use `dfx identity get-principal` to check yours
- Recipient must have Internet Identity created

### "Neuron not found" error
- Create neuron first via NNS wallet
- Stake AFRI tokens to create neuron
- Get neuron subaccount from NNS wallet

### Can't see AFRI in NNS wallet
- Make sure you're logged in with correct Internet Identity
- Check "Canisters" tab, not just "Neurons"
- AFRI may be in neurons (staked), not liquid balance

---

## 9. USEFUL LINKS

- **NNS Wallet**: https://nns.ic0.app
- **Internet Identity**: https://identity.ic0.app
- **AfriTokeni DAO Dashboard**: https://afritokeni.com/dao
- **ICP Dashboard**: https://dashboard.internetcomputer.org
- **SNS Documentation**: https://internetcomputer.org/docs/current/developer-docs/daos/sns/

---

## 10. SUPPORT

**Questions?**
- Check whitepaper: `docs/WHITEPAPER.md`
- Review code: `src/services/afriTokenService.ts`
- ICP Forum: https://forum.dfinity.org
- AfriTokeni Discord: [Coming soon]

**Emergency Contact:**
- Email: admin@afritokeni.com
- Phone: +256-700-AFRI (2374)
