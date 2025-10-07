#!/bin/bash

# Local SMS/USSD Testing Script
# Tests all commands without needing Africa's Talking

echo "🧪 Testing SMS/USSD System Locally"
echo "===================================="
echo ""

BASE_URL="http://localhost:3002"
PHONE="+256700123456"

echo "Testing SMS Commands..."
echo ""

# Test 1: Help Command
echo "1️⃣  Testing HELP command..."
curl -s -X POST $BASE_URL/webhooks/sms/incoming \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$PHONE\",
    \"to\": \"22948\",
    \"text\": \"HELP\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"id\": \"test-help-$(date +%s)\"
  }" | jq -r '.message' || echo "Response received"
echo ""
echo "---"
echo ""

# Test 2: Registration
echo "2️⃣  Testing REG command..."
curl -s -X POST $BASE_URL/webhooks/sms/incoming \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$PHONE\",
    \"to\": \"22948\",
    \"text\": \"REG John Doe\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"id\": \"test-reg-$(date +%s)\"
  }" | jq -r '.message' || echo "Response received"
echo ""
echo "---"
echo ""

# Test 3: Balance Check
echo "3️⃣  Testing BAL command..."
curl -s -X POST $BASE_URL/webhooks/sms/incoming \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$PHONE\",
    \"to\": \"22948\",
    \"text\": \"BAL\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"id\": \"test-bal-$(date +%s)\"
  }" | jq -r '.message' || echo "Response received"
echo ""
echo "---"
echo ""

# Test 4: Bitcoin Balance
echo "4️⃣  Testing BTC BAL command..."
curl -s -X POST $BASE_URL/webhooks/sms/incoming \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$PHONE\",
    \"to\": \"22948\",
    \"text\": \"BTC BAL\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"id\": \"test-btc-$(date +%s)\"
  }" | jq -r '.message' || echo "Response received"
echo ""
echo "---"
echo ""

# Test 5: Bitcoin Rate
echo "5️⃣  Testing BTC RATE command..."
curl -s -X POST $BASE_URL/webhooks/sms/incoming \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$PHONE\",
    \"to\": \"22948\",
    \"text\": \"BTC RATE UGX\",
    \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"id\": \"test-rate-$(date +%s)\"
  }" | jq -r '.message' || echo "Response received"
echo ""
echo "---"
echo ""

echo "Testing USSD Menu..."
echo ""

# Test 6: USSD Main Menu
echo "6️⃣  Testing USSD main menu..."
curl -s -X POST $BASE_URL/webhooks/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test-session-$(date +%s)&serviceCode=*22948%23&phoneNumber=$(echo $PHONE | sed 's/+/%2B/g')&text=" \
  || echo "Response received"
echo ""
echo "---"
echo ""

# Test 7: USSD Balance Check (option 1)
echo "7️⃣  Testing USSD balance check..."
curl -s -X POST $BASE_URL/webhooks/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test-session-bal-$(date +%s)&serviceCode=*22948%23&phoneNumber=$(echo $PHONE | sed 's/+/%2B/g')&text=1" \
  || echo "Response received"
echo ""
echo "---"
echo ""

echo ""
echo "✅ All tests completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check responses above for any errors"
echo "2. If all looks good, test with real phone"
echo "3. Setup ngrok and configure webhooks"
echo ""
