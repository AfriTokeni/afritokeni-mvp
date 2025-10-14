@integration
Feature: Multi-Currency Support
  As a user in different African countries
  I want to use my local currency
  So that I can transact in familiar denominations

  Scenario: Nigerian Naira (NGN) transactions
    Given I am a user in Nigeria
    And I have 50000 NGN in my wallet
    When I check my balance
    Then I should see 50000 NGN
    When I send 10000 NGN to another user
    Then my balance should be 40000 NGN

  Scenario: Kenyan Shilling (KES) transactions
    Given I am a user in Kenya
    And I have 10000 KES in my wallet
    When I check my balance
    Then I should see 10000 KES
    When I send 2000 KES to another user
    Then my balance should be 8000 KES

  Scenario: Ghanaian Cedi (GHS) transactions
    Given I am a user in Ghana
    And I have 1000 GHS in my wallet
    When I check my balance
    Then I should see 1000 GHS
    When I send 200 GHS to another user
    Then my balance should be 800 GHS

  Scenario: South African Rand (ZAR) transactions
    Given I am a user in South Africa
    And I have 5000 ZAR in my wallet
    When I check my balance
    Then I should see 5000 ZAR
    When I send 1000 ZAR to another user
    Then my balance should be 4000 ZAR

  Scenario: Cross-currency exchange rates
    Given I am a user in Uganda with 100000 UGX
    When I check the exchange rate to KES
    Then I should see the current UGX to KES rate
    When I exchange 50000 UGX to KES
    Then I should receive the equivalent amount in KES

  Scenario: Bitcoin purchase with different currencies
    Given I am a user in Nigeria with 1000000 NGN
    When I check the Bitcoin rate in NGN
    Then I should see the current BTC to NGN rate
    When I buy 0.001 ckBTC with NGN
    Then my NGN balance should decrease accordingly
    And my ckBTC balance should increase by 0.001

  Scenario: Currency formatting and display
    Given I have balances in multiple currencies
    When I view my wallet
    Then I should see proper currency symbols
    And amounts should be formatted correctly
    And decimal places should match currency standards

  Scenario: Agent commission in local currency
    Given I am an agent in Kenya
    When I process a 10000 KES transaction
    Then my commission should be calculated in KES
    And displayed with proper formatting

  Scenario: Send money in different African currencies
    Given I am a user in South Africa
    And I have 10000 ZAR in my wallet
    When I send 5000 ZAR to another user
    Then my balance should be 5000 ZAR

  Scenario: Multiple currency balances
    Given I have 100000 NGN in my wallet
    And I have 50000 KES in my wallet
    And I have 200000 UGX in my wallet
    When I check my balances
    Then I should see all three currency balances

  Scenario: Cross-border transfer
    Given I am a user in Uganda with 100000 UGX
    When I send money to a user in Kenya
    Then the amount is converted to KES
    And the transaction completes successfully

  Scenario: Bitcoin rate in different currencies
    Given I am a user in Nigeria with 1000000 NGN
    When I check the Bitcoin rate in NGN
    Then I should see the current BTC to NGN rate
    And the rate should be approximately 45000000 NGN per BTC

  Scenario: Exchange rate accuracy
    Given I am a user in Uganda with 100000 UGX
    When I check the exchange rate to KES
    Then the rate should reflect current market rates
    And be within 5% of official rates

  Scenario: Large amount formatting
    Given I have 50000000 NGN in my wallet
    When I view my balance
    Then it should be displayed as "50M NGN"

  Scenario: Transaction with all supported currencies
    Given I am a user with 10000 GHS
    When I send 5000 GHS to another user
    Then the transaction completes successfully
    And my balance should be 5000 GHS
