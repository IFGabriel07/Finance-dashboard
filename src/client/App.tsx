import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { BankAccount, InvestigationReport, LedgerEntry, UserSession } from './types/finance';
import { Navbar } from './components/Navbar';
import { OnboardingView } from './components/OnboardingView';
import { ConsolidatedBalanceCard } from './components/ConsolidatedBalanceCard';
import { InvestigationPanel } from './components/InvestigationPanel';
import { TransactionActionsGrid } from './components/TransactionActionsGrid';
import { LedgerHistoryTable } from './components/LedgerHistoryTable';
import { LegalModal } from './components/LegalModal';

const STORAGE_USER_KEY = 'finance_ledger_user_v1';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [consolidatedCents, setConsolidatedCents] = useState(0);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isInvestigateOpen, setIsInvestigateOpen] = useState(false);
  const [investigation, setInvestigation] = useState<InvestigationReport | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | '7D'>('ALL');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy' | null>(null);

  const loadDashboardData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [accRes, txRes] = await Promise.all([
        fetch('/api/accounts', { headers: { 'x-user-id': userId } }),
        fetch('/api/transactions', { headers: { 'x-user-id': userId } }),
      ]);
      if (!accRes.ok || !txRes.ok) throw new Error('Falha ao carregar dados financeiros.');

      const accData = await accRes.json();
      const txData = await txRes.json();
      setAccounts(accData.accounts);
      setConsolidatedCents(accData.consolidatedBalanceCents);
      setEntries(txData.entries);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao conectar com a API.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const runInvestigation = useCallback(
    async (userId: string, period = filterPeriod, accountId = filterAccountId) => {
      const params = new URLSearchParams();
      if (accountId) params.set('accountId', accountId);

      if (period === 'TODAY') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        params.set('since', start.toISOString());
      } else if (period === '7D') {
        params.set('since', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      }

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/investigate${query}`, { headers: { 'x-user-id': userId } });
      if (res.ok) setInvestigation(await res.json());
    },
    [filterAccountId, filterPeriod]
  );

  useEffect(() => {
    if (user) loadDashboardData(user.id);
  }, [user, loadDashboardData]);

  useEffect(() => {
    if (user && isInvestigateOpen) runInvestigation(user.id, filterPeriod, filterAccountId);
  }, [user, isInvestigateOpen, filterPeriod, filterAccountId, runInvestigation]);

  async function handleCreateUser(payload: {
    name: string;
    email: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
  }) {
    setFeedback(null);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'error', text: data.error || 'Erro ao criar perfil.' });
      return;
    }
    const session: UserSession = { id: data.id, name: data.name, email: data.email };
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session));
    setUser(session);
  }

  async function handleSeedDemo() {
    setLoading(true);
    setFeedback(null);
    try {
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Gabriel Felipe (Demo)',
          email: `demo.${Date.now()}@example.com`,
          acceptedTerms: true,
          acceptedPrivacy: true,
        }),
      });
      const createdUser = await userRes.json();

      const [interRes, nubankRes] = await Promise.all([
        fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': createdUser.id },
          body: JSON.stringify({ bankName: 'Banco Inter', accentColor: '#FF7A00' }),
        }),
        fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': createdUser.id },
          body: JSON.stringify({ bankName: 'Nubank', accentColor: '#820AD1' }),
        }),
      ]);
      const [inter, nubank] = await Promise.all([interRes.json(), nubankRes.json()]);

      const seedEntries = [
        {
          accountId: inter.id,
          type: 'CREDIT',
          amountCents: 50000,
          description: 'Saldo inicial Banco Inter',
          category: 'Depósito Inicial',
        },
        {
          accountId: nubank.id,
          type: 'CREDIT',
          amountCents: 60000,
          description: 'Saldo inicial Nubank',
          category: 'Depósito Inicial',
        },
        {
          accountId: nubank.id,
          type: 'DEBIT',
          amountCents: 18000,
          description: 'Compras semanais no supermercado',
          category: 'Mercado & Alimentação',
        },
        {
          accountId: nubank.id,
          type: 'DEBIT',
          amountCents: 12000,
          description: 'Camisas e calça',
          category: 'Roupas & Vestuário',
        },
      ];

      for (const item of seedEntries) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': createdUser.id },
          body: JSON.stringify(item),
        });
      }

      const session: UserSession = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(session));
      setUser(session);
      setIsInvestigateOpen(true);
      setFeedback({
        type: 'success',
        text: 'Cenário demo carregado com gastos reais em Mercado & Alimentação e Roupas & Vestuário.',
      });
    } catch {
      setFeedback({
        type: 'error',
        text: 'Verifique se a API está ativa em http://localhost:3333.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAccount(bankName: string, accentColor: string) {
    if (!user) return;
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ bankName, accentColor }),
    });
    if (res.ok) {
      setFeedback({ type: 'success', text: 'Instituição bancária adicionada.' });
      await loadDashboardData(user.id);
    }
  }

  async function handleCreateTransaction(payload: {
    accountId: string;
    type: 'CREDIT' | 'DEBIT';
    amountCents: number;
    description: string;
    category: string;
  }) {
    if (!user) return;
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setFeedback({ type: 'success', text: `Lançamento registrado em "${payload.category}".` });
      await loadDashboardData(user.id);
      if (isInvestigateOpen) await runInvestigation(user.id);
    } else {
      const err = await res.json();
      setFeedback({ type: 'error', text: err.error || 'Erro ao registrar lançamento.' });
    }
  }

  async function handleTransfer(payload: {
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
  }) {
    if (!user) return;
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setFeedback({
        type: 'success',
        text: 'Transferência interna concluída sem alterar o saldo consolidado.',
      });
      await loadDashboardData(user.id);
      if (isInvestigateOpen) await runInvestigation(user.id);
    } else {
      const err = await res.json();
      setFeedback({ type: 'error', text: err.error || 'Erro na transferência.' });
    }
  }

  async function handleExportLGPD() {
    if (!user) return;
    const res = await fetch('/api/lgpd/export', { headers: { 'x-user-id': user.id } });
    if (!res.ok) return;
    const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lgpd-portabilidade-${user.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    if (!window.confirm('Apagar todos os seus dados permanentemente conforme a LGPD (Art. 18)?')) {
      return;
    }

    try {
      const res = await fetch('/api/lgpd/account', {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });

      if (res.status === 204 || res.status === 404) {
        handleLogout();
      } else {
        const err = await res.json().catch(() => ({}));
        setFeedback({ type: 'error', text: err.error || 'Não foi possível excluir a conta.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão com a API em localhost:3333.' });
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setAccounts([]);
    setEntries([]);
    setConsolidatedCents(0);
    setInvestigation(null);
    setFeedback(null);
  }

  if (!user) {
    return (
      <>
        <OnboardingView
          loading={loading}
          errorMessage={feedback?.type === 'error' ? feedback.text : null}
          onSeedDemo={handleSeedDemo}
          onCreateUser={handleCreateUser}
          onOpenLegal={setLegalDoc}
        />
        <LegalModal documentType={legalDoc} onClose={() => setLegalDoc(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar
        user={user}
        onExportLGPD={handleExportLGPD}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-6xl w-full flex-1 px-4 py-8 space-y-8">
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-rose-300 bg-rose-50 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Fechar aviso"
              className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <ConsolidatedBalanceCard
          accounts={accounts}
          consolidatedCents={consolidatedCents}
          isInvestigateOpen={isInvestigateOpen}
          onToggleInvestigate={() => setIsInvestigateOpen((prev) => !prev)}
        />

        {isInvestigateOpen && (
          <InvestigationPanel
            accounts={accounts}
            report={investigation}
            filterPeriod={filterPeriod}
            filterAccountId={filterAccountId}
            onChangePeriod={setFilterPeriod}
            onChangeAccount={setFilterAccountId}
          />
        )}

        <TransactionActionsGrid
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onCreateTransaction={handleCreateTransaction}
          onTransfer={handleTransfer}
          onValidationError={(text) => setFeedback({ type: 'error', text })}
        />

        <LedgerHistoryTable entries={entries} />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <p>Finance Ledger &amp; Auditoria • Conformidade LGPD (Lei nº 13.709/2018)</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="font-semibold text-slate-700 hover:text-indigo-700 underline cursor-pointer"
            >
              Termos de Uso
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="font-semibold text-slate-700 hover:text-indigo-700 underline cursor-pointer"
            >
              Política de Privacidade (LGPD)
            </button>
          </div>
        </div>
      </footer>

      <LegalModal documentType={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
}