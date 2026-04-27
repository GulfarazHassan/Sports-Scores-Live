# SportScoreTracker

Real-time sports score tracking app with:
- `frontend` (React + Vite + TypeScript)
- `backend` (Node.js + Express + PostgreSQL + Drizzle ORM + WebSocket)

## Features

- View live/scheduled/finished matches
- Watch a specific match and receive:
  - live score updates
  - live commentary feed
- Admin panel to:
  - create matches
  - update scores
  - post commentary
- Match/commentary persistence in PostgreSQL

## Tech Stack

### Frontend
- React 19
- React Router DOM
- Vite
- TypeScript

### Backend
- Node.js (ESM)
- Express 5
- PostgreSQL (`pg`)
- Drizzle ORM + Drizzle Kit
- Zod (validation)
- `ws` (WebSocket realtime updates)
- CORS, dotenv

## Realtime Architecture

- Client connects to `ws://localhost:8000/ws`
- Client subscribes/unsubscribes to match channels
- Server broadcasts:
  - `match_created`
  - `score_update`
  - `commentary`
- Heartbeat/ping-pong logic keeps connections healthy

## Project Structure

- `frontend/` – user UI + admin UI
- `backend/` – REST API + WebSocket server + DB schema + seed scripts
- `docker-compose.yml` – containerized deployment targets

## Prerequisites

- Node.js 18+ (recommended 20+)
- npm
- PostgreSQL database (local or cloud)

## Environment Variables (Backend)

Create `backend/.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require
PORT=8000
HOST=0.0.0.0
API_URL=http://localhost:8000
DELAY_MS=250
MATCH_COUNT=0