import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { buildApp } from './app';

const prisma = new PrismaClient();
const app = buildApp(prisma);

describe('API REST & Conformidade LGPD', () => {
  beforeEach(async () => {
    await prisma.ledgerEntry.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('persiste Inter + Nubank, investiga queda de R$ 300 e executa portabilidade/exclusão LGPD', async () => {
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'gabriel@example.com',
        name: 'Gabriel Felipe',
        acceptedTerms: true,
        acceptedPrivacy: true,
      },
    });
    expect(userRes.statusCode).toBe(201);
    const user = userRes.json();

    const interRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { 'x-user-id': user.id },
      payload: { bankName: 'Banco Inter', accentColor: '#FF7A00' },
    });
    const nubankRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { 'x-user-id': user.id },
      payload: { bankName: 'Nubank', accentColor: '#820AD1' },
    });
    const inter = interRes.json();
    const nubank = nubankRes.json();

    await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: { 'x-user-id': user.id },
      payload: {
        accountId: inter.id,
        type: 'CREDIT',
        amountCents: 50000,
        description: 'Saldo inicial Inter',
        category: 'Depósito',
        occurredAt: '2026-11-17T10:00:00.000Z',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: { 'x-user-id': user.id },
      payload: {
        accountId: nubank.id,
        type: 'CREDIT',
        amountCents: 60000,
        description: 'Saldo inicial Nubank',
        category: 'Depósito',
        occurredAt: '2026-11-17T10:05:00.000Z',
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: { 'x-user-id': user.id },
      payload: {
        accountId: nubank.id,
        type: 'DEBIT',
        amountCents: 30000,
        description: 'Compra equipamento',
        category: 'Operacional',
        occurredAt: '2026-11-18T14:00:00.000Z',
      },
    });

    const invRes = await app.inject({
      method: 'GET',
      url: '/api/investigate?since=2026-11-18T00:00:00.000Z',
      headers: { 'x-user-id': user.id },
    });
    expect(invRes.statusCode).toBe(200);
    const report = invRes.json();
    expect(report.consolidatedBalanceCents).toBe(80000);
    expect(report.primaryDriverBank.bankName).toBe('Nubank');
    expect(report.primaryDriverBank.periodDeltaCents).toBe(-30000);

    const exportRes = await app.inject({
      method: 'GET',
      url: '/api/lgpd/export',
      headers: { 'x-user-id': user.id },
    });
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.json().user.entries).toHaveLength(3);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: '/api/lgpd/account',
      headers: { 'x-user-id': user.id },
    });
    expect(deleteRes.statusCode).toBe(204);
  });

  it('bloqueia acesso de outro utilizador às contas registadas (proteção anti-IDOR)', async () => {
    const ownerRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'owner@example.com',
        name: 'Owner',
        acceptedTerms: true,
        acceptedPrivacy: true,
      },
    });
    const attackerRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: {
        email: 'attacker@example.com',
        name: 'Attacker',
        acceptedTerms: true,
        acceptedPrivacy: true,
      },
    });

    const accountRes = await app.inject({
      method: 'POST',
      url: '/api/accounts',
      headers: { 'x-user-id': ownerRes.json().id },
      payload: { bankName: 'Banco Inter', accentColor: '#FF7A00' },
    });

    const hijackRes = await app.inject({
      method: 'POST',
      url: '/api/transactions',
      headers: { 'x-user-id': attackerRes.json().id },
      payload: {
        accountId: accountRes.json().id,
        type: 'DEBIT',
        amountCents: 10000,
        description: 'Tentativa indevida',
        category: 'Teste',
      },
    });

    expect(hijackRes.statusCode).toBe(404);
  });
});