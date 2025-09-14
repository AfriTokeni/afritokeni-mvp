// Test script to verify notification system functionality using direct API calls
const RESEND_API_KEY = 're_4AjZ2mTF_PczFijRC5eWfLTtvWZJS7nAv';
const EMAIL_FROM = 'noreply@afritokeni.com';
const TEST_EMAIL = 'hejasiba@fxzig.com';

async function sendTestEmail(subject, content) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [TEST_EMAIL],
        subject: subject,
        html: content
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Email sent: ${subject} (ID: ${result.id})`);
      return true;
    } else {
      console.error(`❌ Failed to send email: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Email error: ${error.message}`);
    return false;
  }
}

async function testNotifications() {
  console.log('🧪 Testing AfriTokeni Notification System...\n');
  
  const tests = [
    {
      subject: '[AfriTokeni] Deposit Confirmation',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">💰 Deposit Successful</h2>
          <p>Dear John,</p>
          <p>Your deposit has been processed successfully:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Amount:</strong> UGX 50,000<br>
            <strong>Transaction ID:</strong> test-dep-001<br>
            <strong>Status:</strong> Completed
          </div>
          <p>Thank you for using AfriTokeni!</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">AfriTokeni - Banking the Unbanked</p>
        </div>
      `
    },
    {
      subject: '[AfriTokeni] Withdrawal Request',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">🏧 Withdrawal Ready</h2>
          <p>Dear John,</p>
          <p>Your withdrawal request has been created:</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Amount:</strong> UGX 25,000<br>
            <strong>Withdrawal Code:</strong> <span style="font-family: monospace; font-size: 18px; color: #d97706;">ABC123</span><br>
            <strong>Instructions:</strong> Show this code to your agent
          </div>
          <p>Visit your nearest agent to collect your cash.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">AfriTokeni - Banking the Unbanked</p>
        </div>
      `
    },
    {
      subject: '[AfriTokeni] Bitcoin Exchange Complete',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">₿ Bitcoin Exchange</h2>
          <p>Dear John,</p>
          <p>Your Bitcoin exchange has been completed:</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>From:</strong> UGX 100,000<br>
            <strong>To:</strong> 0.00234567 BTC<br>
            <strong>Transaction ID:</strong> test-btc-001<br>
            <strong>Status:</strong> Completed
          </div>
          <p>Your Bitcoin has been credited to your wallet.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">AfriTokeni - Banking the Unbanked</p>
        </div>
      `
    }
  ];

  let successCount = 0;
  
  for (const test of tests) {
    console.log(`📧 Sending: ${test.subject}`);
    const success = await sendTestEmail(test.subject, test.content);
    if (success) successCount++;
    
    // Wait 1 second between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Test completed: ${successCount}/${tests.length} emails sent successfully`);
  console.log(`📧 Check ${TEST_EMAIL} for the test notifications`);
}

// Run the tests
testNotifications().catch(console.error);
