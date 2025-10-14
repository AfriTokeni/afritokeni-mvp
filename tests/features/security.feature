Feature: Security and Fraud Prevention
  As a platform operator
  I want to prevent fraud and secure user funds
  So that users can trust the platform

  @pending
  Scenario: Account lockout after failed login attempts
    Given I am a user
    When I enter wrong password 3 times
    Then my account should be temporarily locked
    And I should receive a security notification
    And be able to unlock via SMS verification

  @pending
  Scenario: Suspicious transaction detection
    Given I am a user with normal transaction patterns
    When I suddenly try to send 10x my usual amount
    Then the system should flag it as suspicious
    And require additional verification
    And send me a security alert

  @pending
  Scenario: Escrow code brute force prevention
    Given there is an active escrow transaction
    When someone tries 5 wrong codes
    Then the escrow should be locked
    And the user should be notified
    And require manual verification to unlock

  @pending
  Scenario: Duplicate withdrawal prevention
    Given I have a pending withdrawal request
    When I try to create another withdrawal with same code
    Then the system should reject the duplicate
    And show me the existing withdrawal status

  @pending
  Scenario: Agent verification requirements
    Given I want to become an agent
    When I register as an agent
    Then I must provide government ID and proof of address
    And pass KYC verification before processing transactions

  @pending
  Scenario: Transaction reversal protection
    Given I completed a transaction 2 hours ago
    When I try to reverse it
    Then the system should reject the reversal
    And suggest contacting support
    And log the reversal attempt

  @pending
  Scenario: Multi-device login detection
    Given I am logged in on my phone
    When I log in from a different device
    Then I should be notified about the new device
    And be asked to verify the new device
    And have option to logout other devices

  @pending
  Scenario: Phishing protection
    Given I receive a suspicious SMS claiming to be AfriTokeni
    When I click on a link in the SMS
    Then the app should warn me about phishing
    And show official contact methods
    And allow me to report the phishing attempt

  @pending
  Scenario: Escrow timeout and refund
    Given I created an escrow 24 hours ago
    And the agent never completed it
    When the timeout period expires
    Then my funds should be automatically refunded
    And I should receive a notification
    And the escrow should be marked as expired

  @pending
  Scenario: Large transaction verification
    Given I want to send 1 ckBTC
    When I initiate the transaction
    Then I should receive SMS verification code and email confirmation
    And have 10 minutes to confirm before transaction processes
