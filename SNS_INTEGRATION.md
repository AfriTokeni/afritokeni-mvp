# AfriTokeni SNS Integration

## 🎯 Goal: First SMS-Accessible SNS DAO

We're integrating ICP's Service Nervous System (SNS) for production-grade DAO governance.

## 📋 What We Have

1. **sns_init.yaml** - SNS configuration
   - 1B AFRI tokens (ICRC-1 standard)
   - 40% agents, 30% users, 20% treasury, 10% team
   - Governance parameters configured

2. **deploy-sns.sh** - Deployment script
   - Validates config
   - Deploys SNS canisters
   - Sets up governance

## 🚀 Deployment Steps

### Local Testing
```bash
chmod +x deploy-sns.sh
./deploy-sns.sh
```

### Mainnet Deployment
```bash
# 1. Install SNS CLI
cargo install --git https://github.com/dfinity/sns-cli sns

# 2. Validate config
sns validate sns_init.yaml

# 3. Deploy to IC mainnet
sns deploy --init-config-file sns_init.yaml --network ic
```

## 🔗 Frontend Integration

Replace our services with SNS calls:

### Token Service (afriTokenService.ts)
```typescript
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as ledgerIdl } from "./sns_ledger.did.js";

const agent = new HttpAgent({ host: "https://ic0.app" });
const ledger = Actor.createActor(ledgerIdl, {
  agent,
  canisterId: SNS_LEDGER_CANISTER_ID,
});

// Get balance
const balance = await ledger.icrc1_balance_of({
  owner: Principal.fromText(userId),
  subaccount: [],
});
```

### Governance Service (governanceService.ts)
```typescript
import { idlFactory as govIdl } from "./sns_governance.did.js";

const governance = Actor.createActor(govIdl, {
  agent,
  canisterId: SNS_GOVERNANCE_CANISTER_ID,
});

// Create proposal
await governance.manage_neuron({
  command: [{
    MakeProposal: {
      title: "Reduce fees to 2%",
      summary: "...",
      action: [{ Motion: { motion_text: "..." } }]
    }
  }]
});

// Vote
await governance.manage_neuron({
  command: [{
    RegisterVote: {
      proposal: proposalId,
      vote: 1, // Yes
    }
  }]
});
```

## 📱 SMS Integration

SMS → Our Canister → SNS:

```motoko
// In our ICP canister
public shared(msg) func voteSMS(proposalId: Nat64, vote: Bool) : async Result<(), Text> {
  let caller = msg.caller;
  
  // Call SNS governance canister
  let governance = actor(SNS_GOVERNANCE_ID) : SNSGovernance;
  await governance.manage_neuron({
    command = ?#RegisterVote({
      proposal = ?{ id = proposalId };
      vote = if (vote) 1 else 2;
    });
  });
};
```

## 🎯 Next Steps

1. ✅ SNS config created
2. ✅ Deployment script ready
3. ⏳ Deploy SNS locally for testing
4. ⏳ Update frontend to use SNS
5. ⏳ Deploy to IC mainnet
6. ⏳ Submit NNS proposal for SNS creation

## 🔥 Demo Flow

1. User sends SMS: `VOTE YES PROP-001`
2. Our SMS gateway → Backend canister
3. Backend canister → SNS governance
4. Vote recorded on-chain
5. SMS confirmation sent

**Result: First SMS-accessible SNS DAO in the world!** 🚀
