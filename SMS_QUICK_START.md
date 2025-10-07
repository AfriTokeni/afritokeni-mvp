# 🚀 SMS/USSD Quick Start - Get Live in 30 Minutes!

**Goal**: Test real SMS and USSD with your phone RIGHT NOW

---

## ⚡ Step 1: Africa's Talking Account (5 min)

### Sign Up
1. Go to **https://africastalking.com/**
2. Click **"Sign Up"** → Choose **"Sandbox"** (FREE for testing)
3. Verify your email
4. Login to dashboard

### Get Credentials
1. Go to **Dashboard** → **Settings** → **API Key**
2. Copy your:
   - **Username**: `sandbox` (or your custom username)
   - **API Key**: (long string like `atsk_xxxxx...`)

### Get Shortcode
1. Go to **Dashboard** → **USSD** → **Shared Codes**
2. Use sandbox shortcode: **`22948`** (or request your own)

---

## ⚡ Step 2: Configure Environment (1 min)

Open `.env` file and replace placeholders:

```bash
# Replace 'your_api_key_here' with your actual API key
AT_API_KEY=atsk_your_actual_api_key_from_dashboard
AT_USERNAME=sandbox
AT_SHORT_CODE=22948
```

**Example**:
```bash
AT_API_KEY=atsk_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
AT_USERNAME=sandbox
AT_SHORT_CODE=22948
```

---

## ⚡ Step 3: Start SMS Server (1 min)

Open terminal in project directory:

```bash
npm run dev:sms
```

You should see:
```
🚀 SMS Server running on port 3002
📱 Webhook endpoints:
   POST /webhooks/sms/incoming
   POST /webhooks/ussd/callback
   POST /webhooks/sms/delivery
```

**Keep this terminal running!**

---

## ⚡ Step 4: Setup ngrok (5 min)

### Install ngrok
```bash
# If not installed
npm install -g ngrok

# Or download from: https://ngrok.com/download
```

### Start ngrok
Open a **NEW terminal** (keep SMS server running):

```bash
ngrok http 3002
```

You'll see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3002
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

**Keep this terminal running too!**

---

## ⚡ Step 5: Configure Webhooks (5 min)

### In Africa's Talking Dashboard:

#### For SMS:
1. Go to **Dashboard** → **SMS** → **Settings**
2. Set **Callback URL**: `https://abc123.ngrok.io/webhooks/sms/incoming`
3. Click **Save**

#### For USSD:
1. Go to **Dashboard** → **USSD** → **Shared Codes**
2. Click on your shortcode (22948)
3. Set **Callback URL**: `https://abc123.ngrok.io/webhooks/ussd/callback`
4. Click **Save**

#### For Delivery Reports:
1. Go to **Dashboard** → **SMS** → **Settings**
2. Set **Delivery Report URL**: `https://abc123.ngrok.io/webhooks/sms/delivery`
3. Click **Save**

---

## ⚡ Step 6: Test with Your Phone! (10 min)

### Test SMS Commands

#### Register Your Phone
Send SMS to **22948**:
```
REG John Doe
```

You should receive:
```
Welcome to AfriTokeni, John Doe! 
Your account is ready.
Reply HELP for commands.
```

#### Check Balance
Send SMS:
```
BAL
```

You should receive:
```
Your balance is 0 UGX
```

#### Get Help
Send SMS:
```
HELP
```

You should receive list of all commands.

---

### Test USSD Menu

#### Dial USSD Code
On your phone, dial:
```
*22948#
```

You should see:
```
AfriTokeni - John Doe
Balance: 0 UGX

1. Check Balance
2. Send Money
3. Withdraw Cash
4. Bitcoin Services
5. Transaction History
6. Help
```

#### Navigate Menu
- Press **1** to check balance
- Press **2** to send money (follow prompts)
- Press **4** for Bitcoin services

---

## 🎯 Available SMS Commands

