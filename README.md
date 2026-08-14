# ForYou Playbook v0.1

## Stack

- **Frontend:** Vite + React (from Nader's *Inside the For You*)
- **Backend:** Hono + better-sqlite3, deployable to Railway
- **Model:** xAI / Grok

## Setup

1. `cp .env.example .env` and fill in your X OAuth credentials, `XAI_API_KEY`, and `TOKEN_ENCRYPTION_KEY`.
2. `cd backend && npm install`
3. `npm run dev` (backend)
4. In another terminal, `cd frontend && npm install && npm run dev`

## Attribution

Frontend forked from [Nader Dabit's `insidetheforyou`](https://github.com/dabit3/insidetheforyou) under MIT (assumed confirmed).
