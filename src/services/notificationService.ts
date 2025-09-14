import { Resend } from 'resend';

export interface NotificationData {
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bitcoin_exchange' | 'kyc_update' | 'agent_match';
  amount?: number;
  currency?: string;
  agentName?: string;
  status?: string;
  transactionId?: string;
  message?: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  authMethod?: 'sms' | 'web';
}

export class NotificationService {
  private static resend: Resend | null = null;

  private static initResend() {
    if (!this.resend) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        this.resend = new Resend(apiKey);
      }
    }
    return this.resend;
  }

  // Send notification based on user's preferred method
  static async sendNotification(user: User, notification: NotificationData) {
    try {
      // For web users with email, send email
      if (user.email && user.authMethod === 'web') {
        await this.sendEmailNotification(user, notification);
      }
      
      // For SMS users or users without email, send SMS
      if (user.phone && (!user.email || user.authMethod === 'sms')) {
        await this.sendSMSNotification(user, notification);
      }

      console.log(`Notification sent to user ${user.id} for ${notification.type}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Email notifications using Resend
  private static async sendEmailNotification(user: User, notification: NotificationData) {
    const resend = this.initResend();
    if (!resend) {
      console.warn('Resend not configured, skipping email notification');
      return;
    }

    const emailDomain = process.env.EMAIL_FROM_DOMAIN || "resend.dev";
    const { subject, html } = this.generateEmailContent(user, notification);

    await resend.emails.send({
      from: `AfriTokeni <noreply@${emailDomain}>`,
      to: [user.email!],
      subject,
      html
    });
  }

  // SMS notifications (simulated for now, ready for real SMS gateway)
  private static async sendSMSNotification(user: User, notification: NotificationData) {
    const message = this.generateSMSContent(user, notification);
    
    // TODO: Replace with real SMS gateway integration
    console.log(`📱 SMS to ${user.phone}: ${message}`);
    
    // For real implementation, integrate with SMS providers like:
    // - Twilio
    // - Africa's Talking
    // - Clickatell
    // - Local SMS gateways
  }

  // Generate email content based on notification type
  private static generateEmailContent(user: User, notification: NotificationData) {
    const name = user.firstName || 'User';
    
    switch (notification.type) {
      case 'deposit':
        return {
          subject: `✅ Deposit Confirmed - ${notification.amount} ${notification.currency}`,
          html: this.createEmailTemplate(
            `Deposit Successful!`,
            `Your deposit of <strong>${notification.amount} ${notification.currency}</strong> has been confirmed and added to your account.`,
            `Transaction ID: ${notification.transactionId}`,
            name
          )
        };

      case 'withdrawal':
        return {
          subject: `💸 Withdrawal Processed - ${notification.amount} ${notification.currency}`,
          html: this.createEmailTemplate(
            `Withdrawal Completed`,
            `Your withdrawal of <strong>${notification.amount} ${notification.currency}</strong> has been processed successfully.`,
            `Please collect your cash from the agent. Transaction ID: ${notification.transactionId}`,
            name
          )
        };

      case 'bitcoin_exchange':
        return {
          subject: `₿ Bitcoin Exchange - ${notification.amount} BTC`,
          html: this.createEmailTemplate(
            `Bitcoin Exchange Update`,
            `Your Bitcoin exchange of <strong>${notification.amount} BTC</strong> is ${notification.status}.`,
            notification.agentName ? `Agent: ${notification.agentName}` : `Transaction ID: ${notification.transactionId}`,
            name
          )
        };

      case 'kyc_update':
        return {
          subject: `🔐 KYC Status Update`,
          html: this.createEmailTemplate(
            `KYC Verification Update`,
            `Your KYC verification status has been updated to: <strong>${notification.status}</strong>`,
            notification.message || 'Please check your dashboard for more details.',
            name
          )
        };

      case 'agent_match':
        return {
          subject: `🤝 Agent Match Found`,
          html: this.createEmailTemplate(
            `Agent Match Found!`,
            `We found an agent for your transaction: <strong>${notification.agentName}</strong>`,
            `Amount: ${notification.amount} ${notification.currency}`,
            name
          )
        };

      default:
        return {
          subject: 'AfriTokeni Account Update',
          html: this.createEmailTemplate(
            'Account Update',
            notification.message || 'Your account has been updated.',
            '',
            name
          )
        };
    }
  }

  // Generate SMS content (concise for SMS limits)
  private static generateSMSContent(user: User, notification: NotificationData): string {
    const name = user.firstName || 'User';
    
    switch (notification.type) {
      case 'deposit':
        return `AfriTokeni: Hi ${name}, your deposit of ${notification.amount} ${notification.currency} is confirmed. Balance updated. ID: ${notification.transactionId}`;

      case 'withdrawal':
        return `AfriTokeni: Hi ${name}, withdrawal of ${notification.amount} ${notification.currency} processed. Collect from agent. ID: ${notification.transactionId}`;

      case 'bitcoin_exchange':
        return `AfriTokeni: Hi ${name}, Bitcoin exchange ${notification.amount} BTC ${notification.status}. ${notification.agentName ? `Agent: ${notification.agentName}` : `ID: ${notification.transactionId}`}`;

      case 'kyc_update':
        return `AfriTokeni: Hi ${name}, KYC status: ${notification.status}. ${notification.message || 'Check dashboard for details.'}`;

      case 'agent_match':
        return `AfriTokeni: Hi ${name}, agent found: ${notification.agentName}. Amount: ${notification.amount} ${notification.currency}. Contact soon.`;

      default:
        return `AfriTokeni: Hi ${name}, ${notification.message || 'account updated'}. Check your dashboard.`;
    }
  }

  // Email template wrapper
  private static createEmailTemplate(title: string, message: string, details: string, name: string): string {
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

  // Bulk notifications for multiple users
  static async sendBulkNotifications(users: User[], notification: NotificationData) {
    const promises = users.map(user => this.sendNotification(user, notification));
    await Promise.allSettled(promises);
  }

  // Send notification to specific user by ID (requires user lookup)
  static async sendNotificationToUser(userId: string, notification: NotificationData, getUserById: (id: string) => Promise<User | null>) {
    const user = await getUserById(userId);
    if (user) {
      await this.sendNotification(user, notification);
    }
  }
}
