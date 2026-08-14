# Launch Checklist — ForYou Playbook v0.1

> This is a fast-path guide for launching today.

## 0. Prep secrets

Before anything, rotate the secrets that were accidentally exposed and put the real values in a **local `.env` file** (not `.env.example`):

```sh
cp .env.example .env
```

Fill in:

- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `XAI_API_KEY`
- `TOKEN_ENCRYPTION_KEY` — `openssl rand -hex 32`

## 1. Local smoke test

In one terminal:

```sh
cd backend
npm install
npm run dev
```

In another:

```sh
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:3000
npm run dev
```

Open `http://localhost:5173`, scroll to "Build my ForYou Playbook", click it, authorize X. The scan should run and land on the reveal.

If the scan fails, check the backend logs for xAI or X API errors.

## 2. Backend — Railway

1. Create a Railway project and point the service at the `backend/` directory.
2. Add a **Volume** and mount it at `/app/data` so SQLite persists across deploys.
3. Add these env vars in the Railway dashboard:
   - `DATABASE_URL` — set to `/app/data/foryouplaybook.sqlite`
   - `FRONTEND_URL` — `https://foryouplaybook.com` (or your Vercel URL for staging)
   - `X_CLIENT_ID`
   - `X_CLIENT_SECRET`
   - `X_REDIRECT_URI` — `https://your-railway-domain.com/api/auth/x/callback`
   - `XAI_API_KEY`
   - `XAI_MODEL` — `grok-3-latest` (or current xAI model)
   - `TOKEN_ENCRYPTION_KEY` — 64-char hex
   - `CURRENT_REGIME_START` — `2026-07-31T00:00:00.000Z`
   - `MAX_POSTS` — `200`
4. Nixpacks will run `npm run build` then `npm start`.
5. Wait for the `/health` check to return `ok`.

## 3. X Developer app

Update your X app settings:

- **Callback URI / Redirect URI:** must exactly match `X_REDIRECT_URI`
- **Website URL:** `https://foryouplaybook.com`
- **Privacy Policy:** `https://foryouplaybook.com/?page=privacy`
- **Terms of Service:** `https://foryouplaybook.com/?page=terms`

## 4. Frontend — Vercel

1. Create a Vercel project and point it at the `frontend/` directory.
2. Add env var `VITE_API_URL` — your Railway backend URL, e.g. `https://your-railway-domain.com`
3. Deploy.

## 5. Final checks

- [ ] OAuth redirect completes in production
- [ ] Scan fetches posts and completes
- [ ] Reveal shows archetype, Fit, discoveries, and five moves
- [ ] Share button works and public page renders at `/?p={username}`
- [ ] Delete button removes data
- [ ] Privacy / Terms pages load

## 6. Post-launch

- Set X API spending limit in the X Developer Console.
- Monitor first real scans for cost and output quality.
- Iterate the LLM prompt in `backend/src/analysis.ts` based on real results.
