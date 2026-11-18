import React, { useMemo, useState } from 'react';
import { Tag } from 'lucide-react';
import { BankAccount, InvestigationReport } from '../types/finance';
import { formatBRL, formatSignedBRL } from '../utils/format';

interface InvestigationPanelProps {
  accounts: BankAccount[];
  report: InvestigationReport | null;
  filterPeriod: 'ALL' | 'TODAY' | '7D';
  filterAccountId: string;
  onChangePeriod: (period: 'ALL' | 'TODAY' | '7D') => void;
  onChangeAccount: (accountId: string) => void;
}

export function InvestigationPanel({
  accounts,
  report,
  filterPeriod,
  filterAccountId,
  onChangePeriod,
  onChangeAccount,
}: InvestigationPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categoryBreakdown = useMemo(() => {
    if (!report) return [];
    const map = new Map<string, { totalSpentCents: number; count: number }>();

    for (const tx of report.culpritTransactions) {
      if (tx.type !== 'DEBIT') continue;
      const current = map.get(tx.category) ?? { totalSpentCents: 0, count: 0 };
      current.totalSpentCents += tx.amountCents;
      current.count += 1;
      map.set(tx.category, current);
    }

    const totalExpenses = Array.from(map.values()).reduce((sum, item) => sum + item.totalSpentCents, 0);

    return Array.from(map.entries())
      .map(([category, data]) => ({
        category,
        totalSpentCents: data.totalSpentCents,
        count: data.count,
        sharePercent: totalExpenses > 0 ? Math.round((data.totalSpentCents / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.totalSpentCents - a.totalSpentCents);
  }, [report]);

  const filteredTransactions = useMemo(() => {
    if (!report) return [];
    if (!selectedCategory) return report.culpritTransactions;
    return report.culpritTransactions.filter((tx) => tx.category === selectedCategory);
  }, [report, selectedCategory]);

  return (
    <section
      id="investigation-panel"
      aria-labelledby="investigation-title"
      className="rounded-2xl border-2 border-indigo-600 bg-white p-6 shadow-md space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 id="investigation-title" className="text-lg font-bold text-slate-900">
            Análise de Impacto no Saldo
          </h2>
          <p className="text-sm text-slate-600">
            Analise qual banco e quais categorias (mercado, roupas, contas) impactaram seu saldo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filtrar período"
            value={filterPeriod}
            onChange={(e) => onChangePeriod(e.target.value as 'ALL' | 'TODAY' | '7D')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="ALL">Todo o histórico</option>
            <option value="TODAY">Apenas hoje</option>
            <option value="7D">Últimos 7 dias</option>
          </select>

          <select
            aria-label="Filtrar instituição"
            value={filterAccountId}
            onChange={(e) => onChangeAccount(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">Todas as instituições</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar categoria"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">Todas as categorias</option>
            {Array.from(new Set(report?.culpritTransactions.map((t) => t.category) ?? [])).map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-600">
                Variação Líquida no Período
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold tabular-nums ${
                  report.periodNetChangeCents < 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {formatSignedBRL(report.periodNetChangeCents)}
              </p>
            </div>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-900">
                Banco com Maior Impacto
              </p>
              {report.primaryDriverBank ? (
                <p className="mt-1 text-base font-bold text-slate-950">
                  {report.primaryDriverBank.bankName}{' '}
                  <span
                    className={`tabular-nums ${
                      report.primaryDriverBank.periodDeltaCents < 0
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    ({formatSignedBRL(report.primaryDriverBank.periodDeltaCents)})
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-700">Sem variação no período.</p>
              )}
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-900">
                Maior Categoria de Gasto
              </p>
              {categoryBreakdown.length > 0 ? (
                <p className="mt-1 text-base font-bold text-slate-950">
                  {categoryBreakdown[0].category}{' '}
                  <span className="text-rose-700 tabular-nums">
                    (-{formatBRL(categoryBreakdown[0].totalSpentCents)})
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-700">Nenhuma despesa registrada.</p>
              )}
            </div>
          </div>

          {categoryBreakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-700" aria-hidden="true" />
                Despesas por Categoria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryBreakdown.map((cat) => (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() =>
                      setSelectedCategory((prev) => (prev === cat.category ? '' : cat.category))
                    }
                    className={`text-left rounded-xl border p-3.5 transition cursor-pointer ${
                      selectedCategory === cat.category
                        ? 'border-indigo-600 bg-indigo-50/70'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{cat.category}</span>
                      <span className="text-xs font-semibold text-indigo-700">
                        {cat.sharePercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-rose-700 tabular-nums">
                      -{formatBRL(cat.totalSpentCents)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.count} lançamento(s)</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Transações Ordenadas por Impacto no Saldo
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs font-bold uppercase text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Instituição</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Impacto</th>
                    <th className="px-4 py-3">Saldo Geral Após Movimentação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{tx.bankName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{tx.description}</td>
                      <td
                        className={`px-4 py-3 font-bold tabular-nums ${
                          tx.signedDeltaCents < 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatSignedBRL(tx.signedDeltaCents)}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-800">
                        {formatBRL(tx.consolidatedBalanceAfterCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}