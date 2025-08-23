import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "atbka-rp777-77775-aaaaq-cai"
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