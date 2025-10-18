Feature: USSD USDC Menu Navigation and Operations
  As a USSD user
  I want to access USDC features via USSD
  So that I can check balances and rates with proper navigation

  Background:
    Given I have a phone number "+256700123456"
    And I have set my PIN to "1234"

  Scenario: Access USDC menu from main menu
    When I dial "*229#"
    And I select "3" for USDC
    Then I should see "USDC (ckUSDC)" in USSD response
    And I should see "1. Check Balance" in USSD response
    And I should see "2. USDC Rate" in USSD response
    And I should see "3. Buy USDC" in USSD response
    And I should see "4. Sell USDC" in USSD response
    And I should see "5. Send USDC" in USSD response
    And I should see "0. Back to Main Menu" in USSD response

  Scenario: Check USDC balance with PIN
    When I dial "*229#"
    And I select "3" for USDC
    And I select "1" for Check Balance
    Then I should see "Enter your 4-digit PIN" in USSD response
    And I should see "0. Back | 9. Menu" in USSD response
    When I enter PIN "1234"
    Then I should see "Your USDC Balance" in USSD response

  Scenario: Cancel USDC balance check with 0
    When I dial "*229#"
    And I select "3" for USDC
    And I select "1" for Check Balance
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I select "0" to go back
    Then I should see "USDC (ckUSDC)" in USSD response
    And I should see "1. Check Balance" in USSD response

  Scenario: Show USDC menu with 9 during balance check
    When I dial "*229#"
    And I select "3" for USDC
    And I select "1" for Check Balance
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I select "9" to show current menu
    Then I should see "USDC (ckUSDC)" in USSD response
    And I should see "1. Check Balance" in USSD response

  Scenario: Check USDC rate with PIN
    When I dial "*229#"
    And I select "3" for USDC
    And I select "2" for USDC Rate
    Then I should see "Enter your 4-digit PIN" in USSD response
    And I should see "0. Back | 9. Menu" in USSD response
    When I enter PIN "1234"
    Then I should see "Current USDC Exchange Rate" in USSD response

  Scenario: Cancel USDC rate check with 0
    When I dial "*229#"
    And I select "3" for USDC
    And I select "2" for USDC Rate
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I select "0" to go back
    Then I should see "USDC (ckUSDC)" in USSD response
    And I should see "2. USDC Rate" in USSD response

  Scenario: Show USDC menu with 9 during rate check
    When I dial "*229#"
    And I select "3" for USDC
    And I select "2" for USDC Rate
    Then I should see "Enter your 4-digit PIN" in USSD response
    When I select "9" to show current menu
    Then I should see "USDC (ckUSDC)" in USSD response

  Scenario: Navigate back to main menu from USDC menu
    When I dial "*229#"
    And I select "3" for USDC
    Then I should see "USDC (ckUSDC)" in USSD response
    When I select "0" to go back
    Then I should see "Welcome to AfriTokeni" in USSD response
    And I should see "3. USDC" in USSD response

  Scenario: Invalid PIN shows error with navigation options
    When I dial "*229#"
    And I select "3" for USDC
    And I select "1" for Check Balance
    When I enter PIN "9999"
    Then I should see "Incorrect PIN" in USSD response
    And I should see "0. Back | 9. Menu" in USSD response

  Scenario: Invalid PIN format shows error with navigation options
    When I dial "*229#"
    And I select "3" for USDC
    And I select "1" for Check Balance
    When I enter PIN "123"
    Then I should see "Invalid PIN format" in USSD response
    And I should see "0. Back | 9. Menu" in USSD response

  Scenario: Chained input for USDC balance check
    When I dial "*229#"
    And I enter chained input "3*1*1234"
    Then I should see "Your USDC Balance" in USSD response

  Scenario: Chained input for USDC rate check
    When I dial "*229#"
    And I enter chained input "3*2*1234"
    Then I should see "Current USDC Exchange Rate" in USSD response
