/**
 * Send Money Handler
 * Handles peer-to-peer money transfer
 */

import type { USSDSession } from '../types.js';
import { continueSession, endSession } from '../utils/responses.js';
import { getSessionCurrency } from '../utils/currency.js';
import { WebhookDataService as DataService } from '../../webHookServices.js';
import { verifyUserPin } from './pinManagement.js';

/**
 * Handle send money flow
 */
export async function handleSendMoney(input: string, session: USSDSession, sendSMS: (phone: string, msg: string) => Promise<any>): Promise<string> {
  // Parse input for multi-step USSD
  const inputParts = input.split('*');
  const currentInput = inputParts[inputParts.length - 1] || '';
  
  switch (session.step) {
    case 0: {
      // Step 0: Enter recipient phone number
      if (!currentInput) {
        return continueSession('Send Money\nEnter recipient phone number:');
      }
      
      // Validate phone number format (accepts +256XXXXXXXXX, 256XXXXXXXXX, 07XXXXXXXX, 03XXXXXXXX)
      const phoneRegex = /^(\+?256[37]\d{8}|0[37]\d{8})$/;
      if (!phoneRegex.test(currentInput)) {
        return continueSession('Invalid phone number format.\nEnter recipient phone (256XXXXXXXXX):');
      }
      
      // Store recipient and move to amount entry
      session.data.recipientPhone = currentInput;
      session.step = 1;
      const currency = getSessionCurrency(session);
      return continueSession(`Enter amount to send (${currency}):`);
    }
    
    case 1: {
      // Step 1: Enter amount and validate user has enough balance
      const amount = parseFloat(currentInput);
      if (isNaN(amount) || amount <= 0) {
        const currency = getSessionCurrency(session);
        return continueSession(`Invalid amount.\nEnter amount to send (${currency}):`);
      }

      // Calculate fee (1% of amount)
      const fee = Math.round(amount * 0.01);
      const totalRequired = amount + fee;

      // Check user balance
      const userBalance = await DataService.getUserBalance(`+${session.phoneNumber}`);
      if (!userBalance || userBalance.balance < totalRequired) {
        const currentBalance = userBalance ? userBalance.balance : 0;
        return endSession(`Insufficient balance!
Your balance: ${getSessionCurrency(session)} ${currentBalance.toLocaleString()}
Required: ${getSessionCurrency(session)} ${totalRequired.toLocaleString()} (Amount: ${amount.toLocaleString()} + Fee: ${fee.toLocaleString()})

Thank you for using AfriTokeni!`);
      }

      // Store amount and fee for next step
      session.data.amount = amount;
      session.data.fee = fee;
      session.step = 2;
      return continueSession(`Amount: ${getSessionCurrency(session)} ${amount.toLocaleString()}
Fee: ${getSessionCurrency(session)} ${fee.toLocaleString()}
Total: ${getSessionCurrency(session)} ${totalRequired.toLocaleString()}

Enter recipient phone number (256XXXXXXXXX):`);
    }
    
    case 2: {
      // Step 2: Enter recipient phone number and verify they exist
      if (!currentInput.match(/^256\d{9}$/)) {
        return continueSession('Invalid phone number format.\nEnter recipient phone (256XXXXXXXXX):');
      }

      console.log(`Searching for user by phone number: ${currentInput}`);

      // Use the findUserByPhoneNumber method to find recipient
      let recipient = await DataService.findUserByPhoneNumber(currentInput);
      
      if (!recipient) {
        // Try with + prefix
        recipient = await DataService.findUserByPhoneNumber(`+${currentInput}`);
      }
      
      if (!recipient) {
        return continueSession(`Phone number ${currentInput} is not registered with AfriTokeni.
        
Please enter a valid recipient phone number (256XXXXXXXXX):`);
      }

      // Don't allow sending money to yourself
      if (currentInput === session.phoneNumber) {
        return continueSession(`You cannot send money to yourself.

Please enter a different recipient phone number (256XXXXXXXXX):`);
      }

      session.data.recipientPhone = currentInput;
      session.data.recipientId = recipient.id;
      session.data.recipientName = `${recipient.firstName} ${recipient.lastName}`;
      session.step = 3;
      
      const amount = session.data.amount || 0;
      const fee = session.data.fee || 0;
      
      return continueSession(`Recipient: ${recipient.firstName} ${recipient.lastName}
Phone: ${currentInput}
Amount: ${getSessionCurrency(session)} ${amount.toLocaleString()}
Fee: ${getSessionCurrency(session)} ${fee.toLocaleString()}
Total: ${getSessionCurrency(session)} ${(amount + fee).toLocaleString()}

Enter your PIN to confirm:`);
    }
    
    case 3: {
      // Step 3: Verify PIN and process transaction
      const isValidPin = await verifyUserPin(session.phoneNumber, currentInput);
      if (!isValidPin) {
        // Increment pin attempts
        session.data.pinAttempts = (session.data.pinAttempts || 0) + 1;
        
        if (session.data.pinAttempts >= 3) {
          return endSession(`Too many incorrect PIN attempts.
Transaction cancelled for security.

Thank you for using AfriTokeni!`);
        }
        
        return continueSession(`Incorrect PIN. ${3 - session.data.pinAttempts} attempts remaining.
Enter your PIN:`);
      }

      // PIN is correct, process the transaction
      console.log(`💳 Processing money transfer: ${session.phoneNumber} -> ${session.data.recipientPhone}, Amount: ${session.data.amount}, Fee: ${session.data.fee}`);
      
      try {
        const senderPhone = `+${session.phoneNumber}`;
        const recipientPhone = session.data.recipientPhone || '';
        const amount = session.data.amount || 0;
        const fee = session.data.fee || 0;
        
        // Use the existing DataService.processSendMoney method
        const transferResult = await DataService.processSendMoney(
          senderPhone,
          recipientPhone,
          amount,
          fee
        );

        console.log(`Transfer result:`, transferResult);

        if (!transferResult.success) {
          return endSession(`❌ Transaction Failed!
${transferResult.error}

Thank you for using AfriTokeni!`);
        }

        const transactionId = transferResult.transactionId;
        const recipientName = session.data.recipientName || 'Unknown';
        
        // Send SMS to sender
        await sendSMS(
          session.phoneNumber,
          `Money sent successfully!
Amount: ${getSessionCurrency(session)} ${amount.toLocaleString()}
To: ${recipientName} (${recipientPhone})
Fee: ${getSessionCurrency(session)} ${fee.toLocaleString()}
Reference: ${transactionId}
Thank you for using AfriTokeni!`
        );
        
        // Send SMS to recipient  
        await sendSMS(
          recipientPhone,
          `You received money!
Amount: ${getSessionCurrency(session)} ${amount.toLocaleString()}
From: ${senderPhone}
Reference: ${transactionId}
Thank you for using AfriTokeni!`
        );

        return endSession(`✅ Transaction Successful!

Sent: ${getSessionCurrency(session)} ${amount.toLocaleString()}
To: ${recipientName}
Phone: ${recipientPhone}
Fee: ${getSessionCurrency(session)} ${fee.toLocaleString()}
Reference: ${transactionId}

Thank you for using AfriTokeni!`);

      } catch (error) {
        console.error('Error processing send money transaction:', error);
        return endSession(`❌ Transaction Failed!
An error occurred while processing your transaction.

Thank you for using AfriTokeni!`);
      }
    }
    
    default:
      const currency = getSessionCurrency(session);
      session.step = 1;
      return continueSession(`Enter amount to send (${currency}):`);
  }
}
