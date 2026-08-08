import type { Profissional, Servico, Cliente, Agendamento } from '@/types';

// ========================
// Profissionais Mock
// ========================

export const PROFISSIONAIS: Profissional[] = [
  {
    id: 'prof-1',
    nome: 'Ana Silva',
    iniciais: 'AS',
    cor: 'from-purple-500 to-pink-500',
  },
  {
    id: 'prof-2',
    nome: 'Carlos Souza',
    iniciais: 'CS',
    cor: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'prof-3',
    nome: 'Mariana Lima',
    iniciais: 'ML',
    cor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'prof-4',
    nome: 'Roberto Santos',
    iniciais: 'RS',
    cor: 'from-emerald-500 to-teal-500',
  },
];

// ========================
// Serviços Mock
// ========================

export const SERVICOS: Servico[] = [
  {
    id: 'serv-1',
    nome: 'Corte Feminino',
    preco: 8000,
    duracao_minutos: 45,
    categoria: 'Cabelo',
  },
  {
    id: 'serv-2',
    nome: 'Corte Masculino',
    preco: 4500,
    duracao_minutos: 30,
    categoria: 'Cabelo',
  },
  {
    id: 'serv-3',
    nome: 'Escova Progressiva',
    preco: 15000,
    duracao_minutos: 120,
    categoria: 'Cabelo',
  },
  {
    id: 'serv-4',
    nome: 'Coloração',
    preco: 12000,
    duracao_minutos: 90,
    categoria: 'Cabelo',
  },
  {
    id: 'serv-5',
    nome: 'Barba',
    preco: 3500,
    duracao_minutos: 20,
    categoria: 'Barba',
  },
  {
    id: 'serv-6',
    nome: 'Manicure',
    preco: 4000,
    duracao_minutos: 40,
    categoria: 'Unhas',
  },
  {
    id: 'serv-7',
    nome: 'Pedicure',
    preco: 5000,
    duracao_minutos: 50,
    categoria: 'Unhas',
  },
  {
    id: 'serv-8',
    nome: 'Hidratação',
    preco: 6000,
    duracao_minutos: 40,
    categoria: 'Tratamento',
  },
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
