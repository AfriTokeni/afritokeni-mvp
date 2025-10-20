Feature: USSD Bitcoin (ckBTC) Menu Navigation and Operations
  As a USSD user
  I want to access Bitcoin features via USSD
  So that I can check balances, rates, and perform transactions without Principal ID errors

  Background:
    Given I have a phone number "+256700123456"
    And I have set my PIN to "1234"

  Scenario: Access Bitcoin menu from main menu
    When I dial "*229#"
    And I select "2" for Bitcoin
    Then I should see "Bitcoin (ckBTC)" in USSD response
    And I should see "1. Check Balance" in USSD response
    And I should see "2. Bitcoin rate" in USSD response
    And I should see "3. Buy Bitcoin" in USSD response
    And I should see "4. Sell Bitcoin" in USSD response
    And I should see "5. Send Bitcoin" in USSD response
    And I should see "0. Back to Main Menu" in USSD response

  Scenario: Check Bitcoin balance with PIN
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "1" for Check Balance
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I enter PIN "1234"
    Then I should see "Your ckBTC Balance" in USSD response
    And I should see "BTC" in USSD response

  Scenario: Sell Bitcoin flow
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "4" for Sell Bitcoin
    Then I should see "Sell ckBTC" in USSD response
    And I should see "Your ckBTC Balance" in USSD response
    And I should see "1. Enter amount" in USSD response
    And I should see "2. Enter BTC amount" in USSD response

  Scenario: Cancel Bitcoin balance check with 0
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "1" for Check Balance
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I select "0" to go back
    Then I should see "Bitcoin (ckBTC)" in USSD response
    And I should see "1. Check Balance" in USSD response

  Scenario: Show Bitcoin menu with 9 during balance check
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "1" for Check Balance
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I select "9" to show current menu
    Then I should see "Bitcoin (ckBTC)" in USSD response
    And I should see "1. Check Balance" in USSD response

  Scenario: Check Bitcoin rate without PIN
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I enter chained input "2"
    Then I should see "Bitcoin Exchange Rate" in USSD response
    And I should see "1 BTC" in USSD response

  Scenario: Navigate back to main menu from Bitcoin menu
    When I dial "*229#"
    And I select "2" for Bitcoin
    Then I should see "Bitcoin (ckBTC)" in USSD response
    When I select "0" to go back
    Then I should see "Welcome to AfriTokeni" in USSD response
    And I should see "2. Bitcoin" in USSD response

  Scenario: Invalid PIN shows error without navigation
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "1" for Check Balance
    When I enter PIN "9999"
    Then I should see "Incorrect PIN" in USSD response
    And I should see "Enter your 4-digit PIN" in USSD response

  Scenario: Invalid PIN format shows error without navigation
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "1" for Check Balance
    When I enter PIN "123"
    Then I should see "Invalid PIN format" in USSD response
    And I should see "Enter your 4-digit PIN" in USSD response

  Scenario: Chained input for Bitcoin balance check
    When I dial "*229#"
    And I enter chained input "2*1*1234"
    Then I should see "Your ckBTC Balance" in USSD response
    And I should see "BTC" in USSD response

  Scenario: Chained input for Bitcoin rate check
    When I dial "*229#"
    And I enter chained input "2*2"
    Then I should see "Bitcoin Exchange Rate" in USSD response

  Scenario: Buy Bitcoin flow
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "3" for Buy Bitcoin
    Then I should see "Buy Bitcoin" in USSD response
    And I should see "Enter amount to spend" in USSD response

  Scenario: Send Bitcoin flow with PIN first
    When I dial "*229#"
    And I select "2" for Bitcoin
    And I select "5" for Send Bitcoin
    Then I should see "Send Bitcoin" in USSD response
    And I should see "Enter your 4-digit PIN" in USSD response
