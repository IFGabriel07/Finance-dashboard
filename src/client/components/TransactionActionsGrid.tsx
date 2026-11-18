import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, PlusCircle } from 'lucide-react';
import { BankAccount } from '../types/finance';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  parseBRLInputToCents,
} from '../utils/format';

interface TransactionActionsGridProps {
  accounts: BankAccount[];
  onAddAccount: (bankName: string, accentColor: string) => Promise<void>;
  onCreateTransaction: (payload: {
    accountId: string;
    type: 'CREDIT' | 'DEBIT';
    amountCents: number;
    description: string;
    category: string;
  }) => Promise<void>;
  onTransfer: (payload: {
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
  }) => Promise<void>;
  onValidationError: (message: string) => void;
}

export function TransactionActionsGrid({
  accounts,
  onAddAccount,
  onCreateTransaction,
  onTransfer,
  onValidationError,
}: TransactionActionsGridProps) {
  // 1. Nova Instituição
  const [bankName, setBankName] = useState('');
  const [accentColor, setAccentColor] = useState('#FF7A00');

  // 2. Lançamento Geral (Gasto ou Receita)
  const [txAccountId, setTxAccountId] = useState('');
  const [txType, setTxType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');

  // 3. Transferência Interna
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    if (accounts.length > 0) {
      setTxAccountId((prev) => prev || accounts[0].id);
      setFromAccountId((prev) => prev || accounts[0].id);
      if (accounts.length > 1) {
        setToAccountId((prev) => prev || accounts[1].id);
      }
    }
  }, [accounts]);

  function handleTypeChange(nextType: 'CREDIT' | 'DEBIT') {
    setTxType(nextType);
    setSelectedPreset(nextType === 'DEBIT' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
    setCustomCategory('');
  }

  async function submitBank(e: React.FormEvent) {
    e.preventDefault();
    await onAddAccount(bankName, accentColor);
    setBankName('');
  }

  async function submitTransaction(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = parseBRLInputToCents(txAmount);
    if (amountCents <= 0) {
      onValidationError('Informe um valor positivo válido (ex.: 150,00).');
      return;
    }

    const finalCategory =
      selectedPreset === 'Outros' && customCategory.trim()
        ? customCategory.trim()
        : selectedPreset;

    await onCreateTransaction({
      accountId: txAccountId,
      type: txType,
      amountCents,
      description: txDescription,
      category: finalCategory,
    });

    setTxAmount('');
    setTxDescription('');
    setCustomCategory('');
  }

  async function submitTransfer(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = parseBRLInputToCents(transferAmount);
    if (amountCents <= 0) {
      onValidationError('Informe um valor válido para transferência.');
      return;
    }

    await onTransfer({ fromAccountId, toAccountId, amountCents });
    setTransferAmount('');
  }

  const availableCategories = txType === 'DEBIT' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Lançamento Geral (Mercado, Roupas, Salário, etc.) */}
      <section
        aria-labelledby="add-tx-title"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-1"
      >
        <h2 id="add-tx-title" className="text-base font-bold flex items-center gap-2 mb-4">
          <PlusCircle className="w-4 h-4 text-indigo-700" aria-hidden="true" />
          Registrar Gasto ou Receita
        </h2>
        <form onSubmit={submitTransaction} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="tx-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Movimento
              </label>
              <select
                id="tx-type"
                value={txType}
                onChange={(e) => handleTypeChange(e.target.value as 'CREDIT' | 'DEBIT')}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold"
              >
                <option value="DEBIT">Gasto / Saída (-)</option>
                <option value="CREDIT">Receita / Entrada (+)</option>
              </select>
            </div>
            <div>
              <label htmlFor="tx-account" className="block text-xs font-semibold text-slate-700 mb-1">
                Banco / Cartão
              </label>
              <select
                id="tx-account"
                value={txAccountId}
                onChange={(e) => setTxAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tx-cat" className="block text-xs font-semibold text-slate-700 mb-1">
              Categoria
            </label>
            <select
              id="tx-cat"
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {selectedPreset === 'Outros' && (
            <div>
              <label
                htmlFor="tx-custom-cat"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nome da categoria personalizada
              </label>
              <input
                id="tx-custom-cat"
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex.: Petshop, Presentes, Manutenção"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$)
              </label>
              <input
                id="tx-amount"
                type="text"
                required
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="185,50"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tx-desc" className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição
              </label>
              <input
                id="tx-desc"
                type="text"
                required
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Ex.: Compras do mês"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={accounts.length === 0}
            className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50 cursor-pointer"
          >
            Lançar no Livro-Razão
          </button>
        </form>
      </section>

      {/* 2. Transferência entre Contas */}
      <section
        aria-labelledby="transfer-title"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <h2 id="transfer-title" className="text-base font-bold flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-4 h-4 text-indigo-700" aria-hidden="true" />
          Transferência Entre Bancos
        </h2>
        <form onSubmit={submitTransfer} className="space-y-3">
          <div>
            <label htmlFor="from-acc" className="block text-xs font-semibold text-slate-700 mb-1">
              Conta de origem
            </label>
            <select
              id="from-acc"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="to-acc" className="block text-xs font-semibold text-slate-700 mb-1">
              Conta de destino
            </label>
            <select
              id="to-acc"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="transfer-val" className="block text-xs font-semibold text-slate-700 mb-1">
              Valor a transferir (R$)
            </label>
            <input
              id="transfer-val"
              type="text"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="200,00"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={accounts.length < 2}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            Transferir Sem Alterar Total
          </button>
        </form>
      </section>

      {/* 3. Nova Instituição */}
      <section
        aria-labelledby="add-bank-title"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        <h2 id="add-bank-title" className="text-base font-bold flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-indigo-700" aria-hidden="true" />
          Adicionar Banco
        </h2>
        <form onSubmit={submitBank} className="space-y-3">
          <div>
            <label htmlFor="bank-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da instituição
            </label>
            <input
              id="bank-name"
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ex.: Banco Inter, Nubank, Itaú"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="bank-color" className="block text-xs font-semibold text-slate-700 mb-1">
              Cor de identificação
            </label>
            <input
              id="bank-color"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 p-1 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            Cadastrar Instituição
          </button>
        </form>
      </section>
    </div>
  );
}