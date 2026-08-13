import type { Profissional, Servico, Cliente, Agendamento, ProdutoExtra, LancamentoFinanceiro, ComissaoProfissional } from '@/types';

// ========================
// Profissionais Mock
// ========================

export const PROFISSIONAIS: Profissional[] = [
  {
    id: 'prof-1',
    nome: 'Ana Silva',
    iniciais: 'AS',
    cor: 'from-purple-500 to-pink-500',
    comissao_padrao_pct: 50,
  },
  {
    id: 'prof-2',
    nome: 'Carlos Souza',
    iniciais: 'CS',
    cor: 'from-blue-500 to-cyan-500',
    comissao_padrao_pct: 40,
  },
  {
    id: 'prof-3',
    nome: 'Mariana Lima',
    iniciais: 'ML',
    cor: 'from-amber-500 to-orange-500',
    comissao_padrao_pct: 30,
  },
  {
    id: 'prof-4',
    nome: 'Roberto Santos',
    iniciais: 'RS',
    cor: 'from-emerald-500 to-teal-500',
    comissao_padrao_pct: 0,
  },
];

// ========================
// Serviços Mock
// ========================

export const SERVICOS: Servico[] = [
  { id: 'serv-1', nome: 'Corte Feminino', preco: 8000, duracao_minutos: 45, categoria: 'Cabelo' },
  { id: 'serv-2', nome: 'Corte Masculino', preco: 4500, duracao_minutos: 30, categoria: 'Cabelo' },
  { id: 'serv-3', nome: 'Escova Progressiva', preco: 15000, duracao_minutos: 120, categoria: 'Cabelo' },
  { id: 'serv-4', nome: 'Coloração', preco: 12000, duracao_minutos: 90, categoria: 'Cabelo' },
  { id: 'serv-5', nome: 'Barba', preco: 3500, duracao_minutos: 20, categoria: 'Barba' },
  { id: 'serv-6', nome: 'Manicure', preco: 4000, duracao_minutos: 40, categoria: 'Unhas' },
  { id: 'serv-7', nome: 'Pedicure', preco: 5000, duracao_minutos: 50, categoria: 'Unhas' },
  { id: 'serv-8', nome: 'Hidratação', preco: 6000, duracao_minutos: 40, categoria: 'Tratamento' },
];

// ========================
// Produtos Extras (Upsell)
// ========================

export const PRODUTOS_EXTRAS: ProdutoExtra[] = [
  { id: 'prod-1', nome: 'Shampoo Profissional', preco: 4500, categoria: 'Cabelo' },
  { id: 'prod-2', nome: 'Condicionador Premium', preco: 3800, categoria: 'Cabelo' },
  { id: 'prod-3', nome: 'Óleo Capilar', preco: 2500, categoria: 'Cabelo' },
  { id: 'prod-4', nome: 'Máscara de Tratamento', preco: 5500, categoria: 'Tratamento' },
  { id: 'prod-5', nome: 'Pomada Modeladora', preco: 3000, categoria: 'Barba' },
  { id: 'prod-6', nome: 'Esmalte Importado', preco: 2000, categoria: 'Unhas' },
  { id: 'prod-7', nome: 'Base Fortalecedora', preco: 1800, categoria: 'Unhas' },
  { id: 'prod-8', nome: 'Cera Depilatória', preco: 3500, categoria: 'Depilação' },
];

// ========================
// Clientes Mock
// ========================

export const CLIENTES: Cliente[] = [
  { id: 'cli-1', nome: 'Julia Mendes', whatsapp: '(11) 99999-0001' },
  { id: 'cli-2', nome: 'Pedro Almeida', whatsapp: '(11) 99999-0002' },
  { id: 'cli-3', nome: 'Fernanda Costa', whatsapp: '(11) 99999-0003' },
  { id: 'cli-4', nome: 'Lucas Oliveira', whatsapp: '(11) 99999-0004' },
  { id: 'cli-5', nome: 'Camila Rodrigues', whatsapp: '(11) 99999-0005' },
  { id: 'cli-6', nome: 'Bruno Ferreira', whatsapp: '(11) 99999-0006' },
];

// ========================
// Agendamentos Mock (para hoje)
// ========================

const today = new Date().toISOString().split('T')[0];

