Feature: ckUSDC Stablecoin
  Users can hold stable value in ckUSDC

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

  Scenario: Price stability check
    Given the ckUSDC rate is tracked
    When I check the rate
    Then it is within 2% of $1 USD
