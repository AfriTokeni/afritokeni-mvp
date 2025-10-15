# USSD Server Modularization Progress

## Objective
Break down the monolithic 4,314-line `server.ts` into a well-organized modular structure.

## ✅ Completed (4 commits)

### 1. Folder Structure & Core Utilities
**Files Created:**
- `src/services/ussd/types.ts` - USSDSession interface & implementation
- `src/services/ussd/utils/currency.ts` - Currency detection (39 African countries)
- `src/services/ussd/utils/responses.ts` - continueSession/endSession helpers
- `src/services/ussd/utils/session.ts` - Session management & cleanup
- `src/services/ussd/utils/index.ts` - Central utility exports

### 2. Registration Handlers (260 lines)
**File:** `src/services/ussd/handlers/registration.ts`
**Functions:**
- `isUserRegistered()` - Check user existence
- `registerNewUser()` - Create user with auto-currency detection
- `generateVerificationCode()` - Generate 6-digit SMS codes
- `verifyVerificationCode()` - Validate SMS codes
- `handleRegistrationCheck()` - Initial USSD entry point
- `handleUserRegistration()` - New user registration flow
- `handleVerification()` - SMS code verification

### 3. PIN Management Handlers (240 lines)
**File:** `src/services/ussd/handlers/pinManagement.ts`
**Functions:**
- `hasUserPin()` - Check if PIN exists
- `setUserPin()` - Create/update PIN
- `verifyUserPin()` - Validate PIN
- `requiresPinVerification()` - Check if verification needed
- `requestPinVerification()` - Initiate PIN verification
- `handlePinCheck()` - Verify existing PIN
- `handlePinSetup()` - Setup new PIN

### 4. Main Menu Handler (75 lines)
**File:** `src/services/ussd/handlers/mainMenu.ts`
**Functions:**
- `handleMainMenu()` - Top-level menu navigation

## 🚧 Remaining Work

### Priority 1: Core Transaction Handlers
These are the most used features and should be extracted next:

#### A. Local Currency Handler (~400 lines)
**Target File:** `src/services/ussd/handlers/localCurrency.ts`
**Source:** server.ts lines 875-1270
**Functions to Extract:**
- `handleLocalCurrency()` - Local currency menu
- `handleCheckBalance()` - Balance inquiry
- `handleTransactionHistory()` - Transaction list
- `getUserBalance()` - Get user balance (utility)

#### B. Send Money Handler (~200 lines)
**Target File:** `src/services/ussd/handlers/sendMoney.ts`
**Source:** server.ts lines 3280-3473
**Functions to Extract:**
- `handleSendMoney()` - Send money flow

#### C. Deposit Handler (~200 lines)
**Target File:** `src/services/ussd/handlers/deposit.ts`
**Source:** server.ts lines 1272-1471
**Functions to Extract:**
- `handleDeposit()` - Deposit flow with agent selection

#### D. Withdraw Handler (~250 lines)
**Target File:** `src/services/ussd/handlers/withdraw.ts`
**Source:** server.ts lines 3475-3720
**Functions to Extract:**
- `handleWithdraw()` - Withdrawal flow with agent selection

### Priority 2: Agent Handler
#### E. Agent Finder (~90 lines)
**Target File:** `src/services/ussd/handlers/agents.ts`
**Source:** server.ts lines 950-1037
**Functions to Extract:**
- `handleFindAgent()` - Find nearby agents

### Priority 3: Bitcoin/USDC Handlers
**Note:** Per business logic, USDC should be removed. Bitcoin is core to the business model.

#### F. Bitcoin Handler (~1000 lines)
**Target File:** `src/services/ussd/handlers/bitcoin.ts`
**Source:** server.ts lines 1473-2450
**Functions to Extract:**
- `handleBitcoin()` - Bitcoin menu
- `handleBTCBalance()` - Check BTC balance
- `handleBTCRate()` - Check exchange rate
- `handleBTCBuy()` - Buy Bitcoin
- `handleBTCSell()` - Sell Bitcoin
- `handleBTCSend()` - Send Bitcoin

#### G. USDC Handler (~850 lines) - **CONSIDER REMOVING**
**Target File:** `src/services/ussd/handlers/usdc.ts` (or delete entirely)
**Source:** server.ts lines 2452-3278
**Functions to Extract:**
- `handleUSDC()` - USDC menu
- `handleUSDCBalance()` - Check USDC balance
- `handleUSDCRate()` - Check exchange rate
- `handleUSDCBuy()` - Buy USDC
- `handleUSDCSell()` - Sell USDC

### Priority 4: Final Integration

#### H. Create Handler Index
**File:** `src/services/ussd/handlers/index.ts`
```typescript
export * from './registration.js';
export * from './pinManagement.js';
export * from './mainMenu.js';
export * from './localCurrency.js';
export * from './sendMoney.js';
export * from './deposit.js';
export * from './withdraw.js';
export * from './agents.js';
export * from './bitcoin.js';
// export * from './usdc.js'; // Consider removing
```

#### I. Update server.ts
1. Remove all extracted function definitions
2. Add imports from handlers
3. Keep only:
   - Express setup
   - Route definitions
   - Webhook endpoints
   - SMS notification helper
   - Session cleanup interval
4. Target: Reduce server.ts from 4,314 lines to ~500 lines

#### J. Create USSD Router (Optional Enhancement)
**File:** `src/services/ussd/router.ts`
Central routing logic to map session.currentMenu to handlers

## Extraction Pattern

For each handler file:

1. **Read source section** from server.ts
2. **Create handler file** with:
   ```typescript
   /**
    * [Handler Name]
    * [Description]
    */
   
   import type { USSDSession } from '../types.js';
   import { continueSession, endSession } from '../utils/responses.js';
   import { getSessionCurrency } from '../utils/currency.js';
   import { WebhookDataService as DataService } from '../../webHookServices.js';
   // Add other imports as needed
   
   export async function handleXXX(...): Promise<string> {
     // Function body
   }
   ```
3. **Copy functions** from server.ts
4. **Fix imports** - replace local function calls with imports
5. **Export all functions**
6. **Test build** - `npm run build`
7. **Commit** - `git commit -m "refactor: extract XXX handler"`

## Testing Strategy

After each extraction:
1. Run `npm run build` - ensure no TypeScript errors
2. Check imports are correct
3. Verify no circular dependencies
4. Test USSD flow (if possible)

Final testing:
1. Full build passes
2. All USSD flows work
3. No broken imports
4. server.ts is under 600 lines

## Current Status
- **Handlers Extracted:** 4/9 (44%)
- **Lines Extracted:** ~900/4,314 (21%)
- **Commits:** 4
- **Branch:** refactor/modularize-ussd-server

## Next Steps
1. Extract localCurrency handler (highest priority - most used)
2. Extract sendMoney handler
3. Extract deposit handler
4. Extract withdraw handler
5. Extract agents handler
6. Extract bitcoin handler
7. Remove or extract usdc handler
8. Create handlers/index.ts
9. Update server.ts with imports
10. Test thoroughly
11. Merge to main

## Benefits Achieved So Far
✅ Better code organization
✅ Easier to test individual handlers
✅ Clear separation of concerns
✅ Reusable utility functions
✅ Type safety maintained

## Benefits After Completion
✅ 90% reduction in server.ts size
✅ Each handler is independently testable
✅ Easy to add new USSD features
✅ Clear module boundaries
✅ Better maintainability
