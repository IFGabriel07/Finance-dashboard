import { randomUUID } from 'node:crypto';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});

const createAccountSchema = z.object({
  bankName: z.string().min(2).max(60),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(['CREDIT', 'DEBIT']),
  amountCents: z.number().int().positive(),
  description: z.string().min(1).max(160),
  category: z.string().min(1).max(60),
  occurredAt: z.string().datetime().optional(),
});

const createTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountCents: z.number().int().positive(),
  description: z.string().min(1).max(160).optional(),
  occurredAt: z.string().datetime().optional(),
});

const listTransactionsQuerySchema = z.object({
  accountId: z.string().optional(),
});

const investigateQuerySchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  accountId: z.string().optional(),
});

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

function getAuthenticatedUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'];
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new HttpError(401, 'Cabeçalho x-user-id obrigatório para autenticação.');
  }
  return userId.trim();
}

export function buildApp(prisma = new PrismaClient()): FastifyInstance {
  const app = Fastify({ logger: false });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: error.message });
    }
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        error: 'Dados de entrada inválidos.',
        details: error.flatten(),
      });
    }
    return reply.status(500).send({ error: 'Erro interno do servidor.' });
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.post('/api/users', async (request, reply) => {
    const body = createUserSchema.parse(request.body);
    const now = new Date();

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase().trim(),
        name: body.name.trim(),
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
    });

    return reply.status(201).send(user);
  });

  app.post('/api/accounts', async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const body = createAccountSchema.parse(request.body);

    const account = await prisma.bankAccount.create({
      data: {
        userId,
        bankName: body.bankName.trim(),
        accentColor: body.accentColor,
      },
    });

    return reply.status(201).send(account);
  });

  app.get('/api/accounts', async (request) => {
    const userId = getAuthenticatedUserId(request);
    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const consolidatedBalanceCents = accounts.reduce(
      (sum: number, acc) => sum + acc.balanceCents,
      0
    );

    return { consolidatedBalanceCents, accounts };
  });

  app.get('/api/transactions', async (request) => {
    const userId = getAuthenticatedUserId(request);
    const query = listTransactionsQuerySchema.parse(request.query);

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        userId,
        ...(query.accountId ? { accountId: query.accountId } : {}),
      },
      include: {
        account: { select: { bankName: true, accentColor: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });

    return { entries };
  });

  app.post('/api/transactions', async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const body = createTransactionSchema.parse(request.body);

    const entry = await prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findFirst({
        where: { id: body.accountId, userId },
      });

      if (!account) {
        throw new HttpError(404, 'Conta bancária não encontrada para este utilizador.');
      }

      const signedDeltaCents =
        body.type === 'CREDIT' ? body.amountCents : -body.amountCents;

      const updatedAccount = await tx.bankAccount.update({
        where: { id: account.id },
        data: { balanceCents: account.balanceCents + signedDeltaCents },
      });

      const allAccounts = await tx.bankAccount.findMany({
        where: { userId },
        select: { balanceCents: true },
      });

      const consolidatedBalanceAfterCents = allAccounts.reduce(
        (sum: number, item) => sum + item.balanceCents,
        0
      );

      return tx.ledgerEntry.create({
        data: {
          userId,
          accountId: account.id,
          type: body.type,
          amountCents: body.amountCents,
          signedDeltaCents,
          description: body.description.trim(),
          category: body.category.trim(),
          occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
          accountBalanceAfterCents: updatedAccount.balanceCents,
          consolidatedBalanceAfterCents,
        },
      });
    });

    return reply.status(201).send(entry);
  });

  app.post('/api/transfers', async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    const body = createTransferSchema.parse(request.body);

    if (body.fromAccountId === body.toAccountId) {
      throw new HttpError(400, 'As contas de origem e destino devem ser diferentes.');
    }

    const transferGroupId = randomUUID();
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    const label = body.description?.trim() || 'Transferência entre contas';

    const result = await prisma.$transaction(async (tx) => {
      const [fromAccount, toAccount] = await Promise.all([
        tx.bankAccount.findFirst({ where: { id: body.fromAccountId, userId } }),
        tx.bankAccount.findFirst({ where: { id: body.toAccountId, userId } }),
      ]);

      if (!fromAccount || !toAccount) {
        throw new HttpError(404, 'Uma ou ambas as contas não pertencem a este utilizador.');
      }

      const updatedFrom = await tx.bankAccount.update({
        where: { id: fromAccount.id },
        data: { balanceCents: fromAccount.balanceCents - body.amountCents },
      });

      const updatedTo = await tx.bankAccount.update({
        where: { id: toAccount.id },
        data: { balanceCents: toAccount.balanceCents + body.amountCents },
      });

      const allAccounts = await tx.bankAccount.findMany({
        where: { userId },
        select: { balanceCents: true },
      });

      const consolidatedBalanceAfterCents = allAccounts.reduce(
        (sum: number, item) => sum + item.balanceCents,
        0
      );

      const debitEntry = await tx.ledgerEntry.create({
        data: {
          userId,
          accountId: fromAccount.id,
          type: 'TRANSFER_OUT',
          amountCents: body.amountCents,
          signedDeltaCents: -body.amountCents,
          description: label,
          category: 'Transferência Interna',
          occurredAt,
          transferGroupId,
          accountBalanceAfterCents: updatedFrom.balanceCents,
          consolidatedBalanceAfterCents,
        },
      });

      const creditEntry = await tx.ledgerEntry.create({
        data: {
          userId,
          accountId: toAccount.id,
          type: 'TRANSFER_IN',
          amountCents: body.amountCents,
          signedDeltaCents: body.amountCents,
          description: label,
          category: 'Transferência Interna',
          occurredAt,
          transferGroupId,
          accountBalanceAfterCents: updatedTo.balanceCents,
          consolidatedBalanceAfterCents,
        },
      });

      return { transferGroupId, debitEntry, creditEntry };
    });

    return reply.status(201).send(result);
  });

  app.get('/api/investigate', async (request) => {
    const userId = getAuthenticatedUserId(request);
    const query = investigateQuerySchema.parse(request.query);

    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const entries = await prisma.ledgerEntry.findMany({
      where: {
        userId,
        ...(query.accountId ? { accountId: query.accountId } : {}),
        ...(query.since || query.until
          ? {
              occurredAt: {
                ...(query.since ? { gte: new Date(query.since) } : {}),
                ...(query.until ? { lte: new Date(query.until) } : {}),
              },
            }
          : {}),
      },
      include: { account: { select: { bankName: true } } },
    });

    const consolidatedBalanceCents = accounts.reduce(
      (sum: number, acc) => sum + acc.balanceCents,
      0
    );
    const periodNetChangeCents = entries.reduce(
      (sum: number, entry) => sum + entry.signedDeltaCents,
      0
    );

    const positiveTotalCents = accounts.reduce(
      (sum: number, acc) => sum + Math.max(0, acc.balanceCents),
      0
    );

    const accountsBreakdown = accounts.map((acc) => {
      const accountEntries = entries.filter((e) => e.accountId === acc.id);
      const periodDeltaCents = accountEntries.reduce(
        (sum: number, e) => sum + e.signedDeltaCents,
        0
      );
      const contributionPercentage =
        positiveTotalCents > 0 && acc.balanceCents > 0
          ? Number(((acc.balanceCents / positiveTotalCents) * 100).toFixed(2))
          : 0;

      return {
        accountId: acc.id,
        bankName: acc.bankName,
        accentColor: acc.accentColor,
        currentBalanceCents: acc.balanceCents,
        periodDeltaCents,
        contributionPercentage,
        transactionCount: accountEntries.length,
      };
    });

    const sortedDrivers = [...accountsBreakdown]
      .filter((item) => item.periodDeltaCents !== 0)
      .sort((a, b) => Math.abs(b.periodDeltaCents) - Math.abs(a.periodDeltaCents));

    const primaryDriverBank =
      sortedDrivers.length > 0
        ? {
            accountId: sortedDrivers[0].accountId,
            bankName: sortedDrivers[0].bankName,
            periodDeltaCents: sortedDrivers[0].periodDeltaCents,
          }
        : null;

    const culpritTransactions = [...entries]
      .sort((a, b) => Math.abs(b.signedDeltaCents) - Math.abs(a.signedDeltaCents))
      .map((entry) => ({
        id: entry.id,
        accountId: entry.accountId,
        bankName: entry.account.bankName,
        type: entry.type,
        amountCents: entry.amountCents,
        signedDeltaCents: entry.signedDeltaCents,
        description: entry.description,
        category: entry.category,
        occurredAt: entry.occurredAt.toISOString(),
        accountBalanceAfterCents: entry.accountBalanceAfterCents,
        consolidatedBalanceAfterCents: entry.consolidatedBalanceAfterCents,
      }));

    return {
      generatedAt: new Date().toISOString(),
      consolidatedBalanceCents,
      periodNetChangeCents,
      primaryDriverBank,
      accountsBreakdown,
      culpritTransactions,
    };
  });

  app.get('/api/lgpd/export', async (request) => {
    const userId = getAuthenticatedUserId(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true, entries: true },
    });

    if (!user) {
      throw new HttpError(404, 'Utilizador não encontrado.');
    }

    return {
      exportedAt: new Date().toISOString(),
      legalBasis: 'LGPD Art. 18 - Portabilidade e acesso aos dados pessoais',
      user,
    };
  });

  app.delete('/api/lgpd/account', async (request, reply) => {
    const userId = getAuthenticatedUserId(request);
    await prisma.user.delete({ where: { id: userId } });
    return reply.status(204).send();
  });

  return app;
}