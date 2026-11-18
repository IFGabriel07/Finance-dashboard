export interface UserSession {
  id: string;
  name: string;
  email: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accentColor: string;
  balanceCents: number;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amountCents: number;
  signedDeltaCents: number;
  description: string;
  category: string;
  occurredAt: string;
  accountBalanceAfterCents: number;
  consolidatedBalanceAfterCents: number;
  account?: {
    bankName: string;
    accentColor: string;
  };
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
  accountsBreakdown: Array<{
    accountId: string;
    bankName: string;
    accentColor: string;
    currentBalanceCents: number;
    periodDeltaCents: number;
    contributionPercentage: number;
    transactionCount: number;
  }>;
  culpritTransactions: Array<{
    id: string;
    accountId: string;
    bankName: string;
    type: string;
    amountCents: number;
    signedDeltaCents: number;
    description: string;
    category: string;
    occurredAt: string;
    accountBalanceAfterCents: number;
    consolidatedBalanceAfterCents: number;
  }>;
}