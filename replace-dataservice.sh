#!/bin/bash

# Script to replace DataService with specialized services across the codebase

echo "Replacing DataService with specialized services..."

# Find all files that import DataService (excluding dataService.ts itself)
FILES=$(grep -r "from.*dataService\|from.*DataService" src --include="*.ts" --include="*.tsx" -l | grep -v "src/services/dataService.ts")

for file in $FILES; do
  echo "Processing: $file"
  
  # Replace DataService method calls with specialized service calls
  sed -i '' 's/DataService\.createUser/UserService.createUser/g' "$file"
  sed -i '' 's/DataService\.getUserByKey/UserService.getUserByKey/g' "$file"
  sed -i '' 's/DataService\.getUser/UserService.getUser/g' "$file"
  sed -i '' 's/DataService\.getWebUserById/UserService.getWebUserById/g' "$file"
  sed -i '' 's/DataService\.updateUser/UserService.updateUser/g' "$file"
  sed -i '' 's/DataService\.searchUsers/UserService.searchUsers/g' "$file"
  sed -i '' 's/DataService\.searchUserByPhone/UserService.searchUserByPhone/g' "$file"
  
  sed -i '' 's/DataService\.createAgent/AgentService.createAgent/g' "$file"
  sed -i '' 's/DataService\.getAgent/AgentService.getAgent/g' "$file"
  sed -i '' 's/DataService\.getAgentByUserId/AgentService.getAgentByUserId/g' "$file"
  sed -i '' 's/DataService\.updateAgentStatus/AgentService.updateAgentStatus/g' "$file"
  sed -i '' 's/DataService\.updateAgentBalance/AgentService.updateAgentBalance/g' "$file"
  sed -i '' 's/DataService\.getNearbyAgents/AgentService.getNearbyAgents/g' "$file"
  sed -i '' 's/DataService\.completeAgentKYC/AgentService.completeAgentKYC/g' "$file"
  
  sed -i '' 's/DataService\.createTransaction/TransactionService.createTransaction/g' "$file"
  sed -i '' 's/DataService\.getTransaction/TransactionService.getTransaction/g' "$file"
  sed -i '' 's/DataService\.getUserTransactions/TransactionService.getUserTransactions/g' "$file"
  sed -i '' 's/DataService\.getAgentTransactions/TransactionService.getAgentTransactions/g' "$file"
  sed -i '' 's/DataService\.getAllAgentTransactions/TransactionService.getAgentTransactions/g' "$file"
  sed -i '' 's/DataService\.updateTransaction/TransactionService.updateTransaction/g' "$file"
  
  sed -i '' 's/DataService\.getUserBalance/BalanceService.getUserBalance/g' "$file"
  sed -i '' 's/DataService\.updateUserBalance/BalanceService.updateUserBalance/g' "$file"
  sed -i '' 's/DataService\.transfer/BalanceService.transfer/g' "$file"
  
  sed -i '' 's/DataService\.processSMSCommand/SMSService.processSMSCommand/g' "$file"
  sed -i '' 's/DataService\.logSMSMessage/SMSService.logSMSMessage/g' "$file"
  
  sed -i '' 's/DataService\.createDepositRequest/DepositWithdrawalService.createDepositRequest/g' "$file"
  sed -i '' 's/DataService\.getAgentDepositRequests/DepositWithdrawalService.getAgentDepositRequests/g' "$file"
  sed -i '' 's/DataService\.updateDepositRequestStatus/DepositWithdrawalService.updateDepositRequestStatus/g' "$file"
  sed -i '' 's/DataService\.processDepositRequest/DepositWithdrawalService.processDepositRequest/g' "$file"
  sed -i '' 's/DataService\.getDepositRequestByCode/DepositWithdrawalService.getDepositRequestByCode/g' "$file"
  
  sed -i '' 's/DataService\.createWithdrawalRequest/DepositWithdrawalService.createWithdrawalRequest/g' "$file"
  sed -i '' 's/DataService\.getAgentWithdrawalRequests/DepositWithdrawalService.getAgentWithdrawalRequests/g' "$file"
  sed -i '' 's/DataService\.updateWithdrawalRequestStatus/DepositWithdrawalService.updateWithdrawalRequestStatus/g' "$file"
  sed -i '' 's/DataService\.processWithdrawalRequest/DepositWithdrawalService.processWithdrawalRequest/g' "$file"
  
  sed -i '' 's/DataService\.processUSSDRequest/USSDService.processUSSDRequest/g' "$file"
  sed -i '' 's/DataService\.createUSSDSession/USSDService.createUSSDSession/g' "$file"
  sed -i '' 's/DataService\.getUSSDSession/USSDService.getUSSDSession/g' "$file"
  
  # Comment out initializeUserData calls (no longer needed)
  sed -i '' 's/await DataService\.initializeUserData/\/\/ await UserService.initializeUserData/g' "$file"
  sed -i '' 's/DataService\.initializeUserData/\/\/ UserService.initializeUserData/g' "$file"
  
done

echo "Done! Now updating imports..."
echo "You'll need to manually add the correct service imports to each file."
