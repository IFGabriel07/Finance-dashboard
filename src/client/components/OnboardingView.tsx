import React, { useState } from 'react';
import { Check, Landmark, Sparkles } from 'lucide-react';

interface OnboardingViewProps {
  loading: boolean;
  errorMessage: string | null;
  onSeedDemo: () => Promise<void>;
  onCreateUser: (payload: {
    name: string;
    email: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
  }) => Promise<void>;
  onOpenLegal?: (doc: 'terms' | 'privacy') => void;
}

export function OnboardingView({
  loading,
  errorMessage,
  onSeedDemo,
  onCreateUser,
  onOpenLegal,
}: OnboardingViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onCreateUser({ name, email, acceptedTerms, acceptedPrivacy });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-100">
      <section
        aria-labelledby="onboarding-title"
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm border border-slate-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-700 text-white">
            <Landmark className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 id="onboarding-title" className="text-xl font-bold text-slate-900">
              Finance Ledger & Auditoria
            </h1>
            <p className="text-sm text-slate-600">
              Consolidação multi-banco e controle por categoria de gasto
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={onSeedDemo}
          disabled={loading}
          className="w-full mb-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-800 transition cursor-pointer disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Carregar Cenário Demo (Inter + Nubank)
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-medium">
              Ou crie uma conta personalizada
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-name" className="block text-sm font-semibold text-slate-800 mb-1">
              Nome completo
            </label>
            <input
              id="user-name"
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Gabriel Felipe"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="user-email" className="block text-sm font-semibold text-slate-800 mb-1">
              E-mail
            </label>
            <input
              id="user-email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:opacity-60"
            />
          </div>

          <fieldset className="space-y-2.5 pt-1">
            <legend className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Consentimento Explícito (LGPD)
            </legend>

            <label
              className={`flex items-start gap-3 rounded-xl border p-3 text-sm text-slate-700 transition cursor-pointer ${
                acceptedTerms
                  ? 'border-indigo-200 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  required
                  disabled={loading}
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white transition cursor-pointer hover:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 checked:border-indigo-700 checked:bg-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100"
                />
                <Check
                  aria-hidden="true"
                  className="pointer-events-none absolute h-3.5 w-3.5 text-white stroke-[2.5] opacity-0 transition-opacity peer-checked:opacity-100"
                />
              </div>
              <span className="leading-relaxed">
                Concordo com os{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal?.('terms');
                  }}
                  className="font-semibold text-indigo-700 underline hover:text-indigo-900 cursor-pointer"
                >
                  Termos de Uso
                </button>{' '}
                do sistema financeiro.
              </span>
            </label>

            <label
              className={`flex items-start gap-3 rounded-xl border p-3 text-sm text-slate-700 transition cursor-pointer ${
                acceptedPrivacy
                  ? 'border-indigo-200 bg-indigo-50/40'
                  : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  required
                  disabled={loading}
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="peer h-5 w-5 appearance-none rounded-md border border-slate-300 bg-white transition cursor-pointer hover:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 checked:border-indigo-700 checked:bg-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100"
                />
                <Check
                  aria-hidden="true"
                  className="pointer-events-none absolute h-3.5 w-3.5 text-white stroke-[2.5] opacity-0 transition-opacity peer-checked:opacity-100"
                />
              </div>
              <span className="leading-relaxed">
                Autorizo o armazenamento mínimo dos meus apelidos de conta e lançamentos conforme a{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLegal?.('privacy');
                  }}
                  className="font-semibold text-indigo-700 underline hover:text-indigo-900 cursor-pointer"
                >
                  Política de Privacidade (LGPD)
                </button>
                .
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
          >
            Iniciar Painel Financeiro
          </button>
        </form>
      </section>
    </main>
  );
}