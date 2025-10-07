# USSD Registration Flow Testing Guide

## Overview

This document provides instructions for testing the enhanced USSD registration flow that includes:

1. **Registration Check**: Determines if user is already registered
2. **User Registration**: Collects user name and sends SMS verification
3. **SMS Verification**: Verifies the SMS code sent to user's phone
4. **PIN Setup**: Allows user to set up a secure 4-digit PIN
5. **Main Menu**: Access to AfriTokeni services after successful authentication

## Quick Start

### 1. Setup Test Users (Recommended)

```bash
# Build the project first
npm run build:backend

# Create test users with different states
./setup-test-users.mjs
```

This will create:
- **+254700000000**: User with PIN (1234) and UGX 50,000 balance
- **+254700000001**: User without PIN and UGX 25,000 balance  
- **+254700000002**: Recipient user with PIN (5678) and UGX 10,000 balance
- **+254712345678**: Available for new user registration testing

### 2. Start the USSD Server

```bash
# Option 1: Use the convenience script
./start-ussd-server.sh

# Option 2: Manual start
npm run build:backend
node dist/services/server.js
```

The server will start on `http://localhost:3000`

### 3. Run the Test Suite

```bash
# Install axios if not already installed
npm install axios

# Run the automated test
./test-ussd-registration.js
```

## Manual Testing

You can also test the flow manually using curl commands:

### New User Registration Flow

```bash
# Step 1: Initial USSD dial (*123#)
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "phoneNumber": "254712345678",
    "text": ""
  }'

# Step 2: Enter first name
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "phoneNumber": "254712345678",
    "text": "John"
  }'

# Step 3: Enter last name
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "phoneNumber": "254712345678",
    "text": "Doe"
  }'

# Step 4: Enter verification code (check server logs for the code)
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "phoneNumber": "254712345678",
    "text": "123456"
  }'

# Step 5: Set PIN
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "phoneNumber": "254712345678",
    "text": "1234"
  }'

# Step 6: Confirm PIN
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_001",
    "phoneNumber": "254712345678",
    "text": "1234"
  }'
```

## Expected Flow

### For New Users:
1. **Welcome Message**: "Welcome to AfriTokeni! You are not registered yet. Please enter your first name:"
2. **Last Name Request**: "Hello [FirstName]! Now please enter your last name:"
3. **SMS Verification**: "Thank you [FirstName] [LastName]! We've sent a verification code to your phone. Please enter the 6-digit code:"
4. **PIN Setup**: "Verification successful! Account created successfully. Now please set up a 4-digit PIN to secure your account: Enter your new PIN:"
5. **PIN Confirmation**: "Please confirm your PIN by entering it again:"
6. **Success**: "PIN set successfully! Welcome to AfriTokeni!"

### For Existing Users (No PIN):
1. **PIN Setup**: "Welcome back to AfriTokeni! To secure your account, please set up a 4-digit PIN: Enter your new PIN:"

### For Existing Users (With PIN):
1. **PIN Verification**: "Welcome to AfriTokeni! Please enter your 4-digit PIN:"
2. **PIN Authentication**: User enters their 4-digit PIN
3. **Main Menu**: If PIN is correct, access to AfriTokeni services
4. **Error Handling**: If PIN is wrong, user gets up to 3 attempts before being locked out

## Recent Fixes

### ✅ **Fixed: Existing User with PIN Flow**
- **Issue**: Users with existing PINs were not being properly authenticated
- **Root Cause**: The `handlePinCheck` function was checking if user had a PIN but not validating the entered PIN
- **Solution**: Updated `handlePinCheck` to properly verify the entered PIN against stored PIN
- **Features Added**:
  - Proper PIN validation with 4-digit format checking
  - Attempt limiting (3 attempts max)
  - Clear error messages for invalid PINs
  - Proper session state management during PIN verification

## Debugging

### Check Server Logs
The server includes comprehensive logging with emojis for easy identification:

- 🔍 Registration checks
- 📝 User registration steps
- 📱 SMS sending
- 🔐 Code verification
- 👤 User creation
- 🔑 PIN operations

### Common Issues

1. **SMS Not Sending**: Check your AfricasTalking credentials in environment variables
2. **Verification Failing**: Look for the verification code in server logs
3. **User Already Exists**: Clear the Juno datastore or use a different phone number

### Environment Variables

Make sure these are set:

```bash
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_api_key
JUNO_SATELLITE_ID=your_satellite_id
JUNO_AUTH_TOKEN=your_auth_token
```

## Development Notes

### Session State Management
- Sessions are stored in memory (will be lost on server restart)
- Each session tracks: currentMenu, step, data, and verification attempts
- Session timeout can be configured

### Menu Flow
- `registration_check` → `user_registration` → `verification` → `pin_setup` → `main`
- `registration_check` → `pin_setup` (existing user without PIN)
- `registration_check` → `pin_check` → `main` (existing user with PIN)

### Error Handling
- Invalid inputs are handled gracefully
- Maximum 3 verification attempts
- Comprehensive error messages for users

## Production Considerations

1. **Rate Limiting**: Add rate limiting for SMS sending
2. **Session Storage**: Use Redis or database for session persistence
3. **SMS Credits**: Monitor AfricasTalking credits
4. **Logging**: Implement proper logging service (e.g., Winston)
5. **Security**: Add input sanitization and validation
6. **Monitoring**: Set up health checks and alerts

## Files Created/Modified

- `src/services/server.ts` - Enhanced with new registration flow and **fixed PIN verification**
- `test-ussd-registration.js` - Automated test suite with PIN validation tests
- `setup-test-users.mjs` - Script to create test users with different states
- `start-ussd-server.sh` - Convenience script to start server
- `USSD_TESTING_GUIDE.md` - Comprehensive testing documentation

## Bug Fixes in This Update

### 🐛 **Fixed: Existing User PIN Verification**
**Problem**: Users with existing PINs were being redirected to main menu without PIN verification
**Solution**: 
- Updated `handlePinCheck()` to implement proper step-based PIN verification
- Added PIN format validation (4 digits only)
- Added attempt limiting (maximum 3 attempts)
- Added proper error messaging and session state management

**Impact**: Existing users now must correctly enter their PIN to access services, improving security

## Next Steps

1. Test with real AfricasTalking integration
2. Implement session persistence
3. Add more comprehensive error handling
4. Create integration with frontend dashboard
5. Add metrics and monitoring