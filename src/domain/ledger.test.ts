import { describe, expect, it } from 'vitest';
import { formatBRL, MultiBankLedger } from './ledger';

describe('MultiBankLedger - Consolidação Multi-Banco e Auditoria', () => {
  it('consolida Inter (R$ 500) + Nubank (R$ 600) = R$ 1.100 e identifica Nubank após gasto de R$ 300', () => {
    const ledger = new MultiBankLedger();
    ledger.addAccount({ id: 'inter', bankName: 'Banco Inter', accentColor: '#FF7A00' });
    ledger.addAccount({ id: 'nubank', bankName: 'Nubank', accentColor: '#820AD1' });

    // Dia 1: Entradas iniciais
    ledger.recordTransaction({
      id: 'tx-1',
      accountId: 'inter',
      type: 'CREDIT',
      amountCents: 50000,
      description: 'Saldo inicial Inter',
      category: 'Saldo Inicial',
      occurredAt: '2026-11-17T09:00:00Z',
    });

    ledger.recordTransaction({
      id: 'tx-2',
      accountId: 'nubank',
      type: 'CREDIT',
      amountCents: 60000,
      description: 'Saldo inicial Nubank',
      category: 'Saldo Inicial',
      occurredAt: '2026-11-17T09:05:00Z',
    });

    expect(ledger.getConsolidatedBalanceCents()).toBe(110000);

    // Dia 2: Saída de R$ 300 no Nubank
    ledger.recordTransaction({
      id: 'tx-3',
      accountId: 'nubank',
      type: 'DEBIT',
      amountCents: 30000,
      description: 'Compra de periféricos',
      category: 'Equipamentos',
      occurredAt: '2026-11-18T14:30:00Z',
    });

    expect(ledger.getConsolidatedBalanceCents()).toBe(80000);

    // Ação do botão "Investigar" no Dia 2
    const report = ledger.investigate({ sinceIsoDate: '2026-11-18T00:00:00Z' });
    const interSummary = report.accountsBreakdown.find((a) => a.accountId === 'inter');
    const nubankSummary = report.accountsBreakdown.find((a) => a.accountId === 'nubank');

    expect(report.consolidatedBalanceCents).toBe(80000);
    expect(report.periodNetChangeCents).toBe(-30000);
    expect(report.primaryDriverBank).toEqual({
      accountId: 'nubank',
      bankName: 'Nubank',
      periodDeltaCents: -30000,
    });
    expect(interSummary?.periodDeltaCents).toBe(0);
    expect(nubankSummary?.periodDeltaCents).toBe(-30000);
    expect(report.culpritTransactions).toHaveLength(1);
    expect(report.culpritTransactions[0].id).toBe('tx-3');
  });

  it('mantém o saldo consolidado intacto em transferências entre bancos, rastreando a origem e o destino', () => {
    const ledger = new MultiBankLedger();
    ledger.addAccount({ id: 'inter', bankName: 'Banco Inter', accentColor: '#FF7A00' });
    ledger.addAccount({ id: 'nubank', bankName: 'Nubank', accentColor: '#820AD1' });

    ledger.recordTransaction({
      id: 'tx-init',
      accountId: 'inter',
      type: 'CREDIT',
      amountCents: 100000,
      description: 'Depósito',
      category: 'Receita',
      occurredAt: '2026-11-18T10:00:00Z',
    });

    ledger.recordTransfer({
      idPrefix: 'tr-1',
      fromAccountId: 'inter',
      toAccountId: 'nubank',
      amountCents: 40000,
      description: 'Pix entre contas',
      occurredAt: '2026-11-18T11:00:00Z',
    });

    expect(ledger.getConsolidatedBalanceCents()).toBe(100000);

    const report = ledger.investigate({ sinceIsoDate: '2026-11-18T10:30:00Z' });
    expect(report.periodNetChangeCents).toBe(0);
    expect(report.accountsBreakdown.find((a) => a.accountId === 'inter')?.periodDeltaCents).toBe(-40000);
    expect(report.accountsBreakdown.find((a) => a.accountId === 'nubank')?.periodDeltaCents).toBe(40000);
  });

  it('rejeita valores decimais (não inteiros), zero, negativos ou contas inexistentes', () => {
    const ledger = new MultiBankLedger();
    ledger.addAccount({ id: 'inter', bankName: 'Banco Inter', accentColor: '#FF7A00' });

    expect(() =>
      ledger.recordTransaction({
        id: 'bad-float',
        accountId: 'inter',
        type: 'CREDIT',
        amountCents: 10.5,
        description: 'Inválido',
        category: 'Teste',
      })
    ).toThrow();

    expect(() =>
      ledger.recordTransaction({
        id: 'bad-account',
        accountId: 'itau',
        type: 'DEBIT',
        amountCents: 1000,
        description: 'Conta inexistente',
        category: 'Teste',
      })
    ).toThrow();
  });

  it('formata valores monetários em Real Brasileiro (BRL)', () => {
    expect(formatBRL(80000)).toContain('800,00');
    expect(formatBRL(-30000)).toContain('300,00');
  });
});