/**
 * Utilitários de Data para o CRM Studio Beauty
 * 
 * Evita o bug crítico de fuso horário UTC (UTC-3 Brasil), onde `toISOString().split('T')[0]` 
 * pula para o dia seguinte a partir das 21h ou atrasa 1 dia dependendo do contexto.
 */

/**
 * Retorna a data no formato 'YYYY-MM-DD' de acordo com o horário local (América/São Paulo).
 */
export function getLocalDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Retorna a data de hoje no formato 'YYYY-MM-DD' garantindo o horário de Brasília.
 */
export function getTodayDateString(): string {
  return getLocalDateString(new Date());
}

/**
 * Cria um objeto Date local seguro a partir de 'YYYY-MM-DD', fixando o horário ao meio-dia (12:00:00).
 * Isso evita qualquer transbordo de fuso horário (-03:00 / +00:00) ao somar, subtrair ou comparar dias.
 */
export function parseLocalDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

/**
 * Formata 'YYYY-MM-DD' para exibição amigável 'DD/MM/YYYY'.
 */
export function formatBRDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Retorna o ISO string correspondente ao início do dia (00:00:00.000) no horário de Brasília (UTC-3).
 * Ex: '2026-09-17' -> '2026-09-17T03:00:00.000Z'
 */
export function getStartOfDayBR(dateStr: string): string {
  return `${dateStr}T03:00:00.000Z`;
}

/**
 * Retorna o ISO string correspondente ao fim do dia (23:59:59.999) no horário de Brasília (UTC-3).
 * Ex: '2026-09-17' -> '2026-09-18T02:59:59.999Z'
 */
export function getEndOfDayBR(dateStr: string): string {
  const d = parseLocalDateString(dateStr);
  d.setDate(d.getDate() + 1);
  const nextDayStr = getLocalDateString(d);
  return `${nextDayStr}T02:59:59.999Z`;
}

/**
 * Converte data ('YYYY-MM-DD') e hora ('HH:MM' ou 'HH:MM:SS') no horário de Brasília para ISO UTC.
 * Ex: ('2026-09-17', '19:30') -> '2026-09-17T22:30:00.000Z'
 */
export function toISOFromBR(dateStr: string, timeStr: string = '12:00'): string {
  const safeTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${safeTime}-03:00`).toISOString();
}

