import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { LedgerEntry } from '../types/finance';
import { formatBRL, formatSignedBRL } from '../utils/format';

interface LedgerHistoryTableProps {
  entries: LedgerEntry[];
}

export function LedgerHistoryTable({ entries }: LedgerHistoryTableProps) {
  return (
    <section
      aria-labelledby="history-title"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
    >
      <h2 id="history-title" className="text-base font-bold text-slate-900 mb-4">
        Extrato Geral de Movimentações
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nenhum lançamento registrado ainda. Registre um gasto ou receita acima para iniciar o
          extrato.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-700">
              <tr>
                <th className="px-4 py-3">Banco</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Movimento</th>
                <th className="px-4 py-3">Saldo no Banco</th>
                <th className="px-4 py-3">Saldo Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {entry.account?.bankName ?? 'Conta'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{entry.description}</td>
                  <td
                    className={`px-4 py-3 font-bold tabular-nums inline-flex items-center gap-1 ${
                      entry.signedDeltaCents < 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {entry.signedDeltaCents < 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {formatSignedBRL(entry.signedDeltaCents)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {formatBRL(entry.accountBalanceAfterCents)}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                    {formatBRL(entry.consolidatedBalanceAfterCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}