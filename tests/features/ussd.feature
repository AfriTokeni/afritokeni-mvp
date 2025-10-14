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
