import { getLocalDateString, parseLocalDateString, formatBRDate } from './dateUtils';

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export interface ProximoVencimentoInfo {
  tipo: 'trial' | 'convencional';
  dataVencimentoStr: string;
  dataVencimentoBR: string;
  diffDays: number;
  expirado: boolean;
  statusCalculado: 'em_dia' | 'vence_hoje' | 'vencido' | 'aviso_3_dias';
}

export function calcularProximoVencimento(salao: any): ProximoVencimentoInfo {
  const todayStr = getLocalDateString(new Date());
  const today = parseLocalDateString(todayStr);

  const status = salao.status_assinatura || 'ativo';

  if (status === 'trial' && salao.trial_ate) {
    const dataVencimentoStr = getLocalDateString(new Date(salao.trial_ate));
    const vencDate = parseLocalDateString(dataVencimentoStr);
    const diffDays = Math.round((vencDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expirado = diffDays < 0;

    let statusCalculado: ProximoVencimentoInfo['statusCalculado'] = 'em_dia';
    if (diffDays === 0) statusCalculado = 'vence_hoje';
    else if (diffDays === 3) statusCalculado = 'aviso_3_dias';
    else if (expirado) statusCalculado = 'vencido';

    return {
      tipo: 'trial',
      dataVencimentoStr,
      dataVencimentoBR: formatBRDate(dataVencimentoStr),
      diffDays,
      expirado,
      statusCalculado,
    };
  }

  // Plano convencional ativo ou inadimplente (ciclo mensal de renovação)
  const baseDate = salao.criado_em ? new Date(salao.criado_em) : new Date();
  const anniversaryDay = Math.min(Math.max(baseDate.getDate(), 1), 28); // Limita até dia 28 para evitar estouros de mês

  const year = today.getFullYear();
  const month = today.getMonth();

  // Candidato de renovação para o mês atual
  let candidateDate = new Date(year, month, anniversaryDay, 12, 0, 0, 0);

  // Se a data deste mês já passou há mais de 1 dia, o próximo ciclo é no mês seguinte
  const diffFromThisMonth = Math.round((candidateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffFromThisMonth < 0) {
    candidateDate = new Date(year, month + 1, anniversaryDay, 12, 0, 0, 0);
  }

  const dataVencimentoStr = getLocalDateString(candidateDate);
  const diffDays = Math.round((candidateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const expirado = diffDays < 0;

  let statusCalculado: ProximoVencimentoInfo['statusCalculado'] = 'em_dia';
  if (diffDays === 0) statusCalculado = 'vence_hoje';
  else if (diffDays === 3) statusCalculado = 'aviso_3_dias';
  else if (expirado) statusCalculado = 'vencido';

  return {
    tipo: 'convencional',
    dataVencimentoStr,
    dataVencimentoBR: formatBRDate(dataVencimentoStr),
    diffDays,
    expirado,
    statusCalculado,
  };
}
