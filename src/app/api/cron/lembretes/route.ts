import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

function getTomorrowDateStr(): string {
  // Data de amanhã considerando timezone de Brasília (-03:00)
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function processarLembretes(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get('targetDate') || getTomorrowDateStr();
    const salaoId = searchParams.get('salaoId');

    console.log(`[Cron Lembretes 24h] Iniciando busca para data: ${targetDate} (Salão: ${salaoId || 'Todos'})`);

    // 1. Busca agendamentos ativos para a data alvo que ainda não receberam o lembrete de 24h
    let query = supabase
      .from('agendamentos')
      .select(`
        id,
        data,
        hora_inicio,
        hora_fim,
        status,
        lembrete_24h_enviado,
        salao_id,
        cliente:clientes(*),
        profissional:profissionais(*),
        servico:servicos!agendamentos_servico_id_fkey(*),
        servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(*))
      `)
      .eq('data', targetDate)
      .in('status', ['agendado', 'confirmado'])
      .or('lembrete_24h_enviado.is.null,lembrete_24h_enviado.eq.false');

    if (salaoId) {
      query = query.eq('salao_id', salaoId);
    }

    const { data: agendamentos, error: agErr } = await query;

    if (agErr) {
      console.error('[Cron Lembretes 24h] Erro ao buscar agendamentos:', agErr);
      return NextResponse.json({ success: false, error: agErr.message }, { status: 500 });
    }

    if (!agendamentos || agendamentos.length === 0) {
      return NextResponse.json({
        success: true,
        targetDate,
        totalEncontrados: 0,
        totalEnviados: 0,
        message: 'Nenhum agendamento pendente de lembrete encontrado para amanhã.',
        detalhes: [],
      });
    }

    // 2. Busca salões para identificar nomes dos estabelecimentos
    const salaoIds = Array.from(new Set(agendamentos.map((ag: any) => ag.salao_id).filter(Boolean)));
    const salaoMap = new Map<string, any>();
    if (salaoIds.length > 0) {
      const { data: saloesData } = await supabase.from('saloes').select('*').in('id', salaoIds);
      (saloesData || []).forEach((s) => salaoMap.set(s.id, s));
    }

    // 3. Configurações da Evolution API
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
    const dataFormatada = formatDate(targetDate);
    const enviados: any[] = [];
    const falhas: any[] = [];

    // 4. Itera e envia a mensagem para cada cliente
    for (const ag of agendamentos) {
      const cliente = (ag as any).cliente;
      const salao = salaoMap.get(ag.salao_id);
      const profissional = (ag as any).profissional;
      const directServico = (ag as any).servico;
      const junctionServicos = (ag as any).servicos;

      const rawPhone = cliente?.telefone_whatsapp || cliente?.whatsapp || '';
      const formattedPhone = formatPhone(rawPhone);

      if (!formattedPhone) {
        console.warn(`[Cron Lembretes 24h] Agendamento ${ag.id} sem telefone válido (${rawPhone}). Ignorando.`);
        falhas.push({ id: ag.id, cliente: cliente?.nome, motivo: 'Telefone inválido' });
        continue;
      }

      const clienteNome = cliente?.nome || 'Cliente';
      const nomeEstabelecimento = salao?.nome || 'Salão de Beleza';
      const profNome = profissional?.nome || 'Equipe';
      
      let servicoNome = directServico?.nome || '';
      if (!servicoNome && Array.isArray(junctionServicos) && junctionServicos.length > 0) {
        servicoNome = junctionServicos.map((s: any) => s.servico?.nome).filter(Boolean).join(', ');
      }
      if (!servicoNome) servicoNome = 'Atendimento';

      const messageText = `Olá *${clienteNome}*! 💖

Passando para lembrar do seu agendamento de amanhã no *${nomeEstabelecimento}*:

📅 *Data:* ${dataFormatada} (Amanhã)
⏰ *Horário:* ${ag.hora_inicio}
💇‍♀️ *Serviço:* ${servicoNome}
👤 *Profissional:* ${profNome}

Estamos preparando tudo para te receber com muito carinho! Caso precise avisar algo ou remarcar, basta responder esta mensagem. ✨`;

      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: messageText,
            options: { delay: 1200, presence: 'composing', linkPreview: false },
          }),
        });

        if (res.ok) {
          // Marca o lembrete como enviado no banco de dados
          await supabase
            .from('agendamentos')
            .update({ lembrete_24h_enviado: true })
            .eq('id', ag.id);

          enviados.push({
            agendamentoId: ag.id,
            cliente: clienteNome,
            telefone: formattedPhone,
            horario: ag.hora_inicio,
            salao: nomeEstabelecimento,
          });
          console.log(`[Cron Lembretes 24h] Lembrete enviado com sucesso para ${clienteNome} (${formattedPhone})`);
        } else {
          const errData = await res.json().catch(() => null);
          falhas.push({ id: ag.id, cliente: clienteNome, erro: errData });
          console.error(`[Cron Lembretes 24h] Erro Evolution API para ${clienteNome}:`, errData);
        }
      } catch (sendErr: any) {
        falhas.push({ id: ag.id, cliente: clienteNome, erro: sendErr?.message });
        console.error(`[Cron Lembretes 24h] Exceção ao enviar para ${clienteNome}:`, sendErr);
      }
    }

    return NextResponse.json({
      success: true,
      targetDate,
      totalEncontrados: agendamentos.length,
      totalEnviados: enviados.length,
      totalFalhas: falhas.length,
      enviados,
      falhas,
      message: `${enviados.length} lembrete(s) de 24h disparado(s) com sucesso para o dia ${dataFormatada}.`,
    });
  } catch (err: any) {
    console.error('[Cron Lembretes 24h Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return processarLembretes(req);
}

export async function POST(req: NextRequest) {
  return processarLembretes(req);
}