export const AGENDAMENTOS_MOCK: Agendamento[] = [
  {
    id: 'ag-1',
    cliente: CLIENTES[0],
    profissional: PROFISSIONAIS[0],
    servicos: [SERVICOS[0], SERVICOS[7]],
    data: today,
    hora_inicio: '09:00',
    hora_fim: '10:25',
    status: 'confirmado',
    valor_total: 14000,
    duracao_total: 85,
    observacoes: 'Cliente preferência por franja longa',
  },
  {
    id: 'ag-2',
    cliente: CLIENTES[1],
    profissional: PROFISSIONAIS[1],
    servicos: [SERVICOS[1], SERVICOS[4]],
    data: today,
    hora_inicio: '09:00',
    hora_fim: '09:50',
    status: 'em_atendimento',
    valor_total: 8000,
    duracao_total: 50,
  },
  {
    id: 'ag-3',
    cliente: CLIENTES[2],
    profissional: PROFISSIONAIS[0],
    servicos: [SERVICOS[3]],
    data: today,
    hora_inicio: '11:00',
    hora_fim: '12:30',
    status: 'agendado',
    valor_total: 12000,
    duracao_total: 90,
  },
  {
    id: 'ag-4',
    cliente: CLIENTES[3],
    profissional: PROFISSIONAIS[2],
    servicos: [SERVICOS[5], SERVICOS[6]],
    data: today,
    hora_inicio: '14:00',
    hora_fim: '15:30',
    status: 'agendado',
    valor_total: 9000,
    duracao_total: 90,
  },
  {
    id: 'ag-5',
    cliente: CLIENTES[4],
    profissional: PROFISSIONAIS[1],
    servicos: [SERVICOS[1]],
    data: today,
    hora_inicio: '14:30',
    hora_fim: '15:00',
    status: 'cancelado',
    valor_total: 4500,
    duracao_total: 30,
  },
  {
    id: 'ag-6',
    cliente: CLIENTES[5],
    profissional: PROFISSIONAIS[3],
    servicos: [SERVICOS[2]],
    data: today,
    hora_inicio: '08:00',
    hora_fim: '10:00',
    status: 'concluido',
    valor_total: 15000,
    duracao_total: 120,
  },
];

// ========================
// Comissão Config
// ========================

export const COMISSAO_PERCENTUAL = 40; // 40% para o profissional

export function calcularComissao(valorTotal: number, comissaoPct: number = COMISSAO_PERCENTUAL): {
  comissao: number;
  liquido: number;
} {
  const comissao = Math.round((valorTotal * comissaoPct) / 100);
  return { comissao, liquido: valorTotal - comissao };
}

// ========================
// Lançamentos Financeiros Mock (hoje)
// ========================

export const LANCAMENTOS_MOCK: LancamentoFinanceiro[] = [
  {
    id: 'lanc-1',
    agendamento_id: 'ag-6',
    cliente_nome: 'Bruno Ferreira',
    profissional: PROFISSIONAIS[3],
    servicos: ['Escova Progressiva'],
    produtos_extras: ['Shampoo Profissional'],
    forma_pagamento: 'credito',
    valor_servicos: 15000,
    valor_produtos: 4500,
    valor_total: 19500,
    comissao_profissional: 7800,
    valor_liquido_salao: 11700,
    data: today,
    hora: '10:05',
    status_pago_profissional: false,
  },
  {
    id: 'lanc-2',
    agendamento_id: 'ag-prev-1',
    cliente_nome: 'Ana Beatriz',
    profissional: PROFISSIONAIS[0],
    servicos: ['Corte Feminino', 'Hidratação'],
    produtos_extras: [],
    forma_pagamento: 'pix',
    valor_servicos: 14000,
    valor_produtos: 0,
    valor_total: 14000,
    comissao_profissional: 5600,
    valor_liquido_salao: 8400,
    data: today,
    hora: '08:50',
    status_pago_profissional: true,
  },
  {
    id: 'lanc-3',
    agendamento_id: 'ag-prev-2',
    cliente_nome: 'Ricardo Pena',
    profissional: PROFISSIONAIS[1],
    servicos: ['Corte Masculino', 'Barba'],
    produtos_extras: ['Pomada Modeladora'],
    forma_pagamento: 'dinheiro',
    valor_servicos: 8000,
    valor_produtos: 3000,
    valor_total: 11000,
    comissao_profissional: 4400,
    valor_liquido_salao: 6600,
    data: today,
    hora: '08:30',
    status_pago_profissional: false,
  },
];

// ========================
// Helpers
// ========================

export const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function getComissoesPorProfissional(
  lancamentos: LancamentoFinanceiro[]
): ComissaoProfissional[] {
  const map = new Map<string, ComissaoProfissional>();

  for (const lanc of lancamentos) {
    const existing = map.get(lanc.profissional.id);
    if (existing) {
      existing.total_atendimentos += 1;
      existing.total_comissao += lanc.comissao_profissional;
      if (lanc.status_pago_profissional) {
        existing.total_pago += lanc.comissao_profissional;
      } else {
        existing.total_pendente += lanc.comissao_profissional;
      }
      existing.lancamentos.push(lanc);
    } else {
      map.set(lanc.profissional.id, {
        profissional: lanc.profissional,
        total_atendimentos: 1,
        total_comissao: lanc.comissao_profissional,
        total_pago: lanc.status_pago_profissional
          ? lanc.comissao_profissional
          : 0,
        total_pendente: lanc.status_pago_profissional
          ? 0
          : lanc.comissao_profissional,
        lancamentos: [lanc],
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.total_comissao - a.total_comissao
  );
}
