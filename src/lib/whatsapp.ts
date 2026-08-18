import { supabase } from '@/lib/supabase';

export interface WhatsAppNotificationPayload {
  agendamentoId: string;
  clienteNome: string;
  whatsapp: string;
  data: string;
  hora: string;
  servicos: string[];
  profissionalNome: string;
  salaoNome?: string;
  status: string;
  tipoEvento: 'novo_agendamento' | 'confirmacao' | 'lembrete';
}

function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Dispara uma mensagem via Edge Function ou fallback direto para a Evolution API.
 */
export async function triggerWhatsAppNotification(
  payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('[WhatsApp Notification] Disparando evento:', payload);

    const phoneRaw = payload.whatsapp || (payload as any).telefone_whatsapp || '';
    const formattedPhone = formatPhone(phoneRaw);

    if (!formattedPhone) {
      console.warn('[WhatsApp Notification] Número de WhatsApp não fornecido ou inválido:', phoneRaw);
      return { success: false, message: 'Número de WhatsApp inválido ou em branco.' };
    }

    const payloadNormalized = {
      ...payload,
      whatsapp: formattedPhone,
    };

    // 1. Tenta invocar via Supabase Edge Function 'send-whatsapp'
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: payloadNormalized,
      });

      if (!error && data?.success) {
        console.log('[WhatsApp Notification] Notificação enviada via Edge Function:', data);
        return { success: true, message: 'Mensagem enviada via Supabase Edge Function' };
      }

      if (error) {
        console.warn('[WhatsApp Notification] Edge Function indisponível ou com erro:', error.message);
      }
    } catch (edgeErr: any) {
      console.warn('[WhatsApp Notification] Falha ao chamar Edge Function:', edgeErr?.message);
    }

    // 2. Fallback direto para Evolution API
    const evolutionApiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || '';
    const evolutionApiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || '';
    const instanceName = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME || 'studiobeauty';

    if (evolutionApiUrl && evolutionApiKey) {
      const dataFormatada = formatDate(payload.data);
      const servicosFormatados = Array.isArray(payload.servicos) ? payload.servicos.join(', ') : payload.servicos || 'Atendimento';
      const nomeEstabelecimento = payload.salaoNome || 'Studio Beauty';

      let messageText = '';
      if (payload.tipoEvento === 'novo_agendamento') {
        messageText = `Olá *${payload.clienteNome}*! 👋

Seu agendamento em *${nomeEstabelecimento}* foi realizado com sucesso!

📅 *Data:* ${dataFormatada}
⏰ *Horário:* ${payload.hora}
💇‍♀️ *Serviços:* ${servicosFormatados}
👤 *Profissional:* ${payload.profissionalNome}

Por favor, responda a esta mensagem com o número da opção desejada:

1️⃣ - Confirmo presença ✅
2️⃣ - Desejo cancelar / remarcar ❌`;
      } else if (payload.tipoEvento === 'confirmacao') {
        messageText = `Olá *${payload.clienteNome}*! ✅ Seu agendamento em *${nomeEstabelecimento}* para o dia ${dataFormatada} às ${payload.hora} foi *CONFIRMADO*! Te esperamos!`;
      } else {
        messageText = `Olá *${payload.clienteNome}*! Lembramos do seu agendamento em *${nomeEstabelecimento}* dia ${dataFormatada} às ${payload.hora}. Te esperamos!`;
      }

      const targetUrl = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;
      console.log(`[WhatsApp Notification] Enviando via Evolution API (${targetUrl}) para ${formattedPhone}...`);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: messageText,
          options: { delay: 1200, presence: 'composing', linkPreview: false },
        }),
      });

      const evoData = await res.json();
      console.log('[WhatsApp Notification] Resposta Evolution API:', evoData);
      return { success: true, message: 'Mensagem enviada via Evolution API' };
    }

    return {
      success: false,
      message: 'Evolution API não configurada em .env.local (EVOLUTION_API_URL / EVOLUTION_API_KEY)',
    };
  } catch (err) {
    console.error('[WhatsApp Notification] Erro ao disparar notificação:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}

/**
 * Envia uma mensagem de texto direta para qualquer WhatsApp (usada para avisos ao administrador)
 */
export async function sendDirectWhatsAppMessage({
  phone,
  message,
}: {
  phone: string;
  message: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const formattedPhone = formatPhone(phone);
    if (!formattedPhone) return { success: false, error: 'Telefone inválido' };

    const evolutionApiUrl =
      process.env.NEXT_PUBLIC_EVOLUTION_API_URL ||
      process.env.EVOLUTION_API_URL ||
      'https://evo.fidustecnologia.com.br';
    const evolutionApiKey =
      process.env.NEXT_PUBLIC_EVOLUTION_API_KEY ||
      process.env.EVOLUTION_API_KEY ||
      '9858375C8262-4CCB-83D2-E66974D498A1';
    const instanceName =
      process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME ||
      process.env.EVOLUTION_INSTANCE_NAME ||
      'fidus';

    const targetUrl = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evolutionApiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
        options: { delay: 1200, presence: 'composing', linkPreview: false },
      }),
    });

    const data = await res.json().catch(() => null);
    return { success: res.ok, data };
  } catch (err: any) {
    console.error('Erro ao enviar mensagem WhatsApp direta:', err);
    return { success: false, error: err?.message };
  }
}
