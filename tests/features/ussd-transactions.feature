Feature: USSD Transaction History
  As a USSD user
  I want to view my transaction history
  So that I can track my financial activities

  Background:
    Given I have a phone number "+256700123456"
    And I have set my PIN to "1234"

  Scenario: View transaction history
    When I dial "*229#"
    And I select "1" for Local Currency
    And I select "5" for Transactions
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I enter PIN "1234"
    Then I should see "Recent Transactions" in USSD response
    And I should see transaction details

  Scenario: Filter transactions by type
    When I dial "*229#"
    And I select "1" for Local Currency
    And I select "5" for Transactions
    When I enter PIN "1234"
    Then I should see "Recent Transactions" in USSD response
    When I select "1" for filter options
    Then I should see "Filter by type" in USSD response
    And I should see "1. Send" in USSD response
    And I should see "2. Receive" in USSD response
    And I should see "3. Withdraw" in USSD response
    And I should see "4. Deposit" in USSD response

  Scenario: View empty transaction history
    Given I am a new user with no transactions
    When I dial "*229#"
    And I select "1" for Local Currency
    And I select "5" for Transactions
    When I enter PIN "1234"
    Then I should see "No transactions found" in USSD response

  Scenario: Navigate back from transaction history
    When I dial "*229#"
    And I select "1" for Local Currency
    And I select "5" for Transactions
    When I enter PIN "1234"
    Then I should see "Recent Transactions" in USSD response
    When I select "0" to go back
    Then I should see "Local Currency Menu" in USSD response
