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
