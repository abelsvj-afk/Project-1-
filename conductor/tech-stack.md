
# Eldoria: Tech Stack

## 1. Frontend Architecture
- **Language**: TypeScript
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS / PostCSS
- **State Management**: Redux Toolkit (with custom middleware for guardrails, logging, and social matrix cascades)

## 2. Backend & Deployment
- **Runtime**: Node.js (v22.x)
- **Deployment Platform**: Fly.io
- **Server**: Custom basic HTTP server (`server.js`) serving static assets.

## 3. Tooling & Infrastructure
- **Observability & Diagnostics**: Sentry (`@sentry/react`, `@sentry/node`) for frontend and backend error tracking.
- **Linting**: ESLint (with `@typescript-eslint`)
- **Package Management**: npm
- **Simulation**: `tsx` for running headless test and simulation scripts (`simulate_*.ts`).
