// ========================================
// AfriTokeni SMS Webhook Server
// ========================================
// This server acts as a webhook bridge between:
// 1. Juno datastore (handled by frontend DataService)
// 2. AfricasTalking SMS API
// 
// Architecture:
// - Frontend handles all Juno datastore operations via DataService
// - This server only handles SMS sending and receiving webhooks
// - All transaction/balance data persists in Juno, not here
// ========================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const credentials = {
    username: process.env.AT_USERNAME || "",
    apiKey: process.env.AT_API_KEY || ""
};
const AfricasTalking = require('africastalking')(credentials);

// Initialize a service e.g. SMS
const sms = AfricasTalking.SMS



const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for verification codes (in production, use a database)
const verificationCodes = new Map();

// Cleanup expired codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationCodes.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) { // 10 minutes expiry
      verificationCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Mock AfricasTalking SMS sending (replace with real implementation)
const sendSMS = async (phoneNumber, message) => {
    console.log(`📱 Sending SMS to ${phoneNumber}: ${message}`);
    console.log(`Using AfricasTalking credentials: ${JSON.stringify(credentials)}`);

    // Use the service

    try {
        const response = await sms.send({
            to: phoneNumber,
            message, 
            from: process.env.AT_SHORT_CODE || "AfriTokeni"
        });
    // For demo purposes, always return success
    return {
        status: 'Success',
        message: 'Sent to 1/1 Total Cost: KES 0.8000'
    };
    } catch (error) {
        console.log(error);
    }

};

// Route to send SMS verification code
app.post('/api/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message, verificationCode, userId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }
    
    // Store verification code if provided
    if (verificationCode) {
      verificationCodes.set(phoneNumber, {
        code: verificationCode,
        userId: userId || 'anonymous',
        timestamp: Date.now()
      });
      
      console.log(`📝 Stored verification code for ${phoneNumber}: ${verificationCode}`);
    }
    
    // Send SMS
    const result = await sendSMS(phoneNumber, message);
    
    if (result.status === 'Success') {
      res.json({
        success: true,
        message: 'SMS sent successfully',
        messageId: `msg_${Date.now()}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS'
      });
    }
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Route to verify SMS code
app.post('/api/verify-code', (req, res) => {
    console.log('🔍 Verifying code...');
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and code are required'
      });
    }
    console.log(`🔍 Checking verification code for ${phoneNumber}: ${code}`);

    const storedData = verificationCodes.get(phoneNumber);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'No verification code found for this number'
      });
    }
    
    // Check if code has expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired'
      });
    }

    console.log(`🔍 Stored code for ${code}: ${storedData.code}`);
    
    if (storedData.code === code) {
        console.log(`🔍 Verification code matched for ${phoneNumber}`);
      // Code is correct, remove it from storage
      verificationCodes.delete(phoneNumber);
      
      res.json({
        success: true,
        message: 'Code verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }
    
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Route to handle incoming SMS (webhook from AfricasTalking)
app.post('/api/webhook/sms', (req, res) => {
  try {
    const { from, text, date, id } = req.body;
    
    console.log(`📨 Received SMS from ${from}: ${text}`);
    
    // Process SMS commands here
    // For now, just log and acknowledge
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Route to send SMS (called by frontend after Juno operations)
app.post('/api/sms/send', async (req, res) => {
  try {
    const { phoneNumber, message, transactionId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    // Send SMS via AfricasTalking
    await sendSMS(phoneNumber, message);

    console.log(`📱 SMS sent for transaction ${transactionId || 'N/A'} to ${phoneNumber}`);

    res.json({
      success: true,
      message: 'SMS sent successfully'
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS'
    });
  }
});

// Route to handle incoming SMS (webhook from AfricasTalking)
app.post('/api/webhook/sms', (req, res) => {
  try {
    const { from, text, date, id } = req.body;
    
    console.log(`📨 Received SMS from ${from}: ${text}`);
    
    // Process SMS commands here
    // For now, just log and acknowledge
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Route to process deposit
app.post('/api/deposit', async (req, res) => {
  try {
    const { customerPhone, amount, agentId } = req.body;
    
    if (!customerPhone || !amount || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Customer phone, amount, and agent ID are required'
      });
    }

    // Format phone number
    const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+254${customerPhone.replace(/^0/, '')}`;
    
    // Get or create user via Juno datastore
    const userResult = await JunoDataService.getUserByPhone(formattedPhone);
    
    if (!userResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get user information'
      });
    }

    const user = userResult.user;

    // Generate transaction ID
    const transactionId = `DEP${Date.now().toString().slice(-6)}`;
    
    // Create transaction record in Juno datastore
    const transactionData = {
      id: transactionId,
      userId: user.id,
      type: 'deposit',
      amount: parseFloat(amount),
      currency: 'UGX',
      agentId,
      status: 'completed',
      description: `Cash deposit via agent`,
      completedAt: new Date().toISOString(),
      metadata: {
        agentLocation: 'Kampala Central',
        smsReference: transactionId
      }
    };

    // Store transaction in Juno
    const transactionResult = await JunoDataService.createTransaction(transactionData);
    
    if (!transactionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create transaction'
      });
    }

    // Get current balance and update
    const balanceResult = await JunoDataService.getUserBalance(user.id);
    const currentBalance = balanceResult.success ? balanceResult.balance : 0;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Update user balance in Juno
    const balanceUpdateResult = await JunoDataService.updateUserBalance(user.id, newBalance);
    
    if (!balanceUpdateResult.success) {
      console.error('Failed to update balance, but transaction was recorded');
    }

    // Mock agent details
    const agentDetails = {
      name: 'Agent Smith',
      businessName: 'Smith Financial Services',
      phone: '+254712345678',
      location: 'Kampala Central'
    };

    // Send SMS notification to user
    const smsMessage = `AfriTokeni: You have received UGX ${parseFloat(amount).toLocaleString()} from ${agentDetails.businessName}. New balance: UGX ${newBalance.toLocaleString()}. Transaction ID: ${transactionId}. Thank you!`;
    
    try {
      await sendSMS(formattedPhone, smsMessage);
      
      // Log SMS in Juno datastore
      await JunoDataService.logSMSMessage({
        userId: user.id,
        phoneNumber: formattedPhone,
        message: smsMessage,
        direction: 'outbound',
        status: 'sent',
        transactionId
      });
    } catch (smsError) {
      console.error('SMS sending failed, but transaction completed:', smsError);
    }

    console.log(`💰 Deposit processed: ${transactionId} - UGX ${amount} for ${formattedPhone}`);

    res.json({
      success: true,
      transaction: {
        id: transactionId,
        amount: parseFloat(amount),
        currency: 'UGX',
        newBalance,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: formattedPhone
        },
        agent: agentDetails,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process deposit'
    });
  }
});

