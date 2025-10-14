@integration
Feature: ckUSDC Operations
  Users can use ckUSDC as a stable store of value in ckUSDC

  Scenario: Check ckUSDC balance
    Given I have 100 ckUSDC
    When I check my balance
    Then I see 100 ckUSDC

  Scenario: Send ckUSDC to another user
    Given I have 100 ckUSDC
    When I send 30 ckUSDC to another user
    Then my balance is 70 ckUSDC

  Scenario: Buy ckUSDC with local currency
    Given I have 375000 UGX
    When I buy ckUSDC with 375000 UGX
    Then I receive approximately 100 ckUSDC

  Scenario: ckUSDC rate stability
    Given the ckUSDC rate is tracked
    When I check the rate
    Then it is within 5% of $1 USD

  Scenario: Buy ckUSDC with exact amount
    Given I have 38000 UGX
    When I buy ckUSDC with 38000 UGX
    Then I receive approximately 10 ckUSDC
    And my UGX balance should be 0

  Scenario: Multiple ckUSDC purchases
    Given I have 100000 UGX
    When I buy ckUSDC with 38000 UGX
    And I buy ckUSDC with 38000 UGX
    Then I should have approximately 20 ckUSDC
    And my UGX balance should be 24000

  Scenario: Send all ckUSDC
    Given I have 50 ckUSDC
    When I send 50 ckUSDC to another user
    Then my balance is 0 ckUSDC

  Scenario: ckUSDC balance precision
    Given I have 100 ckUSDC
    When I send 33 ckUSDC to another user
    Then my balance is 67 ckUSDC

  Scenario: Check ckUSDC after multiple operations
    Given I have 100 ckUSDC
    When I send 20 ckUSDC to another user
    And I send 30 ckUSDC to another user
    And I check my ckUSDC balance
    Then I see 50 ckUSDC
