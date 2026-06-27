# Rorater API

A production-oriented **Express + TypeScript** backend that powers Rorater, a web app for
searching Roblox users and rating their avatars. It wraps the Roblox platform APIs behind a
clean, cached, rate-limited service layer, adds first-party user accounts via **Roblox OAuth
2.0 (OIDC + PKCE)**, and persists a ratings system with live leaderboards.

The companion frontend (React + TypeScript + Vite) lives in a sibling repo and talks to this
API over a single origin via a dev proxy.

> **Frontend repo:** _<https://github.com/paulp1871/rorater>_

---

## What it does

- **User search & profiles** — search Roblox users by keyword and assemble rich profile
  cards (username, display name, 2D + 3D avatar thumbnails, currently-worn assets), stitched
  together from several Roblox endpoints in one response.
- **Authentication** — "Sign in with Roblox" using OAuth 2.0 / OpenID Connect with PKCE,
  CSRF `state`, and replay-protected `nonce`. Identity is read from the signed ID token, so no
  extra userinfo round-trip is needed.
- **Ratings** — authenticated users rate other users 1–5. Ratings are upserted (one per
  rater/ratee pair), editable, and deletable. Self-rating is rejected.
- **Leaderboards** — public "top rated" (7-day window, minimum-sample filtered) and
  "recently rated" boards, computed with SQL aggregation and enriched with Roblox profile data.

---

## Tech stack

| Concern            | Choice |
| ------------------ | ------ |
| Runtime / language | Node.js, TypeScript (ES modules, strict, no semicolons) |
| HTTP framework     | Express 5 |
| Database           | PostgreSQL (Neon serverless) via Prisma 7 |
| Cache / sessions   | Redis (`node-redis`) |
| Auth               | Roblox OAuth 2.0 / OIDC, PKCE, `jose` for JWT verification |
| External API       | Roblox platform APIs via `rozod` (typed, Zod-validated endpoints) |
| Validation         | Zod (request params/query/body **and** environment) |
| Security           | `helmet`, `cors`, origin checks, Redis-backed `express-rate-limit` |

---

## Architecture

The codebase follows a deliberate, layered request flow that keeps HTTP, business logic, and
external I/O separate:

```
route → controller → service → client / db / store
```

- **`routes/`** — declare paths and compose middleware (auth, validation, rate limiting, origin checks).
- **`controllers/`** — HTTP only: read validated input off `res.locals`, call a service, shape the response.
- **`services/`** — own application behavior: combine Roblox calls, DB aggregates, caching, and token refresh.
- **`clients/`** — talk to external systems (Roblox); no knowledge of Express, sessions, or DB rows.
- **`db/`** — Prisma data access with JSON-safe normalization (BigInt → string, Date → ISO).
- **`stores/`** — Redis-backed state: sessions, OAuth state, OAuth tokens, and the Roblox cache.
- **`middleware/`** — sessions, Zod validation, rate limiting, origin enforcement, and centralized error mapping.

### Data model

Two tables (Prisma + Postgres): `users` keyed by Roblox ID (`BigInt`), and `ratings` with a
unique `(rater_id, rated_id)` constraint and a `(rated_id, created_at)` index that backs the
leaderboard aggregations.

---

## Notable engineering decisions

- **Standards-correct OAuth, server-side.** PKCE verifier, CSRF `state`, and `nonce` are all
  generated server-side and stored in Redis with short TTLs. OAuth `state` is consumed with an
  atomic Redis `GETDEL` so an authorization response can't be replayed. Login is crash-safe: a
  new session and token record are created and verified *before* the previous session is
  deleted, so a failure mid-login never logs the user out.

- **Opaque cookie sessions.** The browser only ever holds a random opaque session ID in an
  HTTP-only cookie; all user data and OAuth access/refresh tokens stay server-side in Redis,
  with TTLs handling expiry. Token refresh is transparent, with a 60s pre-expiry buffer.

