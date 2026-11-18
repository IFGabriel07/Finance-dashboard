import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { BankAccount } from '../types/finance';
import { formatBRL } from '../utils/format';

interface ConsolidatedBalanceCardProps {
  accounts: BankAccount[];
  consolidatedCents: number;
  isInvestigateOpen: boolean;
  onToggleInvestigate: () => void;
}

export function ConsolidatedBalanceCard({
  accounts,
  consolidatedCents,
  isInvestigateOpen,
  onToggleInvestigate,
}: ConsolidatedBalanceCardProps) {
  return (
    <section
      aria-labelledby="consolidated-heading"
      className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p
            id="consolidated-heading"
            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Saldo Geral ({accounts.length}{' '}
            {accounts.length === 1 ? 'conta' : 'contas'})
          </p>
          <p className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums">
            {formatBRL(consolidatedCents)}
          </p>
          <p className="mt-2 text-xs text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Cálculo exato • Histórico protegido contra alterações
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleInvestigate}
          aria-expanded={isInvestigateOpen}
          aria-controls="investigation-panel"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-bold text-slate-950 hover:bg-amber-300 transition cursor-pointer shadow-sm"
        >
          <Search className="w-4 h-4" aria-hidden="true" />
          {isInvestigateOpen ? 'Fechar Análise' : 'Analisar Saldo'}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="rounded-xl bg-slate-800/90 border border-slate-700 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0"
                style={{ backgroundColor: acc.accentColor }}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-white">{acc.bankName}</p>
                <p className="text-xs text-slate-300">Conta corrente</p>
              </div>
            </div>
            <p className="text-base font-bold tabular-nums text-white">
              {formatBRL(acc.balanceCents)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}