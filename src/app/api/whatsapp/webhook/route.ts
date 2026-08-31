import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Palavras-chave para Confirmação e Cancelamento
const CONFIRM_KEYWORDS = ['1', 'sim', 'confirmo', 'ok', 'com certeza', 'confirmar', 'sim confirmo', 'certo'];
const CANCEL_KEYWORDS = ['2', 'nao', 'não', 'cancelar', 'remarcar', 'nao poderei', 'não poderei', 'cancela'];

function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/@.*$/, '').replace(/\D/g, '');
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `55${digitsOnly}`;
  }
  return digitsOnly;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('[WhatsApp Webhook Route] Payload recebido:', JSON.stringify(payload));

    const dataObj = payload.data || payload;
    const keyObj = dataObj.key || payload.key || {};

    // Ignora mensagens enviadas pelo próprio sistema/salão
    if (keyObj.fromMe === true) {
      return NextResponse.json({ success: true, action: 'ignored', message: 'Mensagem de saída ignorada.' });
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

    console.log(`[WhatsApp Webhook Route] Telefone: ${clientPhone} | Mensagem: "${rawMessage}" (normalizado: "${textNormalized}")`);

    if (!clientPhone) {
      return NextResponse.json({ success: false, message: 'Número de telefone não identificado.' }, { status: 400 });
    }

    // Identifica se é Confirmação ou Cancelamento
    const isConfirm =
      textNormalized === '1' ||
      textNormalized.startsWith('1') ||
      textNormalized.includes('confirm') ||
      textNormalized.includes('opcao 1') ||
      CONFIRM_KEYWORDS.some((kw) => textNormalized === kw || textNormalized.includes(kw));

    const isCancel =
      !isConfirm && (
        textNormalized === '2' ||
        textNormalized.startsWith('2') ||
        textNormalized.includes('cancel') ||
        textNormalized.includes('remarc') ||
        textNormalized.includes('opcao 2') ||
        CANCEL_KEYWORDS.some((kw) => textNormalized === kw || textNormalized.includes(kw))
      );

    if (!isConfirm && !isCancel) {
      return NextResponse.json({
        success: true,
        action: 'ignored',
        message: 'Mensagem recebida, mas não continha comando de confirmação/cancelamento.',
      });
    }

    // Busca agendamentos pendentes vinculados a clientes com este número
    const { data: agendamentos, error: agendamentoErr } = await supabase
      .from('agendamentos')
      .select('id, status, data, hora_inicio, salao_id, cliente:clientes!inner(id, nome, telefone_whatsapp), salao:saloes(id, nome, telefone_whatsapp)')
      .in('status', ['agendado', 'confirmado'])
      .order('criado_em', { ascending: false });

    if (agendamentoErr) {
      console.error('[WhatsApp Webhook Route] Erro ao buscar agendamentos:', agendamentoErr);
      return NextResponse.json({ error: agendamentoErr.message }, { status: 500 });
    }

    const last8 = clientPhone.slice(-8);
    const agendamentoAlvo = (agendamentos || []).find((ag: any) => {
      const cPhone = cleanPhoneNumber(ag.cliente?.telefone_whatsapp || '');
      return cPhone.endsWith(last8);
    });

    if (!agendamentoAlvo) {
      console.log(`[WhatsApp Webhook Route] Nenhum agendamento pendente para: ${clientPhone}`);
      return NextResponse.json({
        success: false,
        message: 'Nenhum agendamento pendente encontrado para este telefone.',
      }, { status: 404 });
    }

    const matchingClient = (agendamentoAlvo as any).cliente;
    const salaoNome = (agendamentoAlvo as any).salao?.nome || 'Salão Fidus';
    const salaoTelefone = cleanPhoneNumber((agendamentoAlvo as any).salao?.telefone_whatsapp || '');

    const novoStatus = isConfirm ? 'confirmado' : 'cancelado';

    const { error: updateErr } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', agendamentoAlvo.id);

    if (updateErr) {
      console.error('[WhatsApp Webhook Route] Erro ao atualizar status:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    console.log(`[WhatsApp Webhook Route] Agendamento ${agendamentoAlvo.id} atualizado para '${novoStatus}'.`);

    // Dispara mensagens via Evolution API
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

    const dataFormatted = formatDate(agendamentoAlvo.data);
    const horaFormatted = agendamentoAlvo.hora_inicio || '';
    const clienteNome = matchingClient?.nome || 'Cliente';

    let replyMessageText = '';
    let ownerNotificationText = '';

    if (isConfirm) {
      replyMessageText = `Olá *${clienteNome}*! ✅

Seu agendamento em *${salaoNome}* para dia *${dataFormatted}* às *${horaFormatted}* foi *CONFIRMADO* com sucesso!

Te esperamos! Caso precise de alguma informação, estamos à disposição. 😊`;

      ownerNotificationText = `✅ *Presença Confirmada pelo Cliente!*

A cliente confirmou presença no agendamento:

👤 *Cliente:* ${clienteNome}
📱 *WhatsApp:* ${clientPhone}
📅 *Data:* ${dataFormatted}
⏰ *Horário:* ${horaFormatted}
🏢 *Salão:* ${salaoNome}

O status do agendamento foi atualizado para *Confirmado* no sistema! 🚀`;
    } else {
      replyMessageText = `Olá *${clienteNome}*! ❌

Seu agendamento em *${salaoNome}* para dia *${dataFormatted}* às *${horaFormatted}* foi *CANCELADO* conforme solicitado.

Caso deseje remarcar um novo horário, acesse nosso link de agendamento online ou fale conosco! 💅✨`;

      ownerNotificationText = `⚠️ *Agendamento Cancelado pelo Cliente!*

A cliente informou que não comparecerá:

👤 *Cliente:* ${clienteNome}
📱 *WhatsApp:* ${clientPhone}
📅 *Data:* ${dataFormatted}
⏰ *Horário:* ${horaFormatted}
🏢 *Salão:* ${salaoNome}

O horário foi liberado na agenda do sistema.`;
    }

    const targetUrl = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;

    // 1. Envia resposta para o cliente
    try {
      console.log(`[WhatsApp Webhook Route] Enviando resposta para cliente (${clientPhone})...`);
      await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evolutionApiKey,
        },
        body: JSON.stringify({
          number: clientPhone,
          text: replyMessageText,
          options: { delay: 1000, presence: 'composing', linkPreview: false },
        }),
      });
    } catch (sendErr) {
      console.error('[WhatsApp Webhook Route] Erro ao enviar resposta para cliente:', sendErr);
    }

    // 2. Envia notificação para o WhatsApp do Salão
    if (salaoTelefone) {
      try {
        console.log(`[WhatsApp Webhook Route] Enviando notificação para o salão (${salaoTelefone})...`);
        await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: salaoTelefone,
            text: ownerNotificationText,
            options: { delay: 1200, presence: 'composing', linkPreview: false },
          }),
        });
      } catch (ownerErr) {
        console.error('[WhatsApp Webhook Route] Erro ao enviar notificação para o salão:', ownerErr);
      }
    }

    return NextResponse.json({
      success: true,
      status: novoStatus,
      agendamento_id: agendamentoAlvo.id,
      cliente: matchingClient?.nome,
    });
  } catch (err: any) {
    console.error('[WhatsApp Webhook Route] Erro:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
