@integration
Feature: USSD Banking
  Users can access banking via USSD without internet

  Scenario: Check balance via USSD
    Given I have 50000 UGX in my account
    When I dial "*22948#" and select "Check Balance"
    Then I see my balance is 50000 UGX

  Scenario: Send money via USSD
    Given I have 100000 UGX in my account
    When I send 25000 UGX to "+256700999888" via USSD
    Then the transaction succeeds

  Scenario: Insufficient balance
    Given I have 5000 UGX in my account
    When I try to send 10000 UGX via USSD
    Then I see "Insufficient balance"

  Scenario: Withdraw cash via USSD
    Given I have 100000 UGX in my account
    When I request to withdraw 50000 UGX via USSD
    Then I receive a withdrawal code

  Scenario: USSD menu navigation
    Given I am a user
    When I dial "*22948#"
    Then I see the main menu
    And I see options for "Send Money", "Check Balance", "Withdraw Cash"

  Scenario: Send money with exact balance
    Given I have 50000 UGX in my account
    When I send 50000 UGX to "+256700999888" via USSD
    Then the transaction succeeds
    And my balance should be 0 UGX

  Scenario: Multiple USSD transactions
    Given I have 100000 UGX in my account
    When I send 20000 UGX to "+256700999888" via USSD
    And I send 30000 UGX to "+256700999999" via USSD
    Then my balance should be 50000 UGX

  Scenario: Check balance after transaction
    Given I have 100000 UGX in my account
    When I send 25000 UGX to "+256700999888" via USSD
    And I dial "*22948#" and select "Check Balance"
    Then I see my balance is 75000 UGX

  Scenario: Withdrawal code format
    Given I have 100000 UGX in my account
    When I request to withdraw 50000 UGX via USSD
    Then I receive a withdrawal code
    And the code should start with "WD-"

  Scenario: USSD transaction history
    Given I have 100000 UGX in my account
    When I send 25000 UGX to "+256700999888" via USSD
    And I dial "*22948#" and select "Transaction History"
    Then I see my recent transaction
