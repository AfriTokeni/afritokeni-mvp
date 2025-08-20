import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "atbka-rp777-77775-aaaaq-cai"
    },
    source: "dist",
    predeploy: ["npm run build"],
  },
  emulator:{
    runner:{
      type: "docker",
    },
    skylab: {}
  }
});