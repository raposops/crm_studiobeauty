import type { Profissional, Servico, Cliente, Agendamento, ProdutoExtra, LancamentoFinanceiro, ComissaoProfissional } from '@/types';

// ==========================================
// Base Arrays (100% Sincronizados com o BD)
// ==========================================
export const PROFISSIONAIS: Profissional[] = [];
export const SERVICOS: Servico[] = [];
export const PRODUTOS_EXTRAS: ProdutoExtra[] = [];
export const CLIENTES: Cliente[] = [];
export const AGENDAMENTOS_MOCK: Agendamento[] = [];
export const LANCAMENTOS_MOCK: LancamentoFinanceiro[] = [];

// ========================
// Configuração & Helpers
// ========================
export const COMISSAO_PERCENTUAL = 40; // 40% padrão caso não configurado

export const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

export function formatCurrency(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((centavos || 0) / 100);
}

export function calcularComissao(valorTotal: number, comissaoPct: number = COMISSAO_PERCENTUAL): {
  comissao: number;
  liquido: number;
} {
  const comissao = Math.round((valorTotal * comissaoPct) / 100);
  return { comissao, liquido: valorTotal - comissao };
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
    if (!lanc.profissional) continue;
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
