import React from 'react';
import { Download, Landmark, LogOut, Trash2 } from 'lucide-react';
import { UserSession } from '../types/finance';

interface NavbarProps {
  user: UserSession;
  onExportLGPD: () => void;
  onDeleteAccount: () => void;
  onLogout: () => void;
}

export function Navbar({ user, onExportLGPD, onDeleteAccount, onLogout }: NavbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-700 text-white">
            <Landmark className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Finance Ledger & Auditoria</h1>
            <p className="text-xs text-slate-600">
              Titular: <span className="font-semibold text-slate-800">{user.name}</span> ({user.email})
            </p>
          </div>
        </div>

        <nav aria-label="Direitos de Privacidade LGPD" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportLGPD}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Exportar Dados (LGPD)
          </button>
          <button
            type="button"
            onClick={onDeleteAccount}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Excluir Conta
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}