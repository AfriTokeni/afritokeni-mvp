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
  // Send notification - uses direct API calls for production
  static async sendNotification(user: User, notification: NotificationData) {
    try {
      // For web users with email, send email via direct API call
      if (user.email && user.authMethod === 'web') {
        await this.sendEmailNotification(user, notification);
      }
      
      // For SMS users, simulate for now (can integrate real SMS gateway)
      if (user.phone && (!user.email || user.authMethod === 'sms')) {
        this.sendSMSNotification(user, notification);
      }

      console.log(`Notification sent to user ${user.id} for ${notification.type}`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Send email notification using Resend API
  private static async sendEmailNotification(user: User, notification: NotificationData) {
    const startTime = Date.now();
    console.log(`🔄 [EMAIL] Starting notification send to ${user.email} (type: ${notification.type})`);
    
    try {
      // Use environment variables for API key
      const apiKey = import.meta.env.VITE_RESEND_API_KEY;
      const emailDomain = import.meta.env.VITE_EMAIL_FROM_DOMAIN || "afritokeni.com";
      
      if (!apiKey) {
        console.error(`❌ [EMAIL] No API key found in environment variables`);
        console.log(`📧 [EMAIL] Fallback: Simulating email for ${user.email}: ${notification.type}`);
        return;
      }

      const { subject, html } = this.generateEmailContent(user, notification);
      
      console.log(`📧 [EMAIL] Sending real email with Resend API`);
      console.log(`📧 [EMAIL] Subject: "${subject}"`);
      console.log(`📧 [EMAIL] To: ${user.email}`);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `AfriTokeni <noreply@${emailDomain}>`,
          to: [user.email],
          subject,
          html
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ [EMAIL] Resend API error (${response.status}):`, errorData);
        console.error(`❌ [EMAIL] Duration: ${duration}ms`);
        throw new Error(`Resend API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ [EMAIL] Successfully sent to ${user.email} in ${duration}ms`);
      console.log(`✅ [EMAIL] Message ID: ${result.id}`);
      console.log(`✅ [EMAIL] Type: ${notification.type}`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [EMAIL] Failed to send notification after ${duration}ms`);
      console.error(`❌ [EMAIL] User: ${user.email}, Type: ${notification.type}`);
      console.error(`❌ [EMAIL] Error details:`, error);
      
      // Fallback simulation
      console.log(`📧 [EMAIL] Fallback simulation for ${user.email}: ${notification.type}`);
    }
  }

  // Generate email content based on notification type
  private static generateEmailContent(user: User, notification: NotificationData) {
    const name = user.firstName || 'User';
    
    switch (notification.type) {
      case 'deposit':
        return {
          subject: `✅ Deposit Confirmed - ${notification.amount} ${notification.currency}`,
          html: `<h2>Hi ${name}!</h2><p>Your deposit of <strong>${notification.amount} ${notification.currency}</strong> has been confirmed.</p><p>Transaction ID: ${notification.transactionId}</p>`
        };

      case 'withdrawal':
        return {
          subject: `💸 Withdrawal Processed - ${notification.amount} ${notification.currency}`,
          html: `<h2>Hi ${name}!</h2><p>Your withdrawal of <strong>${notification.amount} ${notification.currency}</strong> has been processed.</p><p>Transaction ID: ${notification.transactionId}</p>`
        };

      case 'bitcoin_exchange':
        return {
          subject: `₿ Bitcoin Exchange - ${notification.amount} BTC`,
          html: `<h2>Hi ${name}!</h2><p>Your Bitcoin exchange of <strong>${notification.amount} BTC</strong> is ${notification.status}.</p>`
        };

      case 'kyc_update':
        return {
          subject: `🔐 KYC Status Update`,
          html: `<h2>Hi ${name}!</h2><p>Your KYC verification status: <strong>${notification.status}</strong></p><p>${notification.message || ''}</p>`
        };

      case 'agent_match':
        return {
          subject: `🤝 Agent Match Found`,
          html: `<h2>Hi ${name}!</h2><p>Agent found: <strong>${notification.agentName}</strong></p><p>Amount: ${notification.amount} ${notification.currency}</p>`
        };

      default:
        return {
          subject: 'AfriTokeni Account Update',
          html: `<h2>Hi ${name}!</h2><p>${notification.message || 'Your account has been updated.'}</p>`
        };
    }
  }

  // SMS notifications (simulated for now)
  private static sendSMSNotification(user: User, notification: NotificationData) {
    const message = this.generateSMSContent(user, notification);
    console.log(`📱 [SMS] Sending to ${user.phone}: ${message}`);
    
    // TODO: Integrate with real SMS gateway
    // For production, integrate with providers like Twilio, Africa's Talking, etc.
  }

  // Generate SMS content based on notification type
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
