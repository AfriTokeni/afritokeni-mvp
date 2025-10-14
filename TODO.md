# AfriTokeni - Features To Implement

This document tracks features that have BDD scenarios written but are not yet implemented in the application.

## Test Status
- ✅ **39 scenarios PASSING** - Core money flows working
- ⏳ **14 scenarios PENDING** - Features to implement next
- **Total**: 53 scenarios

---

## 🔒 Security Features (@pending)

### 1. Account Lockout System
**Priority**: HIGH  
**Estimated Time**: 2-3 hours

**Requirements**:
- Track failed login attempts per user
- Lock account after 3 failed attempts
- Generate 6-digit SMS unlock code
- 30-minute auto-unlock timeout
- Send security notifications

**Implementation Needs**:
- Database schema for login attempts
- SMS gateway integration
- Unlock code generation/verification

**Test**: `tests/features/security.feature:7`

---

### 2. Suspicious Transaction Detection
**Priority**: MEDIUM  
**Estimated Time**: 3-4 hours

**Requirements**:
- Calculate user's normal transaction patterns
- Flag transactions 10x+ above average
- Require additional verification for flagged transactions
- Send security alerts

**Implementation Needs**:
- Transaction history analysis
- Pattern detection algorithm
- Verification workflow

**Test**: `tests/features/security.feature:15`

---

### 3. Escrow Brute-Force Protection
**Priority**: HIGH  
**Estimated Time**: 1-2 hours

**Requirements**:
- Track failed escrow code attempts
- Lock escrow after 5 wrong attempts
- Notify user of lock
- Manual verification to unlock

**Implementation Needs**:
- Attempt tracking in database
- Lock mechanism in EscrowService
- Admin unlock interface

**Test**: `tests/features/security.feature:23`

---

### 4. Duplicate Withdrawal Prevention
**Priority**: HIGH  
**Estimated Time**: 1 hour

**Requirements**:
- Check for existing pending withdrawals
- Reject duplicate requests
- Show existing withdrawal status

**Implementation Needs**:
- Withdrawal status tracking
- Duplicate detection logic

**Test**: `tests/features/security.feature:31`

---

### 5. Agent KYC Verification
**Priority**: MEDIUM  
**Estimated Time**: 4-6 hours

**Requirements**:
- Government ID upload
- Proof of address upload
- KYC verification workflow
- Block transactions until verified

**Implementation Needs**:
- File upload system
- KYC verification process
- Admin approval interface

**Test**: `tests/features/security.feature:38`

---

### 6. Transaction Reversal Protection
**Priority**: LOW  
**Estimated Time**: 1 hour

**Requirements**:
- Block reversals after 2 hours
- Log reversal attempts
- Suggest support contact

**Implementation Needs**:
- Transaction timestamp tracking
- Reversal attempt logging

**Test**: `tests/features/security.feature:45`

---

### 7. Multi-Device Login Detection
**Priority**: MEDIUM  
**Estimated Time**: 2-3 hours

**Requirements**:
- Track devices per user
- Notify on new device login
- Device verification flow
- Logout other devices option

**Implementation Needs**:
- Device fingerprinting
- Device tracking database
- Notification system

**Test**: `tests/features/security.feature:53`

---

### 8. Phishing Protection
**Priority**: MEDIUM  
**Estimated Time**: 2 hours

**Requirements**:
- Detect suspicious URLs
- Warn users about phishing
- Show official contact methods
- Phishing report system

**Implementation Needs**:
- URL validation
- Warning UI
- Report collection

**Test**: `tests/features/security.feature:61`

---

### 9. Escrow Auto-Refund
**Priority**: HIGH  
**Estimated Time**: 2 hours

**Requirements**:
- 24-hour escrow timeout
- Automatic refund on expiration
- Expiration notifications
- Status tracking

**Implementation Needs**:
- Background job for timeout checking
- Refund automation
- Notification system

**Test**: `tests/features/security.feature:69`

---

### 10. Large Transaction Verification
**Priority**: HIGH  
**Estimated Time**: 3-4 hours

**Requirements**:
- Detect transactions >= 1 ckBTC
- Send SMS + email verification codes
- 10-minute confirmation window
- Block transaction until verified

**Implementation Needs**:
- SMS/email service integration
- Verification code generation
- Timeout handling

**Test**: `tests/features/security.feature:78`

---

## 👤 Agent Features (@pending)

### 11. Commission Settlement System
**Priority**: HIGH  
**Estimated Time**: 4-5 hours

**Requirements**:
- Track commission earnings per transaction
- Commission balance management
- Settlement requests to bank accounts
- Settlement confirmation

**Implementation Needs**:
- CommissionService implementation
- Database schema for commissions
- Bank transfer integration
- Settlement tracking

**Test**: `tests/features/agent-flows.feature:47`

---

### 12. Agent Daily Transaction Limits
**Priority**: MEDIUM  
**Estimated Time**: 2-3 hours

**Requirements**:
- Track daily transaction volume
- Basic verification: 1M UGX limit
- Advanced verification: 10M UGX limit
- Upgrade prompts

**Implementation Needs**:
- Daily volume tracking
- Verification level system
- Limit enforcement

**Test**: `tests/features/agent-flows.feature:55`

---

### 13. Agent Reputation System
**Priority**: LOW  
**Estimated Time**: 3-4 hours

**Requirements**:
- Star ratings (1-5)
- Transaction count display
- Reputation-based sorting
- Review system

**Implementation Needs**:
- Rating database schema
- Review collection
- Reputation calculation
- Search/sort integration

**Test**: `tests/features/agent-flows.feature:62`

---

### 14. Offline Transaction Queuing
**Priority**: LOW  
**Estimated Time**: 4-6 hours

**Requirements**:
- Queue transactions when offline
- Sync when connection restored
- Conflict resolution
- Customer confirmation

**Implementation Needs**:
- Local storage system
- Sync mechanism
- Conflict handling logic
- Background sync

**Test**: `tests/features/agent-flows.feature:71`

---

## 📋 Implementation Priority

### Phase 1 - Critical Security (Week 1)
1. ✅ Account Lockout
2. ✅ Escrow Brute-Force Protection
3. ✅ Duplicate Withdrawal Prevention
4. ✅ Escrow Auto-Refund
5. ✅ Large Transaction Verification

### Phase 2 - Agent Operations (Week 2)
6. ✅ Commission Settlement System
7. ✅ Agent Daily Limits

### Phase 3 - Enhanced Security (Week 3)
8. ✅ Suspicious Transaction Detection
9. ✅ Multi-Device Login Detection
10. ✅ Phishing Protection

### Phase 4 - Nice-to-Have (Week 4)
11. ✅ Agent KYC Verification
12. ✅ Transaction Reversal Protection
13. ✅ Agent Reputation System
14. ✅ Offline Queuing

---

## 🧪 Running Tests

```bash
# Run only implemented tests (excludes @pending)
npm run test:unit

# See all scenarios including pending
cucumber-js tests/features/*.feature --dry-run

# Count pending scenarios
grep -r "@pending" tests/features/*.feature | wc -l
```

---

## 📝 Notes

- All @pending scenarios have feature files written
- Step definitions were removed to avoid fake tests
- Implement features one at a time, then remove @pending tag
- Each feature should have real service implementation
- No `assert.ok(true)` - only meaningful assertions

---

**Last Updated**: October 14, 2025
