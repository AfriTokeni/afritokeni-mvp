# AfriTokeni Real SMS Integration Guide

## Overview
This guide covers the real SMS integration using Africa's Talking gateway for production deployment.

## Architecture

```
Feature Phone → SMS → Africa's Talking → Webhook → SMS Server → Command Processor → Juno Backend
                ↓
           USSD Menu
```

## Components Created

### 1. Africa's Talking SMS Gateway (`africasTalkingSMSGateway.ts`)
- Real SMS sending via Africa's Talking API
- Phone number formatting for Uganda (+256)
- Transaction notifications
- Verification codes
- Bitcoin notifications

### 2. SMS Command Processor (`smsCommandProcessor.ts`)
- Processes incoming SMS commands
- Handles: REG, BAL, SEND, WITHDRAW, BTC commands
- Dynamic fee calculation integration
- Confirmation flow for transactions

### 3. USSD Service (`ussdService.ts`)
- Interactive menu-driven interface
- Better UX than raw SMS commands
- Session management
- Multi-step transaction flows

### 4. SMS Webhook Handler (`smsWebhookHandler.ts`)
- Express routes for Africa's Talking webhooks
- `/webhooks/sms/incoming` - Incoming SMS
- `/webhooks/ussd/callback` - USSD sessions
- `/webhooks/sms/delivery` - Delivery reports

### 5. SMS Server (`smsServer.ts`)
- Standalone Express server for webhooks
- Runs on port 3002
- Handles all SMS/USSD traffic

## Setup Instructions

### 1. Get Africa's Talking Credentials

1. Sign up at [Africa's Talking](https://africastalking.com/)
2. Get your API Key and Username
3. Request a shortcode (e.g., *123#)

### 2. Configure Environment Variables

Add to `.env`:
```bash
# Africa's Talking Configuration
AT_API_KEY=your_api_key_here
AT_USERNAME=your_username_here
AT_SHORT_CODE=22948

# SMS Server
SMS_SERVER_PORT=3002
```

### 3. Start SMS Server

```bash
# Development
npm run dev:sms

# Production
npm run build:sms
npm run start:sms
```

### 4. Configure Webhooks

In Africa's Talking dashboard, set webhook URLs:

- **SMS Callback URL**: `https://yourdomain.com/webhooks/sms/incoming`
- **USSD Callback URL**: `https://yourdomain.com/webhooks/ussd/callback`
- **Delivery Report URL**: `https://yourdomain.com/webhooks/sms/delivery`

### 5. Test with ngrok (Development)

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3002

# Use ngrok URL in Africa's Talking webhooks
# Example: https://abc123.ngrok.io/webhooks/sms/incoming
```

## SMS Commands

### Registration
```
REG John Doe
```

### Balance Check
```
BAL
```

### Send Money
```
SEND +256700123456 5000
```

### Withdraw Cash
```
WITHDRAW 50000
```

### Bitcoin Commands
```
BTC BAL              # Check Bitcoin balance
BTC RATE UGX         # Get exchange rate
BTC BUY 100000 UGX   # Buy Bitcoin
BTC SELL 0.001 BTC   # Sell Bitcoin
CONFIRM 123456       # Confirm transaction
```

### Help
```
HELP
*AFRI#
```

## USSD Menu Flow

```
Dial *123#

AfriTokeni - John Doe
Balance: 150,000 UGX

1. Check Balance
2. Send Money
3. Withdraw Cash
4. Bitcoin Services
5. Transaction History
6. Help
```

### Send Money Flow
```
1. Select "2. Send Money"
2. Enter recipient phone: +256700123456
3. Enter amount: 5000
4. Confirm: 1. Confirm / 2. Cancel
5. Success message with new balance
```

### Bitcoin Services
```
1. Check BTC Balance
2. Buy Bitcoin
3. Sell Bitcoin
4. BTC Exchange Rate
5. Back
```

## Integration with Existing System

### DataService Methods Used
- `DataService.getUser(phoneNumber)` - Get user by phone
- `DataService.createUser(userData)` - Create new user
- `DataService.getUserBalance(userId)` - Get balance
- `DataService.updateUserBalance(userId, balance)` - Update balance
- `DataService.getUserTransactions(userId)` - Get transactions

### BitcoinService Methods Used
- `BitcoinService.getBitcoinBalance(userId)` - Get BTC balance
- `BitcoinService.getExchangeRate(currency)` - Get BTC rate
- `BitcoinService.processBitcoinToLocalExchange()` - Process BTC exchange

## Testing

### 1. Test SMS Commands Locally

```bash
# Start SMS server
npm run dev:sms

# Send test SMS via curl
curl -X POST http://localhost:3002/webhooks/sms/incoming \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+256700123456",
    "to": "22948",
    "text": "BAL",
    "date": "2025-01-01T12:00:00Z",
    "id": "test123"
  }'
```

### 2. Test USSD Flow

```bash
# Initial USSD request
curl -X POST http://localhost:3002/webhooks/ussd/callback \
  -H "Content-Type": application/x-www-form-urlencoded" \
  -d "sessionId=session123&serviceCode=*123%23&phoneNumber=%2B256700123456&text="

# Navigate menu (select option 1)
curl -X POST http://localhost:3002/webhooks/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=session123&serviceCode=*123%23&phoneNumber=%2B256700123456&text=1"
```

## Production Deployment

### 1. Deploy SMS Server

```bash
# Build
npm run build:sms

# Deploy to Railway/Heroku/VPS
# Set environment variables
# Start server
npm run start:sms
```

### 2. Configure Domain

- Point subdomain to SMS server (e.g., sms.afritokeni.com)
- Configure SSL certificate
- Update Africa's Talking webhooks with production URLs

### 3. Monitor

- Check SMS delivery rates
- Monitor webhook response times
- Track failed transactions
- Review error logs

## Security Considerations

1. **Webhook Verification**: Verify requests are from Africa's Talking
2. **Rate Limiting**: Prevent SMS spam
3. **PIN Protection**: Add PIN verification for transactions
4. **Transaction Limits**: Set daily/per-transaction limits
5. **Fraud Detection**: Monitor suspicious patterns

## Cost Optimization

- **SMS Costs**: ~$0.01 per SMS in Uganda
- **USSD Costs**: ~$0.005 per session (cheaper than SMS)
- **Recommendation**: Use USSD for menus, SMS for notifications

## Next Steps

1. ✅ SMS Gateway integration
2. ✅ Command processor
3. ✅ USSD menu system
4. ⏳ Multi-language support (Luganda, Swahili)
5. ⏳ Live testing with real phones
6. ⏳ Production deployment
7. ⏳ Lightning Network integration (Week 2)

## Support

For issues or questions:
- Check logs: `tail -f logs/sms-server.log`
- Test webhooks: Use Africa's Talking simulator
- Contact: support@afritokeni.com
