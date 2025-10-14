@integration
Feature: Fiat Currency Transfers
  Users can send local African currencies

  Scenario: Send money in UGX
    Given I have 500000 UGX
    When I send 100000 UGX to another user
    Then the transaction completes successfully

  Scenario: Cross-currency transfer
    Given I have 500000 UGX
    When I send money to a user in Kenya
    Then the amount is converted to KES

  Scenario: Insufficient balance
    Given I have 50000 UGX
    When I try to send 100000 UGX
    Then the transaction fails with "Insufficient balance"
