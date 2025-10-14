@integration
Feature: Agent Operations
  As an agent
  I want to process transactions and manage liquidity
  So that I can earn commissions and serve customers

  Scenario: Agent processes cash deposit
    Given I am an agent with 500000 UGX digital balance
    And a customer brings 100000 UGX cash
    When I verify the customer identity
    And I credit 100000 UGX to their account
    Then my digital balance should decrease by 100000 UGX
    And my cash balance should increase by 100000 UGX
    And I should earn commission on the transaction

  Scenario: Agent processes cash withdrawal
    Given I am an agent with 200000 UGX cash
    And a customer requests 50000 UGX withdrawal
    When I verify their withdrawal code
    And I give them 50000 UGX cash
    Then my cash balance should decrease by 50000 UGX
    And my digital balance should increase by 50000 UGX
    And I should earn commission on the transaction

  Scenario: Agent insufficient liquidity
    Given I am an agent with 10000 UGX digital balance
    When a customer wants to deposit 50000 UGX
    Then I should see a liquidity warning
    And be prompted to fund my account
    And the transaction should not proceed

  Scenario: Agent Bitcoin exchange
    Given I am an agent with ckBTC available
    And a customer wants to buy 0.001 ckBTC for UGX
    When I verify the escrow code
    And confirm the cash payment
    Then the ckBTC should be released to the customer
    And I should receive the UGX equivalent
    And I should earn my commission

  Scenario: Agent liquidity management
    Given I am an agent with low digital balance
    When I fund my account via bank transfer
    Then my digital balance should increase
    And I should be able to process deposits again

  @pending
  Scenario: Agent settlement request
    Given I am an agent with 500000 UGX in commissions
    When I request settlement to my bank account
    Then a settlement transaction should be created
    And my commission balance should decrease
    And I should receive confirmation

  @pending
  Scenario: Agent daily transaction limit
    Given I am a new agent with basic verification
    When I try to process transactions over 1000000 UGX
    Then I should see a daily limit warning
    And be prompted to upgrade my verification

  @pending
  Scenario: Agent reputation and ratings
    Given I am an agent who completed 100 transactions
    And I have a 4.8 star rating
    When a customer searches for agents
    Then I should appear in search results
    And my rating should be displayed
    And customers should see my transaction count

  @pending
  Scenario: Agent offline mode
    Given I am an agent in an area with poor internet
    When I process a transaction
    Then the transaction should queue locally
    And sync when internet is available
    And the customer should receive confirmation

  Scenario: Multiple agents in same location
    Given there are 5 agents in Kampala
    When a customer searches for nearby agents
    Then they should see all 5 agents sorted by distance and rating
    And be able to compare commission rates

  Scenario: Agent processes multiple deposits
    Given I am an agent with 500000 UGX digital balance
    When a customer brings 50000 UGX cash
    And another customer brings 30000 UGX cash
    Then my digital balance should decrease by 80000 UGX
    And my cash balance should increase by 80000 UGX

  Scenario: Agent cash balance tracking
    Given I am an agent with 200000 UGX cash
    When I give 50000 UGX cash to a customer
    And I give 30000 UGX cash to another customer
    Then my cash balance should be 120000 UGX

  Scenario: Agent commission calculation
    Given I am an agent
    When I process a 100000 UGX deposit
    Then I should earn 3000 UGX commission

  Scenario: Agent Bitcoin exchange with rate
    Given I am an agent with ckBTC available
    And the Bitcoin rate is 150000000 UGX per BTC
    When a customer wants to buy 0.001 ckBTC for UGX
    Then the customer should pay 150000 UGX

  Scenario: Agent verifies multiple escrows
    Given I am an agent
    And there are 3 pending escrow transactions
    When I verify each escrow code
    Then all transactions should complete successfully

  Scenario: Agent low cash warning
    Given I am an agent with 10000 UGX cash
    When a customer requests 50000 UGX withdrawal
    Then I should see a liquidity warning
    And the transaction should not proceed

  Scenario: Agent funding confirmation
    Given I am an agent with low digital balance
    When I fund my account via bank transfer with 500000 UGX
    Then my digital balance should increase by 500000 UGX
    And I should be able to process deposits again
