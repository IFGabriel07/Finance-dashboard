import React, { useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface LegalModalProps {
  documentType: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export function LegalModal({ documentType, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!documentType) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [documentType, onClose]);

  if (!documentType) return null;

  const isTerms = documentType === 'terms';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-700" aria-hidden="true" />
            <h2 id="legal-modal-title" className="text-base font-bold text-slate-900">
              {isTerms
                ? 'Termos de Uso — Finance Ledger & Auditoria'
                : 'Política de Privacidade e Proteção de Dados (LGPD)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar documento legal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4 text-sm text-slate-700 leading-relaxed">
          {isTerms ? (
            <>
              <p>
                <strong>1. Objeto do Serviço:</strong> O Finance Ledger &amp; Auditoria é uma
                ferramenta de organização financeira pessoal e empresarial destinada à consolidação
                manual de saldos entre múltiplas instituições e auditoria de lançamentos por
                categoria.
              </p>
              <p>
                <strong>2. Ausência de Integração Bancária Direta:</strong> O sistema não solicita,
                não armazena e não processa senhas bancárias, tokens de acesso ou números de cartão.
                Todos os saldos e movimentos são registrados voluntariamente pelo titular.
              </p>
              <p>
                <strong>3. Integridade Contábil:</strong> Cada lançamento gera um registro auditável
                em centavos inteiros com cálculo automático de saldo por conta e saldo consolidado.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Minimização de Dados (LGPD Art. 6º, III):</strong> Coletamos apenas os
                dados estritamente necessários para operação do livro-razão: nome, e-mail, apelido
                das instituições financeiras e registros de receitas, despesas e transferências.
              </p>
              <p>
                <strong>2. Base Legal e Consentimento (LGPD Art. 7º, I):</strong> O tratamento dos
                dados ocorre mediante consentimento explícito registrado no momento do cadastro com
                carimbo de data e hora.
              </p>
              <p>
                <strong>3. Direitos do Titular (LGPD Art. 18):</strong> A qualquer momento você pode
                exercer seu direito à <strong>portabilidade</strong> (botão{' '}
                <em>Exportar Dados (LGPD)</em> em formato JSON estruturado) ou à{' '}
                <strong>eliminação definitiva</strong> dos dados pessoais e financeiros (botão{' '}
                <em>Excluir Conta</em>).
              </p>
            </>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            Compreendi e Fechar
          </button>
        </div>
      </div>
    </div>
  );
}