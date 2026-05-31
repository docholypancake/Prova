# Prova

**GitHub-native manual QA. PR status checks for human testers.**

Prova lets a solo developer run manual test cases against a pull request, mark each
pass/fail/skip/block, and post the result straight to GitHub as a commit status —
`prova/manual-qa: 8/10 passed`. Bugs found during testing sync to GitHub Issues in
one click, and every run produces a shareable, no-login report (plus an SVG badge for
your README).

---

## Features

- **GitHub OAuth login** — sign in with your GitHub account (httpOnly-cookie JWT).
- **Projects → Suites → Cases** — nested test suites; rich cases (ID, feature, type,
  priority, preconditions, test data, steps, expected result, postconditions, rationale, tags).
- **Test runs + execution UI** — pick cases, run them with keyboard shortcuts
  (P / F / S / B), attach screenshots by paste (⌘V → Cloudinary), auto-advance.
- **PR status checks** — completing a run tied to a PR posts a `prova/manual-qa` commit status.
- **Webhooks** — `pull_request.opened` → in-app notification → one-click "create run for PR".
- **Bug → GitHub Issue** — turn a failed case into a labeled Issue with steps, expected vs actual, and screenshot.
- **Shareable reports + badge** — public `/share/:token` report and `/api/badge/:token` SVG.
- **Dashboard** — pass-rate trend, recent runs, open bugs.
- **Light / dark theme** — warm espresso theme with clay + olive accents.

## Tech stack

| Layer    | Tech |
|----------|------|
| Client   | React + Vite + TailwindCSS + React Query + React Router + Recharts |
| Server   | Node.js + Express + Mongoose |
| Database | MongoDB Atlas |
| Auth     | passport-github2 + JWT in httpOnly cookie |
| Media    | Cloudinary (screenshots) |
| GitHub   | @octokit/rest (webhooks, commit statuses, issues) |
| Deploy   | Railway / Render (API) · Vercel (client) |

## Repo layout

```
/server   Express API — models, routes, middleware, utils, Dockerfile
/client   React app — pages, components, contexts, hooks, api
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture decisions, [`ROADMAP.md`](./ROADMAP.md)
for feature tracking, and [`TEST_PLAN.md`](./TEST_PLAN.md) for the endpoint test plan.

---

## Local development

### Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier)
- A GitHub OAuth App
- A Cloudinary account (free tier) — optional, only for screenshot upload

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # fill in the values (see below)
npm run dev            # nodemon on http://localhost:5050
```

`server/.env`:

```
MONGO_URI=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JWT_SECRET=            # any long random string: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CLIENT_URL=http://localhost:5173
WEBHOOK_SECRET=        # random string; used to verify GitHub webhook signatures
WEBHOOK_URL=https://<ngrok-or-prod>/webhooks/github
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
APP_URL=http://localhost:5050
PORT=5050
```

> **GitHub OAuth App** (github.com/settings/developers): set the Authorization callback
> URL to `http://localhost:5050/auth/github/callback`. The app requests `user:email` and
> `repo` scopes (the latter is required for webhooks, statuses, and issues).
>
> **macOS note:** port 5000 is taken by AirPlay Receiver — this project uses **5050**.

### 2. Client

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5050
npm run dev            # Vite on http://localhost:5173
```

### 3. (Optional) Expose webhooks locally

```bash
ngrok http 5050        # put the https URL in WEBHOOK_URL, then reconnect the repo in-app
```

---

## Testing

```bash
cd server
npm run test:smoke     # no DB — boot, route mounting, auth guards, webhook signature
npm test               # full CRUD integration (needs MongoDB; or set TEST_MONGO_URI)
```

API collection for Postman: import `prova.full.postman_collection.json` (49 requests,
every test-plan case) and set the `token` env var to your `prova_token` cookie value.

---

## Deployment

1. Push to GitHub (`.env` is gitignored — keep secrets out of the repo).
2. **API** → Railway or Render: deploy `/server` (Dockerfile auto-detected); set env vars
   from `server/.env.production.example` including `NODE_ENV=production`.
3. **Client** → Vercel: deploy `/client`, set `VITE_API_URL` to the API domain.
4. Update the GitHub OAuth App callback URL and set `APP_URL`, `CLIENT_URL`, `WEBHOOK_URL`
   to the production domains.
5. Reconnect your repo in-app so the webhook registers at the production URL.

---

## License

[MIT](./LICENSE) © 2026 Oleh Blazhko
