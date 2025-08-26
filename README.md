# AfriTokeni: Bridging DeFi and Mobile Money in Africa

## Introduction

AfriTokeni is a decentralized finance (DeFi) application built on the Internet Computer Protocol (ICP) that bridges the gap between traditional mobile money and modern blockchain technology. It enables fast, secure, and low-cost financial transactions for all Africans, regardless of whether they use a smartphone or a basic feature phone.

The project addresses systemic inefficiencies in Africa's mobile money ecosystem, such as high transaction costs, limited interoperability, and the digital divide that excludes feature phone users from the digital economy. By leveraging stablecoins and providing a dual interface (web app and USSD), AfriTokeni aims to create a unified, low-cost, and inclusive financial rail for everyone.

## Demo Video

[AfriTokeni Demo](https://www.loom.com/share/f442426d1f754e9c91870c8efc45ce89?sid=44fff060-6e3f-466d-b199-2e0dc1e6420d)

## Live Application

You can access the live production application here: **[https://dkk74-oyaaa-aaaal-askxq-cai.icp0.io/](https://dkk74-oyaaa-aaaal-askxq-cai.icp0.io/)**

## Architecture Description

AfriTokeni's architecture is designed for universal access and decentralized security.

*   **Frontend (Web App)**: A modern web application built with **React** and **TypeScript** for smartphone users. It provides a rich user interface for managing accounts, viewing transaction history, and interacting with the agent network.

*   **Backend (Blockchain)**: The core backend logic and data storage are built on the **Internet Computer Protocol** using **Juno**, a Backend-as-a-Service (BaaS) platform. This includes:
    *   **Datastore**: Securely stores all application data in collections such as `users`, `transactions`, `balances`, and `agents`.
    *   **Authentication**: Manages user identity via ICP's **Internet Identity** for web users.

*   **Webhook Server (USSD & SMS)**: A **Node.js/Express** server that acts as a webhook for the **AfricasTalking API**. This server processes all USSD requests and SMS messages, allowing feature phone users to access core financial services without an internet connection.

*   **Dual Interface**:
    1.  **Web App**: For smartphone users with internet access.
    2.  **USSD**: For feature phone users, enabling them to send money, check balances, and initiate cash withdrawals.


## Local Development Setup

**Prerequisites:**
*   [Docker](https://www.docker.com/get-started)
*   [ngrok](https://ngrok.com/download)
*   [Node.js](https://nodejs.org/) and npm

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/AfriTokeni/afritokeni-mvp.git
cd afritokeni-mvp
```

### Step 2: Start the Juno Development Emulator

This command starts the local ICP blockchain emulator and is **required** for authentication to work.

```bash
juno dev start
```

### Step 3: Create and Configure a Juno Satellite

1.  Open the Juno Console in your browser at [http://localhost:5866](http://localhost:5866) and create a new satellite.
2.  Copy the new Satellite ID.
3.  Set the Satellite ID in your `juno.config.ts` file:

    ```typescript
    // filepath: juno.config.ts
    import { defineConfig } from "@junobuild/config";

    export default defineConfig({
      satellite: {
        ids: {
          development: "<PASTE_YOUR_DEV_SATELLITE_ID_HERE>",
        },
        source: "dist",
      },
    });
    ```

### Step 4: Install Dependencies and Start the Frontend

Open a new terminal to install dependencies and start the React development server.

```bash
npm install
npm run dev
```

### Step 5: Create Datastore Collections

Log in to your Juno instance via the terminal and create the required collections for the application to function.

```bash
# Login to the local Juno emulator
juno login --mode development --emulator

# Create the required collections
juno config --mode development
```

AfriTokeni requires the following collections:
*   `users`
*   `transactions`
*   `balances`
*   `agents`
*   `balances`
*   `user_roles`

You can create these manually via the [Juno Datastore UI](http://localhost:5866/datastore).

### Step 6: Set Up the AfricasTalking Webhook Server

1.  **Configure Environment Variables**: Create a `.env` file in the project root and add your AfricasTalking credentials. You can get these from the AfricasTalking Sandbox environment.

    ```env
    VITE_AT_API_KEY=your_api_key_here
    VITE_AT_USERNAME=sandbox
    VITE_PORT=3001
    ```

2.  **Build the Backend Server**: In another terminal, compile the TypeScript backend code into JavaScript.

    ```bash
    npm run build:backend
    ```

3.  **Start the Backend Server**: In another terminal, start the webhook server.

    ```bash
    npm run start:backend
    ```

4.  **Expose the Server with ngrok**: Expose your local webhook server to the internet so AfricasTalking can reach it.

    ```bash
    ngrok http 3001
    ```

5.  **Configure AfricasTalking**: Copy the ngrok URL (e.g., `https://abc123xyz.ngrok.io/api/ussd`) and use it as the callback URL for your USSD channel in the AfricasTalking dashboard.
    > **Note:** For the live production environment, the webhook is deployed on Render and the callback URL is `https://afritokeni-mvp.onrender.com/api/ussd`.

## ICP Features Used

*   **Juno**: Used as a comprehensive Backend-as-a-Service (BaaS) to simplify development on the Internet Computer.
*   **Decentralized Datastore**: All application data, including user profiles, balances, and transaction history, is stored on-chain in a decentralized database.
*   **Internet Identity**: Provides secure, passwordless authentication for web application users.
*   **HTTP Outcalls**: A powerful feature that allows the on-chain canister to directly and securely make API calls to external Web 2.0 services. This was essential for integrating with the AfricasTalking API to send SMS messages and respond to USSD requests without needing a centralized server.
*   **On-Chain Hosting**: The frontend assets and canister logic are hosted directly on the Internet Computer, providing a tamper-proof and unstoppable user experience.

## Challenges Faced

A primary challenge was deploying the Node.js webhook server, which interacts with the AfricasTalking API, directly onto Juno/ICP. Due to difficulties in configuring the necessary external API routes and handlers within a canister, we adopted a hybrid approach. The webhook server was deployed to **Render**, a traditional cloud service, which then communicates with our Juno datastore on the Internet Computer.

## Future Plans

Our vision is to make AfriTokeni a cornerstone of financial inclusion in Africa. The following roadmap outlines our plans to transition from a hackathon prototype to a fully operational service.

### Phase 1: MVP Hardening & Security

The immediate priority is to ensure the platform is secure, stable, and ready for a pilot launch.

*   **Comprehensive Security Audit**: Conduct a thorough security review of all components, including the on-chain datastore rules, USSD input validation, and web app authentication flows to protect user funds and data.
*   **Production-Ready Deployment**: Migrate the webhook server from a temporary solution (like Render free tier) to a scalable, production-grade cloud environment. Formalize the deployment process with CI/CD pipelines.
*   **Robust Error Handling & Logging**: Implement comprehensive logging and monitoring for both the on-chain and off-chain components to quickly diagnose and resolve issues in a live environment.
*   **Code Refactoring and Testing**: Refactor prototype code for scalability and maintainability. Implement a full suite of unit, integration, and end-to-end tests to ensure reliability.

### Phase 2: Pilot Program & User Onboarding

Launch a controlled pilot program to gather real-world feedback and validate the service.

*   **Targeted Pilot Launch**: Initiate a pilot program in a specific region or community in Uganda to test the entire ecosystem—from user onboarding to agent cash-in/cash-out.
*   **Develop an Agent Network Strategy**: Create a formal process for recruiting, vetting, training, and managing a network of trusted agents. Develop an **Agent Management Portal** for agents to track their commissions, liquidity, and performance.
*   **Create Onboarding Materials**: Develop simple, clear user guides (both digital and print) for both web and USSD users, explaining how to use the service safely and effectively.
*   **Establish a User Feedback Loop**: Implement mechanisms (e.g., a support hotline, in-app feedback forms) to collect user feedback and rapidly iterate on the product.

### Phase 3: Ecosystem & Compliance

Build the business and legal framework required for sustainable growth.

*   **Regulatory Compliance**: Engage with legal experts to navigate the financial regulations starting with Uganda, ensuring full compliance with local laws for mobile money and digital assets.
*   **Enhanced KYC & Identity**: Integrate with trusted digital identity solutions to streamline the Know Your Customer (KYC) process and enhance security.
*   **Full On-Chain Migration**: Continue to explore advancements in the Internet Computer ecosystem to potentially migrate the webhook logic fully on-chain, further enhancing decentralization and security.
*   **Sustainable Liquidity Model**: Formalize the process for managing the digital asset (stablecoin) and fiat liquidity required to keep the agent network operational.
*   **Cross-Border Remittances**: After establishing a strong local presence, launch a low-cost remittance corridor between two initial countries (e.g., Uganda and Kenya), leveraging the platform's efficiency.



