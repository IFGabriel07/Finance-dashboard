# Finance Dashboard — Multi-Bank Ledger & Variance Audit

A personal financial observability system designed to consolidate balances across multiple banking institutions (e.g., Banco Inter, Nubank) into a single real-time ledger while providing an **"Investigate" root-cause audit engine** to trace every balance fluctuation back to the exact institution and transaction.

## Core Architecture & Engineering Decisions

- **Integer-Cents Accounting (`src/domain/ledger.ts`):** All monetary values and deltas are stored and computed strictly as integer cents to prevent IEEE-754 floating-point precision drift.
- **Event-Driven Ledger Trail (`prisma/schema.prisma`):** Every inflow (`CREDIT`), outflow (`DEBIT`), and internal transfer (`TRANSFER_IN` / `TRANSFER_OUT`) records atomic snapshots of both the individual institution balance and the global consolidated balance.
- **Variance Investigation Engine (`GET /api/investigate`):** Isolates net balance changes over any time window, ranks institutions by signed impact (`primaryDriverBank`), and sorts transactions by absolute financial impact.
- **Privacy & Compliance by Design (LGPD / WCAG AA):** Enforces `userId` tenant isolation on all database queries, explicit consent timestamps, Art. 18 JSON data export (`GET /api/lgpd/export`), full account erasure (`DELETE /api/lgpd/account`), and zero third-party tracking scripts.

## Tech Stack

- **Domain & Backend:** TypeScript, Node.js, Fastify, Prisma ORM (SQLite), Zod
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons *(Phase 3)*
- **Testing & Tooling:** Vitest, strict TypeScript (`tsc --noEmit`)

## Getting Started

```bash
# Install dependencies
npm install

# Apply database migrations
npx prisma migrate dev

# Run static type checking
npm run typecheck

# Run automated unit and API integration tests
npm test

# Start the REST API server on http://localhost:3333
npm run dev:api