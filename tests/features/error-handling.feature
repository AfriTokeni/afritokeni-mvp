@integration
Feature: Error Handling and Edge Cases
  The system should handle errors gracefully and provide clear feedback

  @integration
  Scenario: Insufficient balance for transfer
    Given I have 0.001 ckBTC
    When I try to send 0.005 ckBTC to another user
    Then the transfer should fail
    And I should see an error message about insufficient balance

  @integration
  Scenario: Invalid recipient address
    Given I have 0.01 ckBTC
    When I try to send 0.001 ckBTC to an invalid address
    Then the transfer should fail
    And I should see an error message about invalid recipient

  @integration
  Scenario: Expired escrow code
    Given I have an escrow that expired 25 hours ago
    When I try to verify the expired escrow code
    Then the verification should fail
    And I should see an error message about expiration
    And the funds should be refunded automatically

  @integration
  Scenario: Invalid escrow code
    When I try to verify an escrow with code "INVALID-123"
    Then the verification should fail
    And I should see an error message about invalid code

  @integration
  Scenario: Agent tries to verify wrong escrow
    Given I have an active escrow assigned to agent A
    When agent B tries to verify the escrow code
    Then the verification should fail
    And I should see an error message about unauthorized agent

  Scenario: Duplicate transaction prevention
    Given I have 0.01 ckBTC
    When I send 0.005 ckBTC to a user
    And I immediately try to send the same amount again
    Then both transactions should process independently
    And my balance should decrease by 0.01 ckBTC total

  Scenario: Network timeout handling
    Given the ICP network is slow
    When I query my ckBTC balance
    Then the system should retry automatically or show a timeout message

  Scenario: Zero amount transfer
    Given I have 0.01 ckBTC
    When I try to send 0 ckBTC to another user
    Then the transfer should fail
    And I should see an error message about invalid amount

  Scenario: Negative amount transfer
    Given I have 0.01 ckBTC
    When I try to send -0.001 ckBTC to another user
    Then the transfer should fail
    And I should see an error message about invalid amount

  Scenario: Maximum transaction limit
    Given I have 100 ckBTC
    When I try to send 50 ckBTC to another user
    Then the system should warn about large transaction
    And require additional confirmation

  Scenario: Transfer more than balance
    Given I have 0.005 ckBTC
    When I try to send 0.01 ckBTC to another user
    Then the transfer should fail
    And I should see an error message about insufficient balance
    And my balance should remain 0.005 ckBTC

  Scenario: Invalid escrow code
    Given I am an agent
    When I try to verify an escrow with code "INVALID-123"
    Then the verification should fail
    And I should see an error message about invalid code

  Scenario: Escrow code already used
    Given I have an active escrow with code "BTC-123456"
    And the agent confirms the exchange
    When I try to use the same code again
    Then the verification should fail
    And I should see an error message about code already used

  Scenario: Transfer to invalid address format
    Given I have 0.01 ckBTC
    When I try to send 0.001 ckBTC to invalid address "abc123"
    Then the transfer should fail
    And I should see an error message about invalid recipient

  Scenario: Concurrent balance check
    Given I have 0.01 ckBTC
    When I send 0.003 ckBTC to another user
    And I immediately check my balance
    Then I should see the updated balance

  Scenario: USSD session timeout
    Given I have 50000 UGX in my account
    When I dial "*22948#" and wait 2 minutes
    Then the session should timeout
    And I should see "Session expired"

  Scenario: Multiple failed transfers
    Given I have 0.01 ckBTC
    When I try to send 0.02 ckBTC to another user
    And I try to send 0.02 ckBTC to another user
    Then both transfers should fail
    And my balance should remain 0.01 ckBTC

  Scenario: Empty balance transfer attempt
    Given I have 0 ckBTC
    When I try to send 0.001 ckBTC to another user
    Then the transfer should fail
    And I should see an error message about insufficient balance