// Route to send SMS (called by frontend after Juno operations)
app.post('/api/sms/send', async (req, res) => {
  try {
    const { phoneNumber, message, transactionId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    // Send SMS via AfricasTalking
    await sendSMS(phoneNumber, message);

    console.log(`📱 SMS sent for transaction ${transactionId || 'N/A'} to ${phoneNumber}`);

    res.json({
      success: true,
      message: 'SMS sent successfully'
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS'
    });
  }
});

// Route to get user balance
app.get('/api/balance/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+254${phoneNumber.replace(/^0/, '')}`;
    
    // Get user from Juno datastore
    const userResult = await JunoDataService.getUserByPhone(formattedPhone);
    
    if (!userResult.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.user;

    // Get balance from Juno datastore
    const balanceResult = await JunoDataService.getUserBalance(user.id);

    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get balance'
      });
    }

    res.json({
      success: true,
      balance: {
        userId: user.id,
        balance: balanceResult.balance,
        currency: 'UGX',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeVerifications: verificationCodes.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AfriTokeni SMS Webhook Server',
    version: '1.0.0',
    description: 'SMS bridge between Juno frontend and AfricasTalking',
    endpoints: [
      'POST /api/send-sms',
      'POST /api/verify-code', 
      'POST /api/sms/send',
      'POST /api/webhook/sms',
      'GET /health'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AfriTokeni SMS Webhook Server running on port ${PORT}`);
  console.log(`📡 SMS Webhook endpoint: http://localhost:${PORT}/api/webhook/sms`);
  console.log(`� SMS Send endpoint: http://localhost:${PORT}/api/sms/send`);
  console.log(`�🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`💡 Note: All data operations handled by Juno frontend`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SMS API server...');
  process.exit(0);
});
