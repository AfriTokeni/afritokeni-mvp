@integration
Feature: USSD End-to-End Integration
  Test complete USSD flows with real service integration

  Background:
    Given I am a registered user with 100000 UGX balance

  Scenario: Complete check balance flow
    When I dial "*229#" for integration
    And I select "1" for Local Currency
    And I select "1.2" for Check Balance
    Then I should see my balance "100000"
    And the session should end

  Scenario: Complete send money flow
    Given recipient "+256700999888" exists
    When I dial "*229#" for integration
    And I select "1" for Local Currency
    And I select "1.1" for Send Money
    And I enter recipient phone "+256700999888"
    And I enter send amount "25000"
    And I confirm the transaction
    Then I should see "Transaction successful" in USSD response
    And my balance should be 75000
    And a transaction should be created

  Scenario: Complete withdrawal flow
    Given agent "Agent-001" is available
    When I dial "*229#" for integration
    And I select "1" for Local Currency
    And I select "1.4" for Withdraw
    And I enter withdraw amount "50000"
    And I select agent "1"
    And I confirm withdrawal
    Then I should see withdrawal code
    And the code should start with "WD-"

  Scenario: Complete deposit flow
    Given agent "Agent-001" is available
    When I dial "*229#" for integration
    And I select "1" for Local Currency
    And I select "1.3" for Deposit
    And I enter deposit amount "50000"
    Then I should see deposit code
    And the code should start with "DEP-"
    And deposit instructions should be shown

  Scenario: Complete Bitcoin check balance flow
    Given I have 0.01 ckBTC for integration test
    When I dial "*229#" for integration
    And I select "2" for Bitcoin
    And I select "2.1" for Check Balance
    Then I should see my Bitcoin balance
    And the session should end

  Scenario: Navigation back to main menu
    When I dial "*229#" for integration
    And I select "1" for Local Currency
    And I select "0" for Back
    Then I should see the main menu with options
    And the session menu should be "main"

  Scenario: Invalid selection returns to menu
    When I dial "*229#" for integration
    And I select "99" for invalid option
    Then I should see "Invalid" in USSD response
    And I should see the main menu with options

  Scenario: Session continues across multiple inputs
    When I dial "*229#" for integration
    And I select "1" for Local Currency
    Then the session should continue
    When I select "1.2" for Check Balance
    Then I should see my balance "100000"
