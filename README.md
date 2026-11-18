# Finance Dashboard — Multi-Bank Ledger & Variance Audit

A personal financial observability system designed to consolidate balances across multiple banking institutions (e.g., Banco Inter, Nubank) into a single real-time ledger while providing an **"Investigate" root-cause audit engine** to trace every balance fluctuation back to the exact institution and transaction.

## Core Architecture & Engineering Decisions

- **Integer-Cents Accounting (`src/domain/ledger.ts`):** All monetary values and deltas are stored and computed strictly as integer cents to prevent IEEE-754 floating-point precision drift.
- **Event-Driven Ledger Trail:** Every inflow (`CREDIT`), outflow (`DEBIT`), and internal transfer (`TRANSFER_IN` / `TRANSFER_OUT`) records both the individual institution balance snapshot and the global consolidated balance snapshot.
- **Variance Investigation Engine (`investigate()`):** Isolates net balance changes over any time window, ranks institutions by signed impact (`primaryDriverBank`), and sorts transactions by absolute financial impact.
- **Privacy & Compliance by Design (LGPD / WCAG AA):** Built around strict data minimization (no bank credentials, account numbers, or national IDs required), zero third-party tracking scripts, and keyboard-first accessibility.

## Tech Stack

- **Domain & Backend:** TypeScript, Node.js, Fastify *(Phase 2)*, Prisma ORM *(Phase 2)*, Zod
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons *(Phase 3)*
- **Testing & Tooling:** Vitest, strict TypeScript (`tsc --noEmit`)

## Getting Started

```bash
# Install dependencies
npm install

# Run static type checking
npm run typecheck

# Run automated unit tests
npm test