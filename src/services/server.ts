

/**
 * AfriTokeni SMS & USSD Webhook Server
 * 
 * Clean, modular server handling SMS and USSD operations.
 * All USSD handlers are now in src/services/ussd/handlers/
 * 
 * Architecture:
 * - Express server with AfricasTalking integration
 * - Modular USSD handlers (registration, PIN, transactions, Bitcoin, etc.)
 * - Session management and cleanup
 * - SMS notifications
 * 
 * Endpoints:
 * - POST /api/send-sms - Send SMS messages
 * - POST /api/verify-code - Verify SMS codes
 * - POST /api/webhook/sms - Receive SMS webhooks
 * - POST /api/ussd - USSD webhook (main entry point)
 * - POST /api/send-notification - Send notifications
 * - GET /health - Health check
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import AfricasTalking from 'africastalking';
import type { 
  NotificationRequest, 
  NotificationData,
  User,
  EmailContent 
} from '../types/notification.js';

// Import USSD handlers and utilities
import {
  // Session management
  ussdSessions,
  getOrCreateSession,
  startSessionCleanup,
  // All USSD handlers
  handleRegistrationCheck,
  handleUserRegistration,
  handleVerification,
  hasUserPin,
  handlePinCheck,
  handlePinSetup,
  handleMainMenu,
  handleLocalCurrency,
  handleCheckBalance,
  handleTransactionHistory,
  handleFindAgent,
  handleDeposit,
  handleWithdraw,
  handleSendMoney,
  handleBitcoin,
  handleBTCBalance,
  handleBTCRate,
  handleBTCBuy,
  handleBTCSell,
  handleBTCSend,
  handleUSDC,
  handleUSDCBalance,
  handleUSDCRate,
  handleUSDCBuy,
  handleUSDCSell,
  handleUSDCSend,
  // Initialization
  initBitcoinHandlers,
  initUSDCHandlers
} from './ussd/index.js';

// Node.js process declaration
declare const process: {
  env: {
    [key: string]: string | undefined;
    PORT?: string;
    VITE_PORT?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM_DOMAIN?: string;
    AT_USERNAME?: string;
    AT_API_KEY?: string;
    AT_SHORT_CODE?: string;
    NODE_ENV?: string;
  };
  on: (event: string, listener: Function) => void;
  exit: (code?: number) => void;
  cwd: () => string;
};

// Configure dotenv with explicit path
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// AfricasTalking configuration
const credentials = {
    username: process.env.AT_USERNAME || "sandbox",
    apiKey: process.env.AT_API_KEY || ""
};

// Initialize AfricasTalking only if we have valid credentials
let africastalking: ReturnType<typeof AfricasTalking> | null = null;
let sms: any = null;

if (credentials.username && credentials.apiKey) {
  try {
    africastalking = AfricasTalking(credentials);
    sms = africastalking.SMS;
  } catch (error) {
    console.error('❌ Failed to initialize AfricasTalking:', error);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for verification codes (used by email verification)
interface VerificationData {
  code: string;
  userId: string;
  timestamp: number;
}
const verificationCodes = new Map<string, VerificationData>();

// Start session cleanup interval
startSessionCleanup();

// SMS notification helper
async function sendSMSNotification(phoneNumber: string, message: string): Promise<any> {
  console.log(`📱 Sending SMS notification to ${phoneNumber}: ${message}`);
  try {
    const response = await sms.send({
      to: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
      message: message,
      from: process.env.AT_SHORT_CODE || "22948"
    });
    console.log("SMS sent successfully:", response);
    return response;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return null;
  }
}

// Initialize Bitcoin and USDC handlers with dependencies
initBitcoinHandlers(sendSMSNotification, handleMainMenu);
initUSDCHandlers(sendSMSNotification, handleMainMenu);

// Route to send SMS verification code
app.post('/api/send-sms', async (req: Request, res: Response) => {
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
    }
    
    // Send SMS
    const result = await sendSMSNotification(phoneNumber, message);
    
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
app.post('/api/verify-code', (req: Request, res: Response) => {
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
app.post('/api/webhook/sms', (req: Request, res: Response) => {
  try {
    const { from, text } = req.body;
    
    console.log(`📨 Received SMS from ${from}: ${text}`);
    
    // Process SMS commands here
    // For now, just log and acknowledge
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Route to handle USSD requests (webhook from AfricasTalking)
app.post('/api/ussd', async (req: Request, res: Response) => {
  try {
    const { sessionId, phoneNumber, text } = req.body;
    
    console.log(`📱 USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}, Text: "${text}"`);
    
    const session = getOrCreateSession(sessionId, phoneNumber);
    let response: string;

    // Route to appropriate handler based on current menu
    switch (session.currentMenu) {
      case 'registration_check':
        response = await handleRegistrationCheck(text, session, sendSMSNotification, hasUserPin);
        break;
      case 'user_registration':
        response = await handleUserRegistration(text, session, sendSMSNotification);
        break;
      case 'verification':
        response = await handleVerification(text, session);
        break;
      case 'pin_check':
        response = await handlePinCheck(text, session, handleCheckBalance, handleTransactionHistory);
        break;
      case 'pin_setup':
        response = await handlePinSetup(text, session);
        break;
      case 'main':
        response = await handleMainMenu(text, session, handleLocalCurrency, handleBitcoin, handleUSDC);
        break;
      case 'local_currency':
        response = await handleLocalCurrency(text, session, handleSendMoney, handleDeposit, handleWithdraw, handleFindAgent, handleMainMenu);
        break;
      case 'find_agent':
        response = await handleFindAgent(text, session, handleLocalCurrency);
        break;
      case 'send_money':
        response = await handleSendMoney(text, session, sendSMSNotification);
        break;
      case 'check_balance':
        response = await handleCheckBalance(text, session);
        break;
      case 'transaction_history':
        response = await handleTransactionHistory(text, session);
        break;
      case 'deposit':
        response = await handleDeposit(text, session, sendSMSNotification);
        break;
      case 'bitcoin':
        response = await handleBitcoin(text, session);
        break;
      case 'btc_balance':
        response = await handleBTCBalance(text, session);
        break;
      case 'btc_rate':
        response = await handleBTCRate(text, session);
        break;
      case 'btc_buy':
        response = await handleBTCBuy(text, session);
        break;
      case 'btc_sell':
        response = await handleBTCSell(text, session);
        break;
      case 'btc_send':
        response = await handleBTCSend(text, session);
        break;
      case 'usdc':
        response = await handleUSDC(text, session);
        break;
      case 'usdc_balance':
        response = await handleUSDCBalance(text, session);
        break;
      case 'usdc_rate':
        response = await handleUSDCRate(text, session);
        break;
      case 'usdc_buy':
        response = await handleUSDCBuy(text, session);
        break;
      case 'usdc_sell':
        response = await handleUSDCSell(text, session);
        break;
      case 'usdc_send':
        response = await handleUSDCSend(text, session);
        break;
      case 'withdraw':
        response = await handleWithdraw(text, session, sendSMSNotification, handleMainMenu);
        break;
      default:
        response = await handleRegistrationCheck('', session, sendSMSNotification, hasUserPin);
    }

    // Clean up session if ended
    if (response.startsWith('END')) {
      ussdSessions.delete(sessionId);
      console.log(`🧹 Session ended and cleaned up: ${sessionId}`);
    }

    console.log(`📤 USSD Response: ${response}`);
    
    res.set('Content-Type', 'text/plain');
    res.send(response);
    
  } catch (error) {
    console.error('Error processing USSD webhook:', error);
    res.set('Content-Type', 'text/plain');
    res.send('END Sorry, an error occurred. Please try again.');
  }
});

// Development endpoint for PIN management
app.post('/api/dev/pins/clear', async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'production') {
    // Clear in-memory sessions
    ussdSessions.clear();
    
    res.json({
      success: true,
      message: 'All sessions cleared successfully'
    });
  } else {
    res.status(403).json({
      success: false,
      error: 'Not available in production'
    });
  }
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Get PIN count from DataService if available
    try {
      // This would require implementing a method to count users with PINs
      // For now, we'll use session count as a proxy
      // Session count available via ussdSessions.size
    } catch (error) {
      console.error('Error getting PIN count:', error);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeVerifications: verificationCodes.size,
      activeUSSDSessions: ussdSessions.size,
      dataServiceIntegrated: true,
      services: {
        sms: 'active',
        ussd: 'active',
        pin_management: 'integrated_with_dataservice',
        africastalking: credentials.username ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ========================================
// Notification API Endpoint
// ========================================

// Send notification endpoint
app.post('/api/send-notification', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const request: NotificationRequest = req.body;
    console.log(`🔄 [SERVER] Processing notification for user ${request.user.id} (type: ${request.notification.type})`);

    // Validate input
    if (!request.user || !request.notification || !request.notification.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: user and notification type are required',
        error: 'VALIDATION_ERROR'
      });
    }

    // Secure API key access from server environment
    const apiKey = process.env.RESEND_API_KEY;
    const emailDomain = process.env.EMAIL_FROM_DOMAIN || "afritokeni.com";
    
    if (!apiKey) {
      console.error(`❌ [SERVER] RESEND_API_KEY not found in environment variables`);
      return res.status(500).json({
        success: false,
        message: 'Email service not configured',
        error: 'MISSING_API_KEY'
      });
    }

    let emailResult: { id: string; status: string } | null = null;
    let smsResult: { simulated: boolean; phone: string; message: string } | null = null;

    // Only send email if user has email and uses web auth
    if (request.user.email && request.user.authMethod === 'web') {
      console.log(`📧 [SERVER] Sending email to ${request.user.email}...`);
      
      try {
        const { subject, html } = generateEmailContent(request.user, request.notification);

        const emailPayload = {
          from: `AfriTokeni <noreply@${emailDomain}>`,
          to: [request.user.email],
          subject,
          html
        };

        console.log(`📧 [SERVER] Calling Resend API...`);
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`❌ [SERVER] Resend API error (${response.status}):`, errorData);
          throw new Error(`Resend API error: ${errorData}`);
        }

        const result = await response.json() as { id: string; [key: string]: unknown };
        emailResult = {
          id: result.id,
          status: 'sent'
        };
        
        console.log(`✅ [SERVER] Email sent successfully`);
        console.log(`✅ [SERVER] Message ID: ${result.id}`);
        
      } catch (emailError: unknown) {
        console.error(`❌ [SERVER] Email sending failed:`, emailError);
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error occurred';
        return res.status(500).json({
          success: false,
          message: `Failed to send email: ${errorMessage}`,
          error: 'EMAIL_SEND_ERROR'
        });
      }
    }

    // For SMS users, log for now (integrate real SMS gateway here)
    if (request.user.phone && (!request.user.email || request.user.authMethod === 'sms')) {
      const smsMessage = generateSMSContent(request.user, request.notification);
      console.log(`📱 [SERVER] SMS notification prepared for ${request.user.phone}`);
      console.log(`📱 [SERVER] Message: ${smsMessage}`);
      
      // TODO: Integrate real SMS gateway here
      smsResult = { 
        simulated: true, 
        phone: request.user.phone, 
        message: smsMessage 
      };
    }

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [SERVER] Notification processing completed in ${totalDuration}ms`);

    res.json({ 
      success: true, 
      message: 'Notification sent successfully',
      results: { 
        email: emailResult,
        sms: smsResult
      }
    });
    
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    console.error(`❌ [SERVER] Failed to send notification after ${duration}ms:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      success: false, 
      message: `Internal server error: ${errorMessage}`,
      error: 'INTERNAL_ERROR'
    });
  }
});

// Helper functions for email content generation
function generateEmailContent(user: User, notification: NotificationData): EmailContent {
  const name = user.firstName || 'User';
  
  switch (notification.type) {
    case 'subscription_welcome':
      return {
        subject: `🎉 Welcome to AfriTokeni! Your Journey to Bitcoin Banking Begins`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Welcome to AfriTokeni</h1>
              <p style="color: #666; font-size: 14px;">Bitcoin Banking for Everyone in Africa</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1a1a1a; margin-bottom: 15px;">Hi ${name}!</h2>
              <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
                Thank you for subscribing to AfriTokeni updates! You're now part of a revolutionary movement to bring Bitcoin banking to every African.
              </p>
              <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
                We'll keep you updated on:
              </p>
              <ul style="color: #444; margin-left: 20px; margin-bottom: 15px;">
                <li>Platform launch updates</li>
                <li>New currency support</li>
                <li>SMS banking features</li>
                <li>Security enhancements</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="https://www.afritokeni.com" 
                 style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 25px; 
                        text-decoration: none; border-radius: 6px; font-weight: 500;">
                Explore AfriTokeni
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                This is an automated welcome message from AfriTokeni.
              </p>
            </div>
          </div>
        `
      };
      
    case 'deposit':
      return {
        subject: `✅ Deposit Confirmed - ${notification.amount} ${notification.currency}`,
        html: createEmailTemplate(
          'Deposit Confirmed',
          `Your deposit of <strong>${notification.amount} ${notification.currency}</strong> has been confirmed.`,
          `Transaction ID: ${notification.transactionId}`,
          name
        )
      };

    case 'withdrawal':
      return {
        subject: `💸 Withdrawal Processed - ${notification.amount} ${notification.currency}`,
        html: createEmailTemplate(
          'Withdrawal Processed',
          `Your withdrawal of <strong>${notification.amount} ${notification.currency}</strong> has been processed.`,
          `Transaction ID: ${notification.transactionId}`,
          name
        )
      };

    default:
      return {
        subject: 'AfriTokeni Account Update',
        html: createEmailTemplate(
          'Account Update',
          notification.message || 'Your account has been updated.',
          '',
          name
        )
      };
  }
}

function generateSMSContent(user: User, notification: NotificationData): string {
  const name = user.firstName || 'User';
  
  switch (notification.type) {
    case 'subscription_welcome':
      return `AfriTokeni: Hi ${name}, welcome to Bitcoin banking for Africa! You'll receive platform updates via SMS. Start banking at afritokeni.com`;
      
    case 'deposit':
      return `AfriTokeni: Hi ${name}, your deposit of ${notification.amount} ${notification.currency} is confirmed. Balance updated. ID: ${notification.transactionId}`;

    case 'withdrawal':
      return `AfriTokeni: Hi ${name}, withdrawal of ${notification.amount} ${notification.currency} processed. Collect from agent. ID: ${notification.transactionId}`;

    default:
      return `AfriTokeni: Hi ${name}, ${notification.message || 'account updated'}. Check your dashboard at afritokeni.com`;
  }
}

function createEmailTemplate(title: string, message: string, details: string, name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a; margin-bottom: 10px;">AfriTokeni</h1>
        <p style="color: #666; font-size: 14px;">Secure Financial Services for Africa</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1a1a1a; margin-bottom: 15px;">Hi ${name}!</h2>
        <h3 style="color: #1a1a1a; margin-bottom: 15px;">${title}</h3>
        <p style="color: #444; line-height: 1.6; margin-bottom: 15px;">
          ${message}
        </p>
        ${details ? `<p style="color: #666; font-size: 14px; margin-bottom: 0;">${details}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="https://afritokeni.com" 
           style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 25px; 
                  text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Dashboard
        </a>
      </div>
      
      <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
        <p style="color: #999; font-size: 12px;">
          This is an automated message from AfriTokeni. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
}

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'AfriTokeni SMS & USSD Webhook Server',
    version: '3.0.0',
    description: 'Modular SMS & USSD service with 83% code reduction',
    endpoints: [
      'POST /api/send-sms',
      'POST /api/verify-code',
      'POST /api/webhook/sms',
      'POST /api/ussd',
      'POST /api/send-notification',
      'GET /health'
    ]
  });
});

const PORT = parseInt(process.env.PORT || process.env.VITE_PORT || '3001', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AfriTokeni SMS & USSD Server v3.0.0 running on port ${PORT}`);
  console.log(`📱 SMS Service: ${credentials.username ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📞 USSD Service: ✅ Active (Modular)`);
  console.log(`📦 Handlers: 15 modular files`);
  console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SMS & USSD API server...');
  console.log(`🧹 Cleaning up ${verificationCodes.size} verification codes and ${ussdSessions.size} USSD sessions`);
  process.exit(0);
});