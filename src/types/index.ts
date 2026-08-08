// ========================
// Enums & Status
// ========================

export type AgendamentoStatus =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado';

export const STATUS_CONFIG: Record<
  AgendamentoStatus,
  { label: string; bg: string; border: string; text: string }
> = {
  agendado: {
    label: 'Agendado',
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
  },
  confirmado: {
    label: 'Confirmado',
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-900',
  },
  em_atendimento: {
    label: 'Em Atendimento',
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-900',
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-slate-100',
    border: 'border-slate-400',
    text: 'text-slate-700',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-900',
  },
};

// ========================
// Entities
// ========================

export interface Profissional {
  id: string;
  nome: string;
  avatar_url?: string;
  iniciais: string;
  cor: string; // Tailwind gradient classes
}

export interface Servico {
  id: string;
  nome: string;
  preco: number; // em centavos
  duracao_minutos: number;
  categoria: string;
}

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string;
  avatar_url?: string;
}

export interface Agendamento {
  id: string;
  cliente: Cliente;
  profissional: Profissional;
  servicos: Servico[];
  data: string; // ISO date string
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  status: AgendamentoStatus;
  valor_total: number; // em centavos
  duracao_total: number; // em minutos
  observacoes?: string;
}

// ========================
// Form Types
// ========================

export interface NovoAgendamentoForm {
  cliente_id: string | null;
  cliente_nome: string;
  servico_ids: string[];
  profissional_id: string;
  data: string;
  hora_inicio: string;
  enviar_whatsapp: boolean;
}

// ========================
// Financial Types
// ========================

export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'dinheiro';

export const FORMA_PAGAMENTO_CONFIG: Record<
  FormaPagamento,
  { label: string; icon: string }
> = {
  pix: { label: 'PIX', icon: 'Smartphone' },
  credito: { label: 'Cartão de Crédito', icon: 'CreditCard' },
  debito: { label: 'Cartão de Débito', icon: 'CreditCard' },
  dinheiro: { label: 'Dinheiro', icon: 'Banknote' },
};

export interface ProdutoExtra {
  id: string;
  nome: string;
  preco: number; // em centavos
  categoria: string;
}

export interface LancamentoFinanceiro {
  id: string;
  agendamento_id: string;
  cliente_nome: string;
  profissional: Profissional;
  servicos: string[]; // nomes dos serviços
  produtos_extras: string[]; // nomes dos produtos extras
  forma_pagamento: FormaPagamento;
  valor_servicos: number; // centavos
  valor_produtos: number; // centavos
  valor_total: number; // centavos
  comissao_profissional: number; // centavos
  valor_liquido_salao: number; // centavos
  data: string;
  hora: string;
  status_pago_profissional: boolean;
}

export interface ComissaoProfissional {
  profissional: Profissional;
  total_atendimentos: number;
  total_comissao: number; // centavos
  total_pago: number; // centavos
  total_pendente: number; // centavos
  lancamentos: LancamentoFinanceiro[];
}

