# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 16 (App Router, Turbopack) + Convex + Clerk app ("Creatr", package `ai-creator-platform`). See `README.md` for the full architecture and standard scripts.

### Services to run for local development

Two long-running processes are needed. Run each in its own terminal (e.g. a tmux session):

1. Convex backend (local, no account needed):
   `CONVEX_AGENT_MODE=anonymous npx convex dev`
   - Setting `CONVEX_AGENT_MODE=anonymous` is what avoids the interactive Convex login prompt; it runs a local open-source backend at `http://127.0.0.1:3210` and writes `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` into `.env.local` (gitignored). It also watches `convex/` and redeploys functions on change.
   - Set Convex deployment env vars with `npx convex env set <NAME> <VALUE>` (requires the local backend to be running).
2. Next.js dev server: `npm run dev` (serves `http://localhost:3000`).

The frontend reads `NEXT_PUBLIC_CONVEX_URL` from `.env.local`, so start Convex first (or at least before relying on data). `convex/_generated/` is committed, so the frontend can build even before the first `convex dev`.

### Auth (Clerk) — keyless dev mode

Clerk boots in **keyless mode** in development, so the app runs and the landing/feed/public pages work **without any Clerk keys**. However, fully authenticated flows (the `/dashboard/*` area, creating/publishing posts) require real Clerk credentials because Convex must validate a Clerk-issued JWT:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`.
- A Clerk JWT template named `convex` (the Convex/Clerk bridge calls `getToken({ template: "convex" })`).
- `CLERK_JWT_ISSUER_DOMAIN` set on the Convex deployment (`npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-issuer>`), matching `convex/auth.config.js`.

Without these, sign-in still works via the keyless instance but Convex treats the user as unauthenticated, so dashboard mutations fail.

### Other integrations (optional for basic use)

- Google Gemini (AI generate/enhance): needs `GEMINI_API_KEY`.
- ImageKit (image upload/transform): needs `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`.

### Linting gotcha

`npm run lint` is broken: it runs `next lint`, which was removed in Next.js 16 (it misinterprets `lint` as a directory). Run ESLint directly instead: `npx eslint .`

### Seeding data without auth

To exercise the public feed without configuring Clerk, you can insert rows directly into the local Convex backend from a temporary `mutation` in `convex/` and invoke it with `npx convex run <file>:<export>`. The public queries (`convex/feed.js`, `convex/public.js`) require no auth.
