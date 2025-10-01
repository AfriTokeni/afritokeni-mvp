/**
 * SMS Backend Server
 * Express server to handle SMS and USSD webhooks from Africa's Talking
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createSMSWebhookHandler } from './smsWebhookHandler';
import { initializeSMSGateway } from './africasTalkingSMSGateway';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SMS_SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize SMS Gateway
initializeSMSGateway();

// Setup webhook handler
const webhookHandler = createSMSWebhookHandler();
app.use('/webhooks', webhookHandler.getRouter());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AfriTokeni SMS Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      sms: '/webhooks/sms/incoming',
      ussd: '/webhooks/ussd/callback',
      delivery: '/webhooks/sms/delivery',
      health: '/webhooks/health',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          AfriTokeni SMS Gateway Server                    ║
║                                                           ║
║  Status: Running                                          ║
║  Port: ${PORT}                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}   ║
║                                                           ║
║  Webhook Endpoints:                                       ║
║  - SMS: http://localhost:${PORT}/webhooks/sms/incoming    ║
║  - USSD: http://localhost:${PORT}/webhooks/ussd/callback  ║
║  - Delivery: http://localhost:${PORT}/webhooks/sms/delivery ║
║                                                           ║
║  Ready to receive SMS and USSD requests!                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
