Feature: ICP Blockchain Integration
  As a user of AfriTokeni
  I want to interact with real ckBTC and ckUSDC ledgers on ICP
  So that I can verify the blockchain integration works correctly

  Background:
    Given the local ICP replica is running
    And ckBTC ledger is deployed
    And ckUSDC ledger is deployed

  Scenario: Query ckBTC ledger metadata
    When I query the ckBTC ledger for token metadata
    Then the token symbol should be "ckBTC"
    And the token name should be "ckBTC"
    And the decimals should be 8

  Scenario: Query ckBTC balance
    Given I have a test principal
    When I query my ckBTC balance on the ledger
    Then I should receive a valid balance response
    And the balance should be a non-negative number

  Scenario: Query ckUSDC ledger metadata
    When I query the ckUSDC ledger for token metadata
    Then the token symbol should be "ckUSDC"
    And the token name should be "ckUSDC"
    And the decimals should be 6

  Scenario: Query ckUSDC balance
    Given I have a test principal
    When I query my ckUSDC balance on the ledger
    Then I should receive a valid balance response
    And the balance should be a non-negative number

  Scenario: Complete user deposit flow
    Given I have a test principal
    And I have 1000000 satoshis of ckBTC
    When I transfer 50000 satoshis to another user
    Then the transfer should succeed
    And my balance should decrease by 50000 satoshis
    And the recipient balance should increase by 50000 satoshis

  Scenario: Exchange ckBTC for local currency via escrow
    Given I have a test principal
    And I have 100000 satoshis of ckBTC
    When I create an escrow to exchange 50000 satoshis for UGX
    Then an escrow transaction should be created
    And I should receive a 6-digit exchange code
    When the agent verifies the exchange code
    Then the ckBTC should be released to the agent
    And the escrow status should be "completed"