```bash
# Registration
REG John Doe

# Balance
BAL

# Send Money
SEND +256700123456 5000

# Withdraw
WITHDRAW 50000

# Bitcoin Balance
BTC BAL

# Bitcoin Rate
BTC RATE UGX

# Buy Bitcoin
BTC BUY 100000 UGX

# Sell Bitcoin
BTC SELL 0.001 BTC

# Send Bitcoin
BTC SEND invoice_or_address 0.001

# Transaction History
HISTORY

# Help
HELP
```

---

## 🐛 Troubleshooting

### SMS Not Working?

**Check 1**: SMS Server Running?
```bash
# Should see: SMS Server running on port 3002
```

**Check 2**: ngrok Running?
```bash
# Should see: Forwarding https://... -> localhost:3002
```

**Check 3**: Webhooks Configured?
- Go to Africa's Talking dashboard
- Check callback URLs match your ngrok URL

**Check 4**: API Key Correct?
- Check `.env` file
- Make sure no extra spaces
- API key should start with `atsk_`

**Check 5**: Check Logs
```bash
# In SMS server terminal, you should see incoming requests
```

### USSD Not Working?

**Check 1**: Shortcode Active?
- Go to Africa's Talking → USSD → Shared Codes
- Make sure shortcode is active

**Check 2**: Callback URL Set?
- Should be: `https://your-ngrok-url.ngrok.io/webhooks/ussd/callback`

**Check 3**: Dial Format Correct?
- Should be: `*22948#` (with asterisk and hash)

### No Response?

**Check Server Logs**:
```bash
# In SMS server terminal, you should see:
📨 Incoming SMS: +256... -> BAL
✅ Response sent: Your balance is...
```

**Check ngrok Logs**:
```bash
# In ngrok terminal, you should see:
POST /webhooks/sms/incoming  200 OK
```

---

## 📊 Monitor Activity

### SMS Server Logs
Watch your SMS server terminal for:
```
📨 Incoming SMS from +256700123456
💬 Command: BAL
✅ Response: Your balance is 0 UGX
```

### ngrok Web Interface
Open in browser: **http://localhost:4040**
- See all webhook requests
- Inspect request/response data
- Debug issues

### Africa's Talking Dashboard
- Go to **Dashboard** → **SMS** → **Logs**
- See all sent/received messages
- Check delivery status

---

## 🎉 Success Checklist

- [ ] Africa's Talking account created
- [ ] API credentials configured in `.env`
- [ ] SMS server running (`npm run dev:sms`)
- [ ] ngrok running (`ngrok http 3002`)
- [ ] Webhooks configured in Africa's Talking
- [ ] SMS test successful (sent BAL, got response)
- [ ] USSD test successful (dialed *22948#, saw menu)
- [ ] Can navigate USSD menu
- [ ] Can send money via SMS
- [ ] Can check balance via USSD

---

## 🚀 Next Steps

Once everything works:

1. **Test All Commands**: Try all SMS commands
2. **Test USSD Flows**: Navigate all menu options
3. **Test with Multiple Phones**: Get friends to test
4. **Add Test Credits**: Buy credits on Africa's Talking
5. **Deploy to Production**: Move from sandbox to production

---

## 💰 Costs

### Sandbox (Testing)
- **Free credits**: Usually $0.50-$1.00
- **SMS**: ~$0.01 per message
- **USSD**: ~$0.005 per session
- **Good for**: ~50-100 test messages

### Production
- **Pay as you go**: Add credits as needed
- **Bulk discounts**: Available for high volume
- **Minimum**: Usually $10-$20 to start

---

## 📞 Support

### Issues?
1. Check troubleshooting section above
2. Check server logs
3. Check ngrok logs
4. Check Africa's Talking logs

### Still Stuck?
- **Africa's Talking Support**: support@africastalking.com
- **Documentation**: https://developers.africastalking.com/

---

## 🎯 Expected Timeline

- **Setup**: 15 minutes
- **First SMS test**: 5 minutes
- **First USSD test**: 5 minutes
- **Full testing**: 30 minutes
- **Total**: ~1 hour to fully working system

---

**Let's get this shit live! 🚀**
