// Agent Balance Helper Script
// Run this in the browser console on the agent dashboard to initialize agent cash balances

// Function to initialize current user's agent cash balance
async function initializeMyAgentBalance() {
  try {
    console.log('🏦 Initializing current agent cash balance...');
    
    // Get current user from authentication context
    const user = window.authUser || JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.agent?.id && !user?.user?.id) {
      console.error('❌ No agent user found. Please make sure you are logged in as an agent.');
      return false;
    }

    const userId = user.agent?.id || user.user?.id;
    console.log(`👤 Current user ID: ${userId}`);

    // Use DataService to update agent balance
    // First get the agent record
    const agentRecord = await DataService.getAgentByUserId(userId);
    if (!agentRecord) {
      console.error('❌ No agent record found for current user');
      return false;
    }

    console.log(`🏪 Found agent: ${agentRecord.businessName} (ID: ${agentRecord.id})`);
    console.log(`💰 Current cash balance: ${agentRecord.cashBalance}`);

    // Set balance to environment variable amount (25,000,000 UGX)
    const newBalance = 25000000;
    const success = await DataService.updateAgentBalance(agentRecord.id, {
      cashBalance: newBalance
    });

    if (success) {
      console.log(`✅ Successfully updated agent cash balance to ${newBalance.toLocaleString()} UGX`);
      console.log('💡 Refresh the page to see the updated balance in the UI');
      return true;
    } else {
      console.error('❌ Failed to update agent cash balance');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing agent balance:', error);
    return false;
  }
}

// Function to initialize all agents' cash balances (admin only)
async function initializeAllAgentsBalance() {
  try {
    console.log('🏦 Initializing ALL agents cash balances...');
    
    if (typeof DataService?.initializeAllAgentsCashBalance === 'function') {
      const result = await DataService.initializeAllAgentsCashBalance();
      console.log('📊 Result:', result);
      
      if (result.success) {
        console.log(`✅ Successfully updated ${result.updated} agents`);
      } else {
        console.log(`❌ Errors occurred:`, result.errors);
      }
      
      return result;
    } else {
      console.error('❌ DataService.initializeAllAgentsCashBalance method not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing all agents balance:', error);
    return false;
  }
}

// Function to check current agent balance
async function checkMyAgentBalance() {
  try {
    const user = window.authUser || JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.agent?.id && !user?.user?.id) {
      console.error('❌ No agent user found');
      return null;
    }

    const userId = user.agent?.id || user.user?.id;
    const agentRecord = await DataService.getAgentByUserId(userId);
    
    if (agentRecord) {
      console.log(`🏪 Agent: ${agentRecord.businessName}`);
      console.log(`💰 Cash Balance: ${agentRecord.cashBalance.toLocaleString()} UGX`);
      console.log(`💳 Digital Balance: ${agentRecord.digitalBalance.toLocaleString()} UGX`);
      console.log(`📊 Status: ${agentRecord.status}`);
      return agentRecord;
    } else {
      console.error('❌ Agent record not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking agent balance:', error);
    return null;
  }
}

// Make functions available globally
window.initializeMyAgentBalance = initializeMyAgentBalance;
window.initializeAllAgentsBalance = initializeAllAgentsBalance;
window.checkMyAgentBalance = checkMyAgentBalance;

console.log(`
🏦 Agent Balance Helper Loaded!

Available functions:
- checkMyAgentBalance() - Check your current agent balance
- initializeMyAgentBalance() - Set your agent balance to 25M UGX
- initializeAllAgentsBalance() - Set all agents balance to 25M UGX (admin)

Example usage:
  await checkMyAgentBalance()
  await initializeMyAgentBalance()
`);