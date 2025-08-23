import { nanoid } from 'nanoid';

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface VerificationCodeResponse extends SMSResponse {
  verificationCode?: string;
}

export class SMSService {
  private static readonly API_BASE_URL = 'http://localhost:3001/api';
  
  /**
   * Format phone number to E.164 format (international standard)
   * Assumes Kenyan numbers if no country code provided
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If starts with 254 (Kenya country code), it's already formatted
    if (cleaned.startsWith('256')) {
      return `+${cleaned}`;
    }
    
    // If starts with 0, replace with Kenya country code
    if (cleaned.startsWith('0')) {
      return `+256${cleaned.substring(1)}`;
    }
    
    // If 9 digits, assume it's a Kenyan number without leading 0
    if (cleaned.length === 9) {
      return `+256${cleaned}`;
    }
    
    // If already has + at start, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default to adding Kenya country code
    return `+256${cleaned}`;
  }
  
  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    // Check if it's a valid international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
  
  /**
   * Generate a 6-digit verification code
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Send SMS verification code to user
   */
  static async sendVerificationCode(phoneNumber: string, userName: string): Promise<VerificationCodeResponse> {
    try {
      const verificationCode = this.generateVerificationCode();
      const message = `Welcome to AfriTokeni, ${userName}! Your verification code is: ${verificationCode}. Reply with this code to complete registration.`;
      
      const response = await fetch(`${this.API_BASE_URL}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          verificationCode,
          userId: nanoid() // Generate unique ID for this verification session
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: 'Verification code sent successfully',
          verificationCode // In production, don't return this
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send SMS'
        };
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Verify SMS code submitted by user
   */
  static async verifyCode(phoneNumber: string, code: string): Promise<SMSResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          code
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        error: result.error
      };
    } catch (error) {
      console.error('Code verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Send SMS notification to user
   */
  static async sendNotification(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          message,
          isNotification: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        error: result.error
      };
    } catch (error) {
      console.error('SMS notification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
