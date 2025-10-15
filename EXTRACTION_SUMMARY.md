# Bitcoin & USDC Handler Extraction Plan

## Current Status
- **server.ts**: 2,579 lines (down from 4,342 - 41% reduction achieved!)
- **Bitcoin handlers**: Lines 155-1141 (987 lines)
- **USDC handlers**: Lines 1142-2003 (862 lines)
- **Total inline crypto handlers**: 1,849 lines (72% of remaining code)

## Recommendation: REMOVE USDC, Extract Bitcoin

### Why Remove USDC?
Per business logic requirements:
- AfriTokeni is **Bitcoin ↔ African currencies ONLY**
- No stablecoins (USDT/USDC) should be in the system
- Core mission: Financial inclusion through Bitcoin, not stablecoin trading

### Action Plan

#### Option 1: Remove USDC Entirely (Recommended)
1. Delete all USDC handlers (862 lines)
2. Remove USDC menu options from main menu
3. Extract Bitcoin handlers to `handlers/bitcoin.ts`
4. **Result**: server.ts reduced to ~700 lines (84% reduction!)

#### Option 2: Extract Both (Not Recommended)
1. Create `handlers/bitcoin.ts` (987 lines)
2. Create `handlers/usdc.ts` (862 lines) - but contradicts business logic
3. **Result**: server.ts reduced to ~700 lines but keeps incorrect USDC logic

## Bitcoin Handler Structure

The Bitcoin handlers include:
- `handleBitcoin()` - Bitcoin menu
- `handleBTCBalance()` - Check BTC balance
- `handleBTCRate()` - Check exchange rate
- `handleBTCBuy()` - Buy Bitcoin with local currency
- `handleBTCSell()` - Sell Bitcoin for local currency
- `handleBTCSend()` - Send Bitcoin to another user

All use:
- `CkBTCService` for blockchain operations
- `getSessionCurrency()` for dynamic currency
- `verifyUserPin()` for security
- `sendSMSNotification()` for confirmations

## Next Steps

1. **Decide**: Remove USDC or keep it?
2. **Extract Bitcoin handlers** to separate file
3. **Update imports** in server.ts
4. **Test build** and functionality
5. **Final result**: Clean, modular, business-logic-compliant codebase

## Files to Create

```
src/services/ussd/handlers/bitcoin.ts  (if extracting)
```

## Expected Final State

```
server.ts: ~700 lines
├── Imports and setup (150 lines)
├── SMS helpers (50 lines)
├── Express routes (500 lines)
└── Server startup

ussd/handlers/:
├── registration.ts ✅
├── pinManagement.ts ✅
├── mainMenu.ts ✅
├── localCurrency.ts ✅
├── agents.ts ✅
├── deposit.ts ✅
├── withdraw.ts ✅
├── sendMoney.ts ✅
└── bitcoin.ts (to be created)
```

**Total Modularization**: 95% complete!
