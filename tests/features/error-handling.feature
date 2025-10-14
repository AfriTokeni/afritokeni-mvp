Feature: Error Handling and Edge Cases
  As a user of AfriTokeni
  I want the system to handle errors gracefully
  So that I understand what went wrong and how to fix it

  Scenario: Insufficient balance for transfer
    Given I have 0.001 ckBTC
    When I try to send 0.005 ckBTC to another user
    Then the transfer should fail
    And I should see an error message about insufficient balance

  Scenario: Invalid recipient address
    Given I have 0.01 ckBTC
    When I try to send 0.001 ckBTC to an invalid address
    Then the transfer should fail
    And I should see an error message about invalid recipient

  Scenario: Expired escrow code
    Given I have an escrow that expired 25 hours ago
    When I try to verify the expired escrow code
    Then the verification should fail
    And I should see an error message about expiration
    And the funds should be refunded automatically

  Scenario: Invalid escrow code
    When I try to verify an escrow with code "INVALID-123"
    Then the verification should fail
    And I should see an error message about invalid code

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
