# AfriTokeni SvelteKit Migration Plan

## Project Structure

```
sveltekit-app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── layout/        # Header, Footer
│   │   │   ├── landing/       # Landing page components
│   │   │   ├── auth/          # Login, Register forms
│   │   │   ├── user/          # User dashboard components
│   │   │   ├── agent/         # Agent dashboard components
│   │   │   ├── admin/         # Admin components
│   │   │   └── shared/        # Reusable components
│   │   ├── stores/            # Svelte stores (auth, user state)
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   └── types/             # TypeScript types
│   └── routes/
│       ├── (public)/          # Public routes group
│       │   ├── +page.svelte   # Landing page
│       │   └── info/          # Informational pages
│       ├── auth/              # Authentication pages
│       ├── users/             # User dashboard
│       ├── agents/            # Agent dashboard
│       └── admin/             # Admin dashboard
```

## ✅ Phase 1: Foundation (COMPLETED)
- [x] Initialize SvelteKit project with TypeScript
- [x] Configure TailwindCSS v4
- [x] Install @lucide/svelte for icons
- [x] Set up Vite config for SSR
- [x] Create organized folder structure
- [x] Migrate landing page with all sections
- [x] Create layout components (Header, Footer)
- [x] Create SavingsComparisonTable component
- [x] Implement Svelte 5 runes ($state, $derived)

## 📋 Phase 2: Informational Pages
**Goal:** Create static/informational pages

### Pages to Create:
1. **Escrow Page** (`/info/escrow`)
   - Explain escrow system
   - 6-digit codes
   - 24hr refund policy
   - Security features

2. **ckBTC Page** (`/info/ckbtc`)
   - What is ckBTC
   - How it works
   - Benefits
   - Technical details

3. **ckUSDC Page** (`/info/ckusdc`)
   - What is ckUSDC
   - Stability benefits
   - Use cases
   - Comparison with ckBTC

4. **DAO Info Page** (`/info/dao`)
   - Governance model
   - Voting system
   - Community ownership
   - How to participate

5. **Tariff/Pricing Page** (`/info/tariff`)
   - Dynamic fee structure
   - Location-based pricing
   - Fee calculator
   - Comparison with competitors

6. **About Page** (`/info/about`)
   - Mission and vision
   - Team
   - Technology stack
   - Roadmap

7. **Whitepaper Page** (`/info/whitepaper`)
   - Full technical documentation
   - Business model
   - Market analysis

**Commit:** `feat: add informational pages (escrow, ckbtc, ckusdc, dao, tariff, about)`

## 📋 Phase 3: USSD Playground
**Goal:** Interactive USSD simulator

### Components:
- `USSDPlayground.svelte` - Main playground component
- `USSDScreen.svelte` - Phone screen simulator
- `USSDInput.svelte` - Input handler
- `USSDSession.svelte` - Session state manager

### Features:
- Simulated USSD menu navigation
- Real-time command processing
- Session history
- Demo mode with mock data

**Commit:** `feat: add USSD playground with interactive simulator`

## 📋 Phase 4: Authentication System
**Goal:** User authentication with ICP/Juno

### Pages:
1. **Login Page** (`/auth/login`)
   - Email/phone + password
   - ICP Internet Identity integration
   - SMS authentication option

2. **Register Page** (`/auth/register`)
   - User registration form
   - Agent registration option
   - KYC requirements

### Components:
- `LoginForm.svelte`
- `RegisterForm.svelte`
- `ICPAuthButton.svelte`
- `SMSVerification.svelte`

### Stores:
- `authStore.ts` - Authentication state
- `userStore.ts` - User profile data

**Commit:** `feat: implement authentication system with ICP integration`

## 📋 Phase 5: User Dashboard
**Goal:** Complete user banking interface

### Pages:
1. **Dashboard** (`/users/dashboard`)
   - Balance overview
   - Recent transactions
   - Quick actions

2. **Portfolio** (`/users/portfolio`)
   - Multi-currency balances
   - Asset allocation
   - Performance charts

3. **Send Money** (`/users/send`)
   - Local currency transfers
   - ckBTC/ckUSDC transfers
   - Phone number lookup

4. **Deposit** (`/users/deposit`)
   - Agent selection
   - QR code generation
   - Transaction tracking

5. **Withdraw** (`/users/withdraw`)
   - Agent selection
   - Withdrawal code
   - Cash pickup

