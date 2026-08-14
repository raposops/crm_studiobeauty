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
  { label: string; bg: string; border: string; text: string; badgeBg: string }
> = {
  agendado: {
    label: 'Agendado',
    bg: 'bg-amber-500/5',
    border: 'border-l-amber-500',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-100/90 text-amber-800 border-amber-300/80',
  },
  confirmado: {
    label: 'Confirmado',
    bg: 'bg-emerald-500/5',
    border: 'border-l-emerald-500',
    text: 'text-emerald-700',
    badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-300/80',
  },
  em_atendimento: {
    label: 'Em Atendimento',
    bg: 'bg-sky-500/5',
    border: 'border-l-sky-500',
    text: 'text-sky-700',
    badgeBg: 'bg-sky-100/90 text-sky-800 border-sky-300/80',
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-slate-500/5',
    border: 'border-l-slate-400',
    text: 'text-slate-700',
    badgeBg: 'bg-slate-100/90 text-slate-700 border-slate-300/80',
  },
  cancelado: {
    label: 'Cancelado',
    bg: 'bg-rose-500/5',
    border: 'border-l-rose-500',
    text: 'text-rose-700',
    badgeBg: 'bg-rose-100/90 text-rose-800 border-rose-300/80',
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
  comissao_padrao_pct?: number; // % de repasse para o profissional (ex: 40, 50, 0)
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
// SaaS & Modules Types
// ========================

export type ModulosSalao = Record<string, boolean>;

export const MODULOS_DISPONIVEIS: Array<{ key: string; nome: string; descricao: string }> = [
  {
    key: 'fluxo_de_caixa',
    nome: 'Fluxo de Caixa (Gestão de Entradas & Saídas)',
    descricao: 'Controle de despesas fixas (aluguel, internet, contas) e receitas com puxada automática do caixa.',
  },
  {
    key: 'fluxo_caixa_avancado',
    nome: 'Lançamento Avulso',
    descricao: 'Permite registrar entradas/saídas avulsas manuais e controlar o saldo do dia',
  },
  {
    key: 'comissao_customizada',
    nome: 'Comissão Customizada por Profissional',
    descricao: 'Permite alterar a % de repasse individual de cada profissional no cadastro',
  },
  {
    key: 'whatsapp_automatico',
    nome: 'Notificações via WhatsApp',
    descricao: 'Envio automático de lembretes e confirmações por WhatsApp para os clientes',
  },
  {
    key: 'relatorios_avancados',
    nome: 'Relatórios Financeiros Avançados',
    descricao: 'Acesso a métricas executivas, faturamento detalhado e gráficos do salão',
  },
];

export interface PlanoSaaS {
  id: 'basico' | 'pro';
  nome: string;
  preco: number;
  precoFormatado: string;
  descricao: string;
  destaque?: boolean;
  recursos: string[];
  modulosPadrao: ModulosSalao;
}

export const PLANOS_SAAS: Record<'basico' | 'pro', PlanoSaaS> = {
  basico: {
    id: 'basico',
    nome: 'Plano Básico',
    preco: 49.99,
    precoFormatado: 'R$ 49,99',
    descricao: 'Essencial para salões e profissionais autônomos com automação de agenda e mensagens.',
    recursos: [
      'Comissão customizada por profissional',
      'Notificações automáticas via WhatsApp',
      'Relatórios financeiros do salão',
      'Agenda multi-profissional inteligente',
      'Link público para agendamento online',
    ],
    modulosPadrao: {
      comissao_customizada: true,
      whatsapp_automatico: true,
      relatorios_avancados: true,
      fluxo_de_caixa: false,
      fluxo_caixa_avancado: false,
    },
  },
  pro: {
    id: 'pro',
    nome: 'Plano PRO Completo',
    preco: 69.90,
    precoFormatado: 'R$ 69,90',
    descricao: 'Tudo do plano básico + Fluxo de Caixa completo, despesas fixas e lançamentos avulsos.',
    destaque: true,
    recursos: [
      'Todos os benefícios do Plano Básico',
      'Fluxo de Caixa com controle de receitas e despesas fixas',
      'Lançamento Avulso de entradas e saídas',
      'Relatórios financeiros avançados e gráficos executivos',
      'Suporte prioritário e integração total',
    ],
    modulosPadrao: {
      comissao_customizada: true,
      whatsapp_automatico: true,
      relatorios_avancados: true,
      fluxo_de_caixa: true,
      fluxo_caixa_avancado: true,
    },
  },
};

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

export type CategoriaMovimentacao =
  | 'caixa_automatico'
  | 'aluguel'
  | 'internet'
  | 'energia_agua'
  | 'insumos'
  | 'folha_repasse'
  | 'manutencao'
  | 'receita_avulsa'
  | 'outros';

export const CATEGORIAS_FLUXO_CAIXA: Record<
  CategoriaMovimentacao,
  { label: string; tipo: 'entrada' | 'saida' | 'ambos'; cor: string }
> = {
  caixa_automatico: { label: 'Caixa do Dia (Automático)', tipo: 'entrada', cor: 'emerald' },
  receita_avulsa: { label: 'Receita Avulsa / Vendas', tipo: 'entrada', cor: 'teal' },
  aluguel: { label: 'Aluguel do Salão', tipo: 'saida', cor: 'rose' },
  internet: { label: 'Internet / Telefone', tipo: 'saida', cor: 'purple' },
  energia_agua: { label: 'Luz / Água', tipo: 'saida', cor: 'amber' },
  insumos: { label: 'Insumos & Produtos', tipo: 'saida', cor: 'indigo' },
  folha_repasse: { label: 'Folha & Repasse de Equipe', tipo: 'saida', cor: 'sky' },
  manutencao: { label: 'Manutenção / Equipamentos', tipo: 'saida', cor: 'orange' },
  outros: { label: 'Outras Despesas', tipo: 'saida', cor: 'slate' },
};

export interface MovimentacaoFluxoCaixa {
  id: string;
  salao_id: string;
  tipo: 'entrada' | 'saida';
  categoria: CategoriaMovimentacao;
  descricao: string;
  valor: number; // em centavos
  data: string; // YYYY-MM-DD
  origem_caixa_auto?: boolean;
  criado_em?: string;
}

