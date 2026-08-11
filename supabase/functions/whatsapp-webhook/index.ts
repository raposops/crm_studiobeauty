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

    // 2. Extrai e faz o parse do Payload do Webhook
    const payload = await req.json();
    console.log('[WhatsApp Webhook] Payload recebido:', JSON.stringify(payload));

    // Suporte flexível para múltiplos provedores (Evolution API, Z-API, Baileys, Meta Cloud API)
    const rawPhone =
      payload.remoteJid ||
      payload.phone ||
      payload.from ||
      payload.number ||
      payload.sender ||
      payload.key?.remoteJid ||
      payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
      '';

    const rawMessage =
      payload.messageText ||
      payload.text?.body ||
      payload.text ||
      payload.body ||
      payload.message ||
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

    // 4. Busca o Cliente no Banco de Dados
    // Faz a busca buscando números de telefone parecidos (com ou sem DDD 55, caracteres)
    const { data: clientes, error: clientErr } = await supabase
      .from('clientes')
      .select('id, nome, telefone_whatsapp')
      .limit(50);

    if (clientErr) {
      console.error('[WhatsApp Webhook] Erro ao buscar clientes:', clientErr);
      throw clientErr;
    }

    // Encontra o cliente cujo número limpo seja compatível
    const matchingClient = (clientes || []).find((c) => {
      const cPhone = cleanPhoneNumber(c.telefone_whatsapp || '');
      return cPhone.endsWith(clientPhone.slice(-8)) || clientPhone.endsWith(cPhone.slice(-8));
    });

    if (!matchingClient) {
      console.log(`[WhatsApp Webhook] Nenhum cliente encontrado para o telefone: ${clientPhone}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Cliente não encontrado no cadastro do salão.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WhatsApp Webhook] Cliente identificado: ${matchingClient.nome} (ID: ${matchingClient.id})`);

    // 5. Busca o agendamento pendente mais recente do cliente
    const nowIso = new Date().toISOString();

    const { data: agendamentos, error: agendamentoErr } = await supabase
      .from('agendamentos')
      .select('id, status, data, hora_inicio, data_hora_inicio')
      .eq('cliente_id', matchingClient.id)
      .in('status', ['agendado', 'confirmado'])
      .order('data_hora_inicio', { ascending: true })
      .limit(1);

    if (agendamentoErr) {
      console.error('[WhatsApp Webhook] Erro ao buscar agendamentos:', agendamentoErr);
      throw agendamentoErr;
    }

    const agendamentoAlvo = agendamentos && agendamentos.length > 0 ? agendamentos[0] : null;

    if (!agendamentoAlvo) {
      console.log(`[WhatsApp Webhook] Nenhum agendamento pendente encontrado para a cliente ${matchingClient.nome}`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nenhum agendamento pendente encontrado para este cliente.',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
