# ForYou Playbook v0.1

> See how For You works. Then see how it works for you.

## Stack

- **Frontend:** Vite + React (from Nader's *Inside the For You*)
- **Backend:** Hono + better-sqlite3, deployable to Railway
- **Model:** xAI / Grok

## Setup

1. `cp .env.example .env` and fill in your X OAuth credentials, `XAI_API_KEY`, and `TOKEN_ENCRYPTION_KEY`.
2. `cd backend && npm install`
3. `npm run dev` (backend)
4. In another terminal, `cd frontend && npm install && npm run dev`

## Deploy to Railway

1. Create a new Railway project and point it at the `backend/` directory.
2. Add environment variables from `.env` in the Railway dashboard.
3. Set the build command to `npm run build` and start command to `npm start`.
4. Deploy the frontend to Vercel / Cloudflare Pages and set `VITE_API_URL` to your Railway URL.

## Attribution

Frontend forked and extended from [Nader Dabit's `insidetheforyou`](https://github.com/dabit3/insidetheforyou) under MIT (assumed confirmed).
