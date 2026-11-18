export type EntryType = 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface BankAccount {
  id: string;
  bankName: string;
  accentColor: string;
  balanceCents: number;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  bankName: string;
  type: EntryType;
  amountCents: number;
  signedDeltaCents: number;
  description: string;
  category: string;
  occurredAt: string;
  transferGroupId?: string;
  accountBalanceAfterCents: number;
  consolidatedBalanceAfterCents: number;
}

export interface InvestigationFilter {
  sinceIsoDate?: string;
  untilIsoDate?: string;
  accountId?: string;
}

export interface AccountInvestigationSummary {
  accountId: string;
  bankName: string;
  accentColor: string;
  currentBalanceCents: number;
  periodDeltaCents: number;
  contributionPercentage: number;
  transactionCount: number;
}

export interface InvestigationReport {
  generatedAt: string;
  consolidatedBalanceCents: number;
  periodNetChangeCents: number;
  primaryDriverBank: {
    accountId: string;
    bankName: string;
    periodDeltaCents: number;
  } | null;
  accountsBreakdown: AccountInvestigationSummary[];
  culpritTransactions: LedgerEntry[];
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export class MultiBankLedger {
  private accounts = new Map<string, BankAccount>();
  private entries: LedgerEntry[] = [];

  addAccount(params: {
    id: string;
    bankName: string;
    accentColor: string;
    createdAt?: string;
  }): BankAccount {
    if (this.accounts.has(params.id)) {
      throw new Error(`Conta já cadastrada com o identificador: ${params.id}`);
    }

    const account: BankAccount = {
      id: params.id,
      bankName: params.bankName.trim(),
      accentColor: params.accentColor,
      balanceCents: 0,
      createdAt: params.createdAt ?? new Date().toISOString(),
    };

    this.accounts.set(account.id, account);
    return { ...account };
  }

  getAccounts(): BankAccount[] {
    return Array.from(this.accounts.values()).map((acc) => ({ ...acc }));
  }

  getEntries(): LedgerEntry[] {
    return this.entries.map((entry) => ({ ...entry }));
  }

  getConsolidatedBalanceCents(): number {
    let total = 0;
    for (const account of this.accounts.values()) {
      total += account.balanceCents;
    }
    return total;
  }

  recordTransaction(params: {
    id: string;
    accountId: string;
    type: 'CREDIT' | 'DEBIT';
    amountCents: number;
    description: string;
    category: string;
    occurredAt?: string;
  }): LedgerEntry {
    return this.appendEntry({
      ...params,
      type: params.type,
    });
  }

  /**
   * Registra movimentação entre dois bancos do mesmo usuário (ex: Inter -> Nubank).
   * Atualiza os saldos individuais sem alterar o saldo consolidado global.
   */
  recordTransfer(params: {
    idPrefix: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    description?: string;
    occurredAt?: string;
  }): { debitEntry: LedgerEntry; creditEntry: LedgerEntry } {
    if (params.fromAccountId === params.toAccountId) {
      throw new Error('As contas de origem e destino devem ser diferentes.');
    }

    const occurredAt = params.occurredAt ?? new Date().toISOString();
    const label = params.description?.trim() || 'Transferência entre contas';

    const debitEntry = this.appendEntry({
      id: `${params.idPrefix}-out`,
      accountId: params.fromAccountId,
      type: 'TRANSFER_OUT',
      amountCents: params.amountCents,
      description: label,
      category: 'Transferência Interna',
      occurredAt,
      transferGroupId: params.idPrefix,
    });

    const creditEntry = this.appendEntry({
      id: `${params.idPrefix}-in`,
      accountId: params.toAccountId,
      type: 'TRANSFER_IN',
      amountCents: params.amountCents,
      description: label,
      category: 'Transferência Interna',
      occurredAt,
      transferGroupId: params.idPrefix,
    });

    return { debitEntry, creditEntry };
  }

  /**
   * Acionado pelo botão "Investigar": identifica qual instituição financeira
   * e quais transações provocaram a variação no saldo consolidado.
   */
  investigate(filter: InvestigationFilter = {}): InvestigationReport {
    const filtered = this.entries.filter((entry) => {
      if (filter.sinceIsoDate && entry.occurredAt < filter.sinceIsoDate) {
        return false;
      }
      if (filter.untilIsoDate && entry.occurredAt > filter.untilIsoDate) {
        return false;
      }
      if (filter.accountId && entry.accountId !== filter.accountId) {
        return false;
      }
      return true;
    });

    const consolidatedBalanceCents = this.getConsolidatedBalanceCents();
    const periodNetChangeCents = filtered.reduce(
      (sum, entry) => sum + entry.signedDeltaCents,
      0
    );

    const positiveTotalCents = Array.from(this.accounts.values()).reduce(
      (sum, acc) => sum + Math.max(0, acc.balanceCents),
      0
    );

    const accountsBreakdown: AccountInvestigationSummary[] = Array.from(
      this.accounts.values()
    ).map((account) => {
      const accountEntries = filtered.filter((e) => e.accountId === account.id);
      const periodDeltaCents = accountEntries.reduce(
        (sum, e) => sum + e.signedDeltaCents,
        0
      );

      const contributionPercentage =
        positiveTotalCents > 0 && account.balanceCents > 0
          ? Number(((account.balanceCents / positiveTotalCents) * 100).toFixed(2))
          : 0;

      return {
        accountId: account.id,
        bankName: account.bankName,
        accentColor: account.accentColor,
        currentBalanceCents: account.balanceCents,
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

    const culpritTransactions = [...filtered].sort((a, b) => {
      const impactDiff = Math.abs(b.signedDeltaCents) - Math.abs(a.signedDeltaCents);
      if (impactDiff !== 0) return impactDiff;
      return b.occurredAt.localeCompare(a.occurredAt);
    });

    return {
      generatedAt: new Date().toISOString(),
      consolidatedBalanceCents,
      periodNetChangeCents,
      primaryDriverBank,
      accountsBreakdown,
      culpritTransactions,
    };
  }

  private appendEntry(params: {
    id: string;
    accountId: string;
    type: EntryType;
    amountCents: number;
    description: string;
    category: string;
    occurredAt?: string;
    transferGroupId?: string;
  }): LedgerEntry {
    if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
      throw new Error('O valor da transação deve ser um inteiro positivo em centavos.');
    }

    const account = this.accounts.get(params.accountId);
    if (!account) {
      throw new Error(`Conta bancária não encontrada: ${params.accountId}`);
    }

    const isPositive = params.type === 'CREDIT' || params.type === 'TRANSFER_IN';
    const signedDeltaCents = isPositive ? params.amountCents : -params.amountCents;

    account.balanceCents += signedDeltaCents;
    const consolidatedBalanceAfterCents = this.getConsolidatedBalanceCents();

    const entry: LedgerEntry = {
      id: params.id,
      accountId: account.id,
      bankName: account.bankName,
      type: params.type,
      amountCents: params.amountCents,
      signedDeltaCents,
      description: params.description.trim(),
      category: params.category.trim(),
      occurredAt: params.occurredAt ?? new Date().toISOString(),
      transferGroupId: params.transferGroupId,
      accountBalanceAfterCents: account.balanceCents,
      consolidatedBalanceAfterCents,
    };

    this.entries.push(entry);
    return { ...entry };
  }
}