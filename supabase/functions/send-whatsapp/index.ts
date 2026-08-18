import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normaliza o número de telefone adicionando DDI 55 se necessário.
 */
function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Converte data yyyy-mm-dd para dd/mm/yyyy
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('[send-whatsapp] Payload recebido:', JSON.stringify(payload));

    const {
      clienteNome,
      whatsapp,
      data,
      hora,
      servicos,
      profissionalNome,
      salaoNome,
      tipoEvento = 'novo_agendamento',
    } = payload;

    const formattedPhone = formatPhone(whatsapp);
    if (!formattedPhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Telefone inválido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Variáveis de ambiente da Evolution API
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL') || Deno.env.get('NEXT_PUBLIC_EVOLUTION_API_URL') || '';
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') || '';
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'studiobeauty';

    // Monta a mensagem interativa baseada no tipo de evento
    let messageText = '';
    const servicosFormatados = Array.isArray(servicos) ? servicos.join(', ') : servicos || 'Atendimento';
    const dataFormatada = formatDate(data);
    const nomeEstabelecimento = salaoNome || 'Studio Beauty';

    if (tipoEvento === 'novo_agendamento') {
      messageText = `Olá *${clienteNome}*! 👋

Seu agendamento em *${nomeEstabelecimento}* foi realizado com sucesso!

📅 *Data:* ${dataFormatada}
⏰ *Horário:* ${hora}
💇‍♀️ *Serviços:* ${servicosFormatados}
👤 *Profissional:* ${profissionalNome}

Por favor, responda a esta mensagem com o número da opção desejada:

1️⃣ - Confirmo presença ✅
2️⃣ - Desejo cancelar / remarcar ❌`;
    } else if (tipoEvento === 'confirmacao') {
      messageText = `Olá *${clienteNome}*! ✅ Seu agendamento em *${nomeEstabelecimento}* para o dia ${dataFormatada} às ${hora} foi *CONFIRMADO*! Te esperamos!`;
    } else {
      messageText = `Olá *${clienteNome}*! Lembramos do seu agendamento em *${nomeEstabelecimento}* dia ${dataFormatada} às ${hora}. Te esperamos!`;
    }

    console.log(`[send-whatsapp] Enviando mensagem para ${formattedPhone} via Evolution API (${instanceName})...`);

    // Se a Evolution API estiver configurada no ambiente do Supabase Secrets
    if (evolutionApiUrl && evolutionApiKey) {
      const targetUrl = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;

      const evolutionRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: messageText,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false,
          },
        }),
      });

      const evolutionData = await evolutionRes.json();
      console.log('[send-whatsapp] Resposta da Evolution API:', evolutionData);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Mensagem enviada via Evolution API',
          data: evolutionData,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.warn('[send-whatsapp] Evolution API URL ou API Key não configuradas no Supabase Secrets. Mensagem simulada.');
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          messageText,
          message: 'Notificação simulada (configure EVOLUTION_API_URL e EVOLUTION_API_KEY no Supabase Secrets).',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    console.error('[send-whatsapp] Erro na Edge Function:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Erro interno ao enviar notificação.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
