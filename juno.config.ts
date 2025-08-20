import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "atbka-rp777-77775-aaaaq-cai",
    },
    source: "dist",
    predeploy: ["npm run build"],
    collections: {
      datastore: [
        {
          collection: "users",
          read: "managed",
          write: "managed",
          memory: "stable",
        },
        {
          collection: "transactions",
          read: "managed",
          write: "managed",
          memory: "stable",
        },
        {
          collection: "balances",
          read: "managed",
          write: "managed",
          memory: "stable",
        },
        {
          collection: "agents",
          read: "managed",
          write: "managed",
          memory: "stable",
        },
        {
          collection: "sms_messages",
          read: "managed",
          write: "managed",
          memory: "stable",
        },
        {
          collection: "notes",
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
      ],
    },
  },
  emulator: {
    runner: {
      type: "docker",
    },
    satellite: {},
  },
});