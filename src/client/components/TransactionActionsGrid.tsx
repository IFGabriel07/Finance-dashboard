import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, Check, Palette, PlusCircle } from 'lucide-react';
import { BankAccount } from '../types/finance';

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
  onValidationError: (text: string) => void;
}

const PRESET_CATEGORIES = [
  'Mercado & Alimentação',
  'Roupas & Vestuário',
  'Moradia & Contas',
  'Transporte & Combustível',
  'Saúde & Farmácia',
  'Lazer & Assinaturas',
  'Salário & Rendimentos',
  'Outros',
];

const BANK_COLOR_PRESETS = [
  { label: 'Laranja (Inter)', hex: '#FF7A00' },
  { label: 'Roxo (Nubank)', hex: '#820AD1' },
  { label: 'Azul (Itaú / Caixa)', hex: '#005CA9' },
  { label: 'Vermelho (Bradesco / Santander)', hex: '#CC092F' },
  { label: 'Amarelo (Banco do Brasil)', hex: '#EAB308' },
  { label: 'Verde (Sicredi / C6)', hex: '#00A859' },
  { label: 'Grafite (BTG / XP)', hex: '#1E293B' },
];

function parseBRLInputToCents(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return 0;

  let normalized = cleaned;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
}

export function TransactionActionsGrid({
  accounts,
  onAddAccount,
  onCreateTransaction,
  onTransfer,
  onValidationError,
}: TransactionActionsGridProps) {
  const [txType, setTxType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [txAccountId, setTxAccountId] = useState('');
  const [txCategory, setTxCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [bankName, setBankName] = useState('');
  const [accentColor, setAccentColor] = useState(BANK_COLOR_PRESETS[0].hex);

  useEffect(() => {
    if (accounts.length === 0) {
      setTxAccountId('');
      setFromAccountId('');
      setToAccountId('');
      return;
    }
    if (!accounts.some((acc) => acc.id === txAccountId)) {
      setTxAccountId(accounts[0].id);
    }
    if (!accounts.some((acc) => acc.id === fromAccountId)) {
      setFromAccountId(accounts[0].id);
    }
    if (accounts.length > 1 && !accounts.some((acc) => acc.id === toAccountId)) {
      setToAccountId(accounts[1].id);
    }
  }, [accounts, txAccountId, fromAccountId, toAccountId]);

  async function handleTransactionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!txAccountId) {
      onValidationError('Cadastre ou selecione uma instituição bancária primeiro.');
      return;
    }

    const amountCents = parseBRLInputToCents(txAmount);
    if (amountCents <= 0) {
      onValidationError('Informe um valor válido maior que zero.');
      return;
    }

    const finalCategory =
      txCategory === 'Outros' && customCategory.trim() ? customCategory.trim() : txCategory;

    await onCreateTransaction({
      accountId: txAccountId,
      type: txType,
      amountCents,
      description: txDescription.trim() || finalCategory,
      category: finalCategory,
    });

    setTxAmount('');
    setTxDescription('');
    if (txCategory === 'Outros') setCustomCategory('');
  }

  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      onValidationError('Selecione as contas de origem e destino.');
      return;
    }
    if (fromAccountId === toAccountId) {
      onValidationError('Escolha instituições diferentes para realizar a transferência.');
      return;
    }

    const amountCents = parseBRLInputToCents(transferAmount);
    if (amountCents <= 0) {
      onValidationError('Informe um valor válido para transferir.');
      return;
    }

    await onTransfer({
      fromAccountId,
      toAccountId,
      amountCents,
    });

    setTransferAmount('');
  }

  async function handleAddBankSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = bankName.trim();
    if (!trimmed) {
      onValidationError('Informe o nome da instituição bancária.');
      return;
    }

    await onAddAccount(trimmed, accentColor);
    setBankName('');
  }

  return (
    <section
      aria-label="Operações financeiras"
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
    >
      {/* Card 1: Registrar Gasto ou Receita */}
      <form
        onSubmit={handleTransactionSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-slate-900">
          <PlusCircle className="w-5 h-5 text-indigo-700" aria-hidden="true" />
          <h2 className="text-base font-bold">Registrar Gasto ou Receita</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-type" className="block text-xs font-semibold text-slate-700 mb-1">
              Movimento
            </label>
            <select
              id="tx-type"
              value={txType}
              onChange={(e) => setTxType(e.target.value as 'CREDIT' | 'DEBIT')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
              disabled={accounts.length === 0}
              onChange={(e) => setTxAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {accounts.length === 0 ? (
                <option value="">Nenhuma conta</option>
              ) : (
                accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tx-category" className="block text-xs font-semibold text-slate-700 mb-1">
            Categoria
          </label>
          <select
            id="tx-category"
            value={txCategory}
            onChange={(e) => setTxCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {PRESET_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {txCategory === 'Outros' && (
          <div>
            <label
              htmlFor="tx-custom-category"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nome da categoria personalizada
            </label>
            <input
              id="tx-custom-category"
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Ex.: Educação, Pets, Investimentos"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-700 mb-1">
              Valor (R$)
            </label>
            <input
              id="tx-amount"
              type="text"
              inputMode="decimal"
              required
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="185,50"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="tx-description"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Descrição
            </label>
            <input
              id="tx-description"
              type="text"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              placeholder="Ex.: Compras do mês"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={accounts.length === 0}
          className="w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 transition cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          Lançar no Livro-Razão
        </button>
      </form>

      {/* Card 2: Transferência Entre Bancos */}
      <form
        onSubmit={handleTransferSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-slate-900">
          <ArrowLeftRight className="w-5 h-5 text-slate-700" aria-hidden="true" />
          <h2 className="text-base font-bold">Transferência Entre Bancos</h2>
        </div>

        <div>
          <label htmlFor="transfer-from" className="block text-xs font-semibold text-slate-700 mb-1">
            Conta de origem
          </label>
          <select
            id="transfer-from"
            value={fromAccountId}
            disabled={accounts.length === 0}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {accounts.length === 0 ? (
              <option value="">Nenhuma conta</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="transfer-to" className="block text-xs font-semibold text-slate-700 mb-1">
            Conta de destino
          </label>
          <select
            id="transfer-to"
            value={toAccountId}
            disabled={accounts.length < 2}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {accounts.length < 2 ? (
              <option value="">Adicione ao menos 2 contas</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="transfer-amount"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Valor a transferir (R$)
          </label>
          <input
            id="transfer-amount"
            type="text"
            inputMode="decimal"
            required
            disabled={accounts.length < 2}
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="200,00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={accounts.length < 2}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          Transferir Sem Alterar Total
        </button>
      </form>

      {/* Card 3: Adicionar Banco */}
      <form
        onSubmit={handleAddBankSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 text-slate-900">
          <Building2 className="w-5 h-5 text-indigo-700" aria-hidden="true" />
          <h2 className="text-base font-bold">Adicionar Banco</h2>
        </div>

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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span id="bank-color-label" className="block text-xs font-semibold text-slate-700">
              Cor da etiqueta do banco
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span
                className="h-2.5 w-2.5 rounded-full border border-black/10"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              />
              {accentColor.toUpperCase()}
            </span>
          </div>

          <div
            role="group"
            aria-labelledby="bank-color-label"
            className="flex flex-wrap items-center gap-2"
          >
            {BANK_COLOR_PRESETS.map((preset) => {
              const isSelected = accentColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  title={preset.label}
                  aria-label={preset.label}
                  aria-pressed={isSelected}
                  onClick={() => setAccentColor(preset.hex)}
                  style={{ backgroundColor: preset.hex }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-offset-2 ring-slate-900 scale-105'
                      : 'opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 text-white stroke-[2.5]" aria-hidden="true" />
                  )}
                </button>
              );
            })}

            <label
              title="Escolher outra cor"
              className="h-8 px-2.5 rounded-full border border-slate-300 bg-slate-50 hover:bg-slate-100 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer transition"
            >
              <Palette className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Outra</span>
              <input
                type="color"
                aria-label="Escolher cor personalizada"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
        >
          Cadastrar Instituição
        </button>
      </form>
    </section>
  );
}