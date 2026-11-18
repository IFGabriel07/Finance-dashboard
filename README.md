# Finance Dashboard

Personal finance app to track balances across multiple bank accounts, categorize expenses, and see how each transaction affects your overall balance.

## What it does

- **Multi-bank overview:** Tracks individual bank balances alongside your combined total (`Saldo Geral`) using integer-cents math to avoid floating-point rounding bugs.
- **Transactions & transfers:** Log income, expenses (with preset or custom categories), and internal transfers between banks without changing the total balance.
- **Balance impact analysis:** Filter movements by period, bank, or category to see which account and spending category weighed most on your balance.
- **LGPD compliance:** Explicit consent checkboxes with Terms and Privacy modals, full JSON data export, and permanent account deletion.

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Fastify, Prisma (SQLite), Zod
- **Tests:** Vitest

## Project structure

```text
  prisma/          # SQLite schema and migrations
  src/
  domain/        # Core ledger rules (integer cents) and unit tests
  server/        # Fastify API routes, Zod schemas, and integration tests
  client/        # React components, types, and BRL currency formatters
```

## Running locally

```bash
npm install
npx prisma migrate dev

# Run tests and typecheck
npm test
npm run typecheck

# Terminal 1 — API (http://localhost:3333)
npm run dev:api

# Terminal 2 — Frontend (http://localhost:5173)
npm run dev:web
```