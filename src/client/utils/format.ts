export const EXPENSE_CATEGORIES = [
  'Mercado & Alimentação',
  'Roupas & Vestuário',
  'Moradia & Contas',
  'Transporte & Combustível',
  'Saúde & Farmácia',
  'Lazer & Assinaturas',
  'Educação',
  'Outros',
] as const;

export const INCOME_CATEGORIES = [
  'Salário & Pró-labore',
  'Freelance & Serviços',
  'Rendimentos',
  'Reembolso',
  'Depósito Inicial',
  'Outros',
] as const;

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatSignedBRL(cents: number): string {
  const formatted = formatBRL(Math.abs(cents));
  if (cents > 0) return `+${formatted}`;
  if (cents < 0) return `-${formatted}`;
  return formatted;
}

export function parseBRLInputToCents(raw: string): number {
  const normalized = raw.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
}