6. **Bitcoin Exchange** (`/users/bitcoin`)
   - Buy/Sell ckBTC
   - Exchange rates
   - Transaction history

7. **USDC Exchange** (`/users/usdc`)
   - Buy/Sell ckUSDC
   - Stable value transfers

8. **Find Agents** (`/users/agents`)
   - Map view
   - List view
   - Distance calculation
   - Agent ratings

9. **Transaction History** (`/users/transactions`)
   - Filterable list
   - Export functionality
   - Receipt generation

10. **Settings** (`/users/settings`)
    - Profile management
    - Security settings
    - Notification preferences

**Commit:** `feat: implement user dashboard with all banking features`

## 📋 Phase 6: Agent Dashboard
**Goal:** Agent management interface

### Pages:
1. **Agent Dashboard** (`/agents/dashboard`)
   - Balance overview (cash vs digital)
   - Pending transactions
   - Performance metrics

2. **Deposit Processing** (`/agents/deposit`)
   - Customer verification
   - Transaction approval
   - Balance updates

3. **Withdrawal Processing** (`/agents/withdraw`)
   - Code verification
   - Cash disbursement
   - Transaction completion

4. **Customers** (`/agents/customers`)
   - Customer list
   - Transaction history
   - Search and filters

5. **Funding** (`/agents/funding`)
   - Add liquidity
   - Bank transfer
   - Mobile money

6. **Settlement** (`/agents/settlement`)
   - Withdraw earnings
   - Settlement history
   - Bank account management

7. **Bitcoin Operations** (`/agents/bitcoin`)
   - Buy/Sell requests
   - Escrow management
   - Exchange rates

**Commit:** `feat: implement agent dashboard with transaction processing`

## 📋 Phase 7: Admin Dashboard
**Goal:** Platform administration

### Pages:
1. **Admin Dashboard** (`/admin/dashboard`)
   - System metrics
   - User statistics
   - Transaction volume

2. **KYC Management** (`/admin/kyc`)
   - Pending verifications
   - Document review
   - Approve/reject

3. **User Management** (`/admin/users`)
   - User list
   - Account status
   - Permissions

4. **Agent Management** (`/admin/agents`)
   - Agent approval
   - Performance monitoring
   - Compliance checks

5. **System Settings** (`/admin/settings`)
   - Fee configuration
   - Currency management
   - System parameters

**Commit:** `feat: implement admin dashboard with KYC and user management`

## 📋 Phase 8: Services & Stores
**Goal:** State management and API integration

### Services:
- `authService.ts` - Authentication API
- `userService.ts` - User operations
- `agentService.ts` - Agent operations
- `transactionService.ts` - Transaction processing
- `bitcoinService.ts` - Bitcoin operations
- `usdcService.ts` - USDC operations
- `kycService.ts` - KYC verification

### Stores:
- `authStore.ts` - Auth state
- `userStore.ts` - User data
- `balanceStore.ts` - Balance tracking
- `transactionStore.ts` - Transaction history
- `agentStore.ts` - Agent data

**Commit:** `feat: implement services and stores for state management`

## 📋 Phase 9: Routing & Navigation
**Goal:** Complete routing setup

### Features:
- Route groups for public/private pages
- Protected routes with auth guards
- Role-based access control
- Navigation guards
- 404 page
- Error boundaries

**Commit:** `feat: implement routing with auth guards and role-based access`

## 📋 Phase 10: Testing & Polish
**Goal:** Ensure quality and performance

### Tasks:
- [ ] Test all pages on mobile/desktop
- [ ] Verify all forms work correctly
- [ ] Test authentication flows
- [ ] Verify transaction processing
- [ ] Check responsive design
- [ ] Optimize images and assets
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test accessibility
- [ ] Performance optimization

**Commit:** `test: add comprehensive testing and polish UI`

## 📋 Phase 11: Deployment
**Goal:** Deploy to production

### Tasks:
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Configure analytics

**Commit:** `chore: configure deployment and production settings`

## Commit Convention

Using Conventional Commits format:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `style:` - Styling changes
- `docs:` - Documentation
- `test:` - Testing
- `chore:` - Build/config changes

## Notes

- Use Svelte 5 runes throughout ($state, $derived, $effect)
- Maintain TypeScript strict mode
- Follow existing design system
- Keep components modular and reusable
- Write clean, documented code
- Test each phase before moving to next
