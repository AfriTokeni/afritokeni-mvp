import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: process.env.VITE_DEVELOPMENT_JUNO_SATELLITE_ID,
      production: process.env.VITE_PRODUCTION_JUNO_SATELLITE_ID
    },
    source: "dist",
    predeploy: ["npm run build","npm run build:backend"],
    postdeploy: ["npm run start:backend"],
    collections: {
      datastore: [
        {
          collection: "users",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "transactions",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "balances",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "agents",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "user_roles",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "sms_messages",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "notes",
          read: "public",
          write: "public",
          memory: "stable",
        },
      ],
      storage: [
        {
          collection: "images",
          read: "managed",
          write: "managed",
          memory: "stable",
        },
      ],
    },
  },
  emulator: {
    runner: {
      type: "docker",
    },
    skylab: {},
  },
});