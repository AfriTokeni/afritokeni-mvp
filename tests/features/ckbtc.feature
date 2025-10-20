@integration
Feature: ckBTC Operations
  Users can send and receive ckBTC instantly

  Scenario: Check ckBTC balance
    Given I have 0.005 ckBTC
    When I check my ckBTC balance
    Then I see 0.005 ckBTC

  Scenario: Send ckBTC to another user
    Given I have 0.005 ckBTC
    When I send 0.003 ckBTC to another user
    Then my balance is 0.002 ckBTC

  Scenario: Sell ckBTC for cash via agent
    Given I have 0.005 ckBTC
    When I sell 0.005 ckBTC for UGX via agent
    Then I receive an escrow code

  Scenario: Complete agent exchange
    Given I have an active escrow with code "BTC-123456"
    When the agent confirms the exchange
    Then the ckBTC is released to the agent
