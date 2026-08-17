# ForYou Playbook

> See how For You works. Then see how it works for you.

ForYou Playbook is a personal X scorecard. It reads your recent posts under the current For You algorithm, grades them across five dimensions, and gives you five concrete moves to try next. It also includes a Nader-style playground where you can toggle engagement actions on your top posts and watch the score change.

The app was forked from Nader Dabit's [Inside the For You](https://insidetheforyou.com) and extended with X OAuth, a SQLite backend, and an LLM analysis step.

## What it does

1. You connect your X account (reads your posts; writes only the scorecard post you approve).
2. The backend fetches up to your last 100 posts from the current For You regime.
3. It calculates an A-F ForYou Fit profile across five dimensions: Conversation, Travels, Curiosity, Reach, and Momentum.
4. Grok reads the posts and metrics to find three patterns and recommend five moves.
5. You get a shareable public page and a playground for simulating engagement on your top posts.

## Stack

- **Frontend:** Vite + React, Framer Motion
- **Backend:** Hono, TypeScript, better-sqlite3
- **LLM:** xAI / Grok
- **Auth:** X OAuth 2.0 with PKCE
- **Tracking:** Self-hosted Umami (optional)

## Repo structure

```
backend/    Hono API, SQLite, migrations, scan + analysis logic
frontend/   Vite + React app
DEPLOY.md   full production checklist
```

## Local setup

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
# set VITE_API_URL to http://localhost:3000
npm install
npm run dev
```

Open `http://localhost:5173`, click "Generate my scorecard", authorize X, and wait for the scan to finish.

## Environment variables

Backend `.env`:

- `X_CLIENT_ID` and `X_CLIENT_SECRET` from the X Developer Portal
- `X_REDIRECT_URI` must match your X app's callback URL
- `XAI_API_KEY` from xAI
- `TOKEN_ENCRYPTION_KEY` from `openssl rand -hex 32`
- `MAX_POSTS` — posts to fetch per scan
- `MONTHLY_SCAN_BUDGET` — scans allowed per calendar month
- `CURRENT_REGIME_START` — ISO timestamp that marks the current For You regime

Frontend `.env`:

- `VITE_API_URL` — your backend URL
- `VITE_UMAMI_WEBSITE_ID` and `VITE_UMAMI_SRC` — optional self-hosted Umami tracking

## Deploy to production

See [DEPLOY.md](./DEPLOY.md) for the full checklist. The short version:

1. Deploy `backend/` to Railway with a volume at `/app/data`.
2. Deploy `frontend/` to Vercel and point `VITE_API_URL` at Railway.
3. Update your X Developer app callback, website, privacy, and terms URLs to match production.

## Important notes

- X scopes: `tweet.read users.read tweet.write media.write offline.access`. Reads are the product; the only write the app ever makes is your scorecard post, and only when you review it in the composer and tap "Post to X". It never likes, follows, DMs, or acts on its own.
- SQLite is ephemeral on Railway unless you add a volume at `/app/data`.
- The X API has monthly read limits. `MAX_POSTS` and `MONTHLY_SCAN_BUDGET` protect against quota overruns.
- Grok is used for all copy, but the recommendations are grounded in the open-source X ranking weights and the user's own posts.

## Attribution

Forked and extended from [Nader Dabit's `insidetheforyou`](https://github.com/dabit3/insidetheforyou) under MIT. The scoring weights in the playground come from [insidetheforyou.com](https://insidetheforyou.com).
