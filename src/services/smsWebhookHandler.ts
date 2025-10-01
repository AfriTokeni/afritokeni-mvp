/**
 * SMS Webhook Handler
 * Handles incoming webhooks from Africa's Talking for SMS and USSD
 */

import express, { Request, Response } from 'express';
import { SMSCommandProcessor } from './smsCommandProcessor';
import { USSDService } from './ussdService';
import { getSMSGateway } from './africasTalkingSMSGateway';

export class SMSWebhookHandler {
  private router: express.Router;
  private commandProcessor: SMSCommandProcessor;
  private ussdService: USSDService;
  private smsGateway: ReturnType<typeof getSMSGateway>;

  constructor() {
    this.router = express.Router();
    this.commandProcessor = new SMSCommandProcessor();
    this.ussdService = new USSDService();
    this.smsGateway = getSMSGateway();
    this.setupRoutes();
  }

  /**
   * Setup webhook routes
   */
  private setupRoutes(): void {
    // SMS webhook endpoint
    this.router.post('/sms/incoming', this.handleIncomingSMS.bind(this));

    // USSD webhook endpoint
    this.router.post('/ussd/callback', this.handleUSSDCallback.bind(this));

    // Delivery report endpoint
    this.router.post('/sms/delivery', this.handleDeliveryReport.bind(this));

    // Health check
    this.router.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'AfriTokeni SMS Gateway' });
    });
  }

  /**
   * Handle incoming SMS messages
   */
  private async handleIncomingSMS(req: Request, res: Response): Promise<void> {
    try {
      const { from, to, text, date, id, linkId } = req.body;

      console.log('Incoming SMS:', { from, text, date, id });

      // Process the SMS command
      const result = await this.commandProcessor.processCommand({
        phoneNumber: from,
        message: text,
        timestamp: new Date(date),
        sessionId: id,
      });

      // Send reply SMS
      if (result.reply) {
        await this.smsGateway.sendSMS({
          to: from,
          message: result.reply,
        });
      }

      // Respond to Africa's Talking
      res.status(200).json({
        success: true,
        messageId: id,
      });
    } catch (error) {
      console.error('SMS webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * Handle USSD callback
   */
  private async handleUSSDCallback(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, serviceCode, phoneNumber, text } = req.body;

      console.log('USSD Request:', { sessionId, serviceCode, phoneNumber, text });

      // Process USSD request
      const result = await this.ussdService.processRequest({
        sessionId,
        serviceCode,
        phoneNumber,
        text,
      });

      // Respond with USSD response
      // Africa's Talking expects plain text response
      // CON = Continue session, END = End session
      res.set('Content-Type', 'text/plain');
      res.send(result.response);
    } catch (error) {
      console.error('USSD webhook error:', error);
      res.set('Content-Type', 'text/plain');
      res.send('END An error occurred. Please try again.');
    }
  }

  /**
   * Handle SMS delivery reports
   */
  private async handleDeliveryReport(req: Request, res: Response): Promise<void> {
    try {
      const { id, status, phoneNumber, networkCode, retryCount } = req.body;

      console.log('Delivery Report:', {
        id,
        status,
        phoneNumber,
        networkCode,
        retryCount,
      });

      // Log delivery status
      // In production, you might want to update database records
      if (status === 'Success') {
        console.log(`SMS ${id} delivered successfully to ${phoneNumber}`);
      } else {
        console.error(`SMS ${id} delivery failed: ${status}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delivery report error:', error);
      res.status(500).json({ success: false });
    }
  }

  /**
   * Get Express router
   */
  getRouter(): express.Router {
    return this.router;
  }
}

/**
 * Create and export webhook handler instance
 */
export function createSMSWebhookHandler(): SMSWebhookHandler {
  return new SMSWebhookHandler();
}
