# AfriTokeni MVP

SMS-based financial system built on Internet Computer Protocol (ICP) for Uganda's unbanked population.

## Overview

AfriTokeni provides banking services via SMS for feature phones and web interface for smartphones, targeting Uganda's 14.6M unbanked adults with 83% lower costs than traditional mobile money.

## 🧭 Getting Started

**IMPORTANT:** This app requires Juno's local development environment for ICP authentication to work.

### 1. Start the Juno development emulator (REQUIRED)

**You MUST run this first** - the ICP authentication will not work without it:

```bash
juno dev start
```

This starts the local ICP blockchain emulator and Internet Identity service at `localhost:8000`.

### 2. Create a Satellite

Your project needs a Satellite. Create one to connect your app for development.

👉 [Open the Juno Console](http://localhost:5866)

### 3. Configure your project

Set the Satellite ID in your `juno.config.ts` file:

```ts
import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "<DEV_SATELLITE_ID>",
    },
    source: "dist",
    predeploy: ["npm run build"],
  },
});
```

### 4. Start the frontend dev server

In another terminal, start your app's dev server:

```bash
npm run dev
```

### 5. Create required Datastore collections

AfriTokeni needs these collections in the Datastore:
- `users` - User profiles and authentication data
- `transactions` - Transaction history
- `balances` - User account balances

👉 [Go to Datastore](http://localhost:5866/datastore)

### 6. Test the application

- **Web Authentication**: Click "Sign in with Internet Identity" on the landing page
- **SMS Banking**: Use the "📱 Access SMS Banking" for feature phone simulation

**Note**: Make sure `juno dev start` is running or authentication will fail with connection errors.

## 🛰️ Production

Ready to go live?

Just like for local development, you'll need to create a Satellite — but this time on the mainnet [Console](https://console.juno.build). Then, update your `juno.config.ts` with the new Satellite ID:

```ts
import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "<DEV_SATELLITE_ID>",
      production: "<PROD_SATELLITE_ID>",
    },
    source: "dist",
    predeploy: ["npm run build"],
  },
});
```

Check out the full guides in the [docs](https://juno.build/docs/category/deployment).

## ✨ Links & Resources

- Looking to get started with Juno? Check out the [documentation](https://juno.build).
- Have a look at [React](https://react.dev) for question regarding the templates.
- Got questions, comments or feedback? [Join our discord](https://discord.gg/wHZ57Z2RAG) or [OpenChat](https://oc.app/community/vxgpi-nqaaa-aaaar-ar4lq-cai/?ref=xanzv-uaaaa-aaaaf-aneba-cai).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command          | Action                                                      |
| :--------------- | :---------------------------------------------------------- |
| `npm install`    | Installs dependencies                                       |
| `npm run dev`    | Starts frontend dev server at `localhost:5173`              |
| `juno dev start` | Quickstart the local development emulator |
| `npm run build`  | Build your production site to `./dist/`                     |
| `juno deploy`    | Deploy your project to a Satellite                          |

## 🚀 Launch

Explore this [guide](https://juno.build/docs/add-juno-to-an-app/create-a-satellite) to launch your Satellite into orbit via Juno's [administration console](https://console.juno.build).
