import { supabase } from '@/lib/supabase';

export interface WhatsAppNotificationPayload {
  agendamentoId: string;
  clienteNome: string;
  whatsapp: string;
  data: string;
  hora: string;
  servicos: string[];
  profissionalNome: string;
  status: string;
  tipoEvento: 'novo_agendamento' | 'confirmacao' | 'lembrete';
}

/**
 * Dispara uma mensagem via Edge Function / Webhook do Supabase para integração com WhatsApp API.
 */
export async function triggerWhatsAppNotification(
  payload: WhatsAppNotificationPayload
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('[WhatsApp Notification] Disparando evento:', payload);

    // 1. Tenta invocar via Supabase Edge Function 'send-whatsapp'
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: payload,
    });

    if (error) {
      console.warn(
        '[WhatsApp Notification] Edge Function warning/error (pode requerer deploy no Supabase):',
        error.message
      );
    }

    // 2. Opcional: Se houver URL de Webhook configurada via var de ambiente
    const webhookUrl = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    return {
      success: true,
      message: 'Notificação enviada / registrada com sucesso',
    };
  } catch (err) {
    console.error('[WhatsApp Notification] Erro ao disparar webhook:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}
