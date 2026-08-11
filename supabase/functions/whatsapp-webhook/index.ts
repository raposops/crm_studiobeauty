import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Headers CORS padrão para permitir chamadas de webhooks e navegadores
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Palavras-chave para Confirmação e Cancelamento
const CONFIRM_KEYWORDS = ['1', 'sim', 'confirmo', 'ok', 'com certeza', 'confirmar', 'sim confirmo', 'certo'];
const CANCEL_KEYWORDS = ['2', 'nao', 'não', 'cancelar', 'remarcar', 'nao poderei', 'não poderei', 'cancela'];

/**
 * Normaliza o número de telefone extraindo apenas os dígitos.
 * Lida com prefixos do WhatsApp (ex: 5551999998888@s.whatsapp.net -> 5551999998888)
 */
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/@.*$/, '').replace(/\D/g, '');
  
  // Se o número tiver 10 ou 11 dígitos (sem o código do país 55), adiciona 55
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `55${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Normaliza o texto removendo acentos, caracteres especiais e espaços extras.
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

serve(async (req) => {
  // Lida com preflight CORS (método OPTIONS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Inicializa o cliente Supabase com Service Role Key para ignorar RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Extrai e faz o parse do Payload do Webhook (Evolution API v1/v2 / Z-API / Baileys)
    const payload = await req.json();
    console.log('[WhatsApp Webhook] Payload recebido:', JSON.stringify(payload));

    const dataObj = payload.data || payload;
    const keyObj = dataObj.key || payload.key || {};

    // Ignora mensagens enviadas pelo próprio sistema/salão
    if (keyObj.fromMe === true) {
      console.log('[WhatsApp Webhook] Mensagem enviada pelo próprio salão (fromMe=true), ignorando.');
      return new Response(
        JSON.stringify({ success: true, action: 'ignored', message: 'Mensagem de saída ignorada.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawPhone =
      keyObj.remoteJid ||
      dataObj.remoteJid ||
      payload.remoteJid ||
      payload.phone ||
      payload.from ||
      payload.number ||
      payload.sender ||
      payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
      '';

    const msgObj = dataObj.message || payload.message || {};
    const rawMessage =
      (typeof payload.messageText === 'string' ? payload.messageText : '') ||
      msgObj.conversation ||
      msgObj.extendedTextMessage?.text ||
      msgObj.buttonsResponseMessage?.selectedButtonId ||
      msgObj.buttonsResponseMessage?.selectedDisplayText ||
      payload.text?.body ||
      payload.text ||
      payload.body ||
      payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
      '';

    const clientPhone = cleanPhoneNumber(rawPhone);
    const textNormalized = normalizeText(rawMessage);

    console.log(`[WhatsApp Webhook] Telefone extraído: ${clientPhone} | Mensagem: "${rawMessage}" (normalizado: "${textNormalized}")`);

    if (!clientPhone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Número de telefone não identificado no payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parser de Decisão (Confirmação vs Cancelamento)
    let isConfirm = CONFIRM_KEYWORDS.some((kw) => textNormalized === kw || textNormalized.startsWith(`${kw} `));
    let isCancel = CANCEL_KEYWORDS.some((kw) => textNormalized === kw || textNormalized.startsWith(`${kw} `));

    if (!isConfirm && !isCancel) {
      console.log('[WhatsApp Webhook] Mensagem não corresponde a nenhuma palavra-chave conhecida.');
      return new Response(
        JSON.stringify({
          success: true,
          action: 'ignored',
          message: 'Mensagem recebida, mas não continha comando de confirmação/cancelamento.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Busca os agendamentos pendentes vinculados a clientes com este número de telefone
    const { data: agendamentos, error: agendamentoErr } = await supabase
      .from('agendamentos')
      .select('id, status, data, hora_inicio, cliente:clientes!inner(id, nome, telefone_whatsapp)')
      .in('status', ['agendado', 'confirmado'])
      .order('criado_em', { ascending: false });

    if (agendamentoErr) {
      console.error('[WhatsApp Webhook] Erro ao buscar agendamentos:', agendamentoErr);
      throw agendamentoErr;
    }

    const last8 = clientPhone.slice(-8);
    const agendamentoAlvo = (agendamentos || []).find((ag: any) => {
      const cPhone = cleanPhoneNumber(ag.cliente?.telefone_whatsapp || '');
      return cPhone.endsWith(last8);
    });

    if (!agendamentoAlvo) {
      console.log(`[WhatsApp Webhook] Nenhum agendamento pendente encontrado para o telefone: ${clientPhone}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nenhum agendamento pendente encontrado para este telefone.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const matchingClient = agendamentoAlvo.cliente;
    console.log(`[WhatsApp Webhook] Agendamento encontrado para o cliente: ${matchingClient?.nome} (ID: ${agendamentoAlvo.id})`);

    // 6. Atualiza o status no PostgreSQL
    const novoStatus = isConfirm ? 'confirmado' : 'cancelado';

    const { error: updateErr } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', agendamentoAlvo.id);

    if (updateErr) {
      console.error('[WhatsApp Webhook] Erro ao atualizar status do agendamento:', updateErr);
      throw updateErr;
    }

    console.log(`[WhatsApp Webhook] Sucesso! Agendamento ${agendamentoAlvo.id} atualizado para status '${novoStatus}'.`);

    // 7. Retorna Resposta de Sucesso HTTP 200
    return new Response(
      JSON.stringify({
        success: true,
        status: novoStatus,
        agendamento_id: agendamentoAlvo.id,
        cliente: matchingClient.nome,
        message: `Agendamento marcado como ${novoStatus} com sucesso.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Erro na Edge Function:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Erro interno no servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
