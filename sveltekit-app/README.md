# AfriTokeni SvelteKit Frontend

SvelteKit application for the AfriTokeni platform. It integrates with Juno for metadata storage and Internet Identity authentication, while the core financial logic runs on ICP canisters.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Juno CLI (`npm i -g @junobuild/cli`) if you want to run the emulator locally

## Install dependencies

```bash
pnpm install
```

## Running the app

```bash
pnpm run dev
```

The dev server starts on <http://localhost:5173>. The Juno emulator (if used) runs separately on <http://localhost:5866>.

## Juno satellite configuration

Satellite IDs are defined in [`juno.config.ts`](./juno.config.ts). The official Juno Vite plugin reads this file and injects the correct value as `import.meta.env.VITE_SATELLITE_ID` at build time—no manual `.env` wiring is required.

### Development workflow

1. Start the Juno emulator (optional but recommended for local auth/storage work):
   ```bash
   juno emulator start
   ```
2. Visit <http://localhost:5866>, sign in, and create a **Satellite** for development.
3. Copy the generated satellite ID and paste it into the `development` entry in [`juno.config.ts`](./juno.config.ts).
4. Repeat for production if you already have a live satellite (otherwise leave the placeholder todo).

When you run `pnpm run dev`, the plugin detects the dev satellite ID and `+layout.svelte` calls `initSatellite()` with it automatically.

### Switching environments

- **Development (`pnpm run dev`)** → uses `ids.development` from `juno.config.ts` and talks to the emulator when `container` mode is detected.
- **Preview/production builds (`pnpm run build` / hosting)** → uses `ids.production` from `juno.config.ts`.

If you need to override any value (for CI, etc.), you can still set `VITE_SATELLITE_ID` manually, but the default flow should cover most cases.

## Environment variables

The app currently relies on the values supplied by the Juno plugin plus a handful of ICP canister IDs that are sourced inside the codebase. If you introduce new variables, add them with `VITE_` or `PUBLIC_` prefixes and document them here.

## Useful scripts

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start SvelteKit in dev mode |
| `pnpm run build` | Create a production build |
| `pnpm run preview` | Preview the production build locally |

## Project structure highlights

- `src/routes/+layout.svelte` – boots Juno and handles auth redirects.
- `src/lib/stores/auth.ts` – wraps `onAuthStateChange` for the rest of the app.
- `juno.config.ts` – authoritative list of satellite IDs for each mode.
