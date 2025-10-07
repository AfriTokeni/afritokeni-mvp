#!/bin/bash

# AfriTokeni SMS/USSD Server Startup Script
# This script starts the SMS server and provides setup instructions

echo "🚀 AfriTokeni SMS/USSD Server"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with Africa's Talking credentials"
    exit 1
fi

# Check if API key is set
if grep -q "REPLACE_WITH_YOUR_API_KEY" .env; then
    echo "⚠️  WARNING: You need to update .env with your Africa's Talking credentials!"
    echo ""
    echo "1. Open .env file"
    echo "2. Replace AT_API_KEY=REPLACE_WITH_YOUR_API_KEY with your actual API key"
    echo "3. Update AT_USERNAME if needed (default: sandbox)"
    echo ""
    echo "Get credentials from: https://africastalking.com/"
    echo ""
    read -p "Have you updated the credentials? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please update .env and run this script again"
        exit 1
    fi
fi

echo "✅ Starting SMS Server..."
echo ""
echo "📱 Server will run on port 3002"
echo "🔗 Webhook endpoints:"
echo "   POST /webhooks/sms/incoming"
echo "   POST /webhooks/ussd/callback"
echo "   POST /webhooks/sms/delivery"
echo ""
echo "📋 Next steps:"
echo "1. Keep this terminal running"
echo "2. Open a NEW terminal and run: ngrok http 3002"
echo "3. Copy the ngrok HTTPS URL"
echo "4. Configure webhooks in Africa's Talking dashboard"
echo "5. Test with your phone!"
echo ""
echo "================================"
echo ""

# Start the SMS server
npm run dev:sms