- **Caching with stampede protection.** A `withCache` helper serves Roblox data from Redis and
  collapses concurrent misses on the same key into a single in-flight fetch, so a hot key
  expiring doesn't trigger a thundering herd against Roblox. TTLs are tuned per data type
  (profiles 12h, search 4h, leaderboards 60s). Fast-changing rating stats are intentionally
  kept *out* of the cached blob and merged per request, so a new rating shows up immediately
  with no cache-invalidation hook to forget.

- **Resilient upstream calls.** A single `callRoblox` entry point retries transient failures
  (429 + 5xx) with exponential backoff, full jitter, and respect for `Retry-After`, surfacing
  exhausted rate limits as a typed error that the error middleware maps to a clean HTTP status.

- **Defense in depth.** Redis-backed rate limiting (so counters are shared across instances),
  a tighter limiter on auth endpoints, `Origin` checks on every cookie-authenticated mutation
  (CORS alone doesn't stop cross-site form posts), and `helmet` headers.

- **Validated configuration.** Environment variables are parsed through a Zod schema at boot
  that, in production, *enforces* HTTPS on public URLs and TLS (`rediss://`) on Redis since it
  stores plaintext tokens. The server fails fast on a bad config or an unreachable Redis/Postgres.

- **Correct big-integer handling.** Roblox user IDs can exceed `Number.MAX_SAFE_INTEGER`, so
  rating IDs are carried as `BigInt` end to end and normalized to strings at the JSON boundary.

---

## API overview

All routes are mounted under `/api`. Endpoints marked 🔒 require an authenticated session.

### Auth — `/api/auth`
| Method | Path                | Description |
| ------ | ------------------- | ----------- |
| POST   | `/login`            | Begin OAuth; returns the Roblox authorization URL |
| GET    | `/roblox/callback`  | OAuth redirect handler; sets the session cookie |
| GET    | `/me` 🔒            | Current authenticated user |
| POST   | `/logout`           | Destroy the session |

### Roblox — `/api/roblox`
| Method | Path                  | Description |
| ------ | --------------------- | ----------- |
| GET    | `/users/search?keyword=` 🔒 | Search users, with avatar thumbnails |
| GET    | `/users/:id` 🔒       | Full profile: avatars, worn assets, rating stats |

### Ratings — `/api/ratings`
| Method | Path                | Description |
| ------ | ------------------- | ----------- |
| GET    | `/users/:userId` 🔒 | Your rating for a user |
| PUT    | `/users/:userId` 🔒 | Create/update a rating (`{ "score": 1–5 }`) |
| DELETE | `/users/:userId` 🔒 | Remove your rating |

### Leaderboard — `/api/leaderboard` (public)
| Method | Path                | Description |
| ------ | ------------------- | ----------- |
| GET    | `/top?limit=`       | Top-rated users over the last 7 days |
| GET    | `/recent?limit=`    | Most recently rated users |

---

## Running locally

### Prerequisites
- Node.js, a PostgreSQL database, and a Redis instance
- A Roblox OAuth application (client ID/secret, redirect URI)

### Setup
```sh
npm install
npx prisma migrate deploy   # apply the schema
npm run dev                 # start with nodemon
```

### Environment
Configuration is validated by `src/schemas/env.schema.ts`. Provide:

```
NODE_ENV=development
PORT=3000

# Roblox OAuth
CLIENT_ID=...
CLIENT_SECRET=...
REDIRECT_URI=http://localhost:3000/api/auth/roblox/callback
SCOPES=openid profile
FRONTEND_URL=http://localhost:5173

# Infrastructure
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...   # pooled (Neon)
DIRECT_URL=postgresql://...     # direct connection for migrations
```

In production the schema additionally requires HTTPS URLs and a TLS (`rediss://`) Redis URL.

### Scripts
- `npm run dev` — local server with reload (`nodemon`)
- `npm run build` — type-check and compile to `dist/`
- `npm start` — run the compiled server
