import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "a5dhi-k7777-77775-aaabq-cai",
      production: "a5dhi-k7777-77775-aaabq-cai"
    },
    source: "dist",
    predeploy: ["npm run build"],
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
        {
          collection: "email_subscriptions",
          read: "public",
          write: "public",
          memory: "stable",
        },
        {
          collection: "kyc_submissions",
          read: "managed",
          write: "managed",
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
        {
          collection: "kyc_documents",
          read: "public",
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