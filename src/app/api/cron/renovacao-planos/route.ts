import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLocalDateString, parseLocalDateString, formatBRDate } from '@/lib/dateUtils';

function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

interface NotificationCandidate {
  salaoId: string;
  salaoNome: string;
  tipo: 'trial' | 'convencional';
  dataVencimentoStr: string;
  dataVencimentoBR: string;
  diffDays: number;
  plano: string;
  planoNome: string;
  telefone: string;
  motivo: string;
}

function calcularProximoVencimento(salao: any): {
  tipo: 'trial' | 'convencional';
  dataVencimentoStr: string;
  diffDays: number;
} {
  const todayStr = getLocalDateString(new Date());
  const today = parseLocalDateString(todayStr);

  const status = salao.status_assinatura || 'ativo';

  if (status === 'trial' && salao.trial_ate) {
    const dataVencimentoStr = getLocalDateString(new Date(salao.trial_ate));
    const vencDate = parseLocalDateString(dataVencimentoStr);
    const diffDays = Math.round((vencDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      tipo: 'trial',
      dataVencimentoStr,
      diffDays,
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

  return {
    tipo: 'convencional',
    dataVencimentoStr,
    diffDays,
  };
}

async function processarNotificacoes(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salaoIdParam = searchParams.get('salaoId');
    const isPreview = searchParams.get('preview') === 'true';
    const isForce = searchParams.get('force') === 'true';

    console.log(`[Cron Renovação Planos] Iniciando verificação. (Preview: ${isPreview}, Salão: ${salaoIdParam || 'Todos'}, Force: ${isForce})`);

    // 1. Busca todos os salões cadastrados
    let query = supabase.from('saloes').select('*');
    if (salaoIdParam) {
      query = query.eq('id', salaoIdParam);
    }

    const { data: saloes, error: salaoErr } = await query;
    if (salaoErr) {
      console.error('[Cron Renovação Planos] Erro ao consultar salões:', salaoErr);
      return NextResponse.json({ success: false, error: salaoErr.message }, { status: 500 });
    }

    if (!saloes || saloes.length === 0) {
      return NextResponse.json({
        success: true,
        totalAnalisados: 0,
        totalElegiveis: 0,
        totalEnviados: 0,
        message: 'Nenhum salão encontrado para processamento.',
      });
    }

    // 2. Filtra os candidatos elegíveis para notificação (3 dias antes ou no dia do vencimento)
    const candidatos: NotificationCandidate[] = [];

    for (const salao of saloes) {
      const { tipo, dataVencimentoStr, diffDays } = calcularProximoVencimento(salao);

      const isElegivel = isForce || diffDays === 3 || diffDays === 0;

      if (isElegivel) {
        const plano = salao.plano || 'pro';
        const planoNome = plano === 'basico' ? 'Plano Básico' : 'Plano PRO';
        const formattedPhone = formatPhone(salao.telefone_whatsapp || '');

        let motivo = '';
        if (diffDays === 3) motivo = 'Vence em 3 dias';
        else if (diffDays === 0) motivo = 'Vence hoje';
        else if (diffDays < 0) motivo = `Vencido há ${Math.abs(diffDays)} dias`;
        else motivo = `Vence em ${diffDays} dias (disparo forçado)`;

        candidatos.push({
          salaoId: salao.id,
          salaoNome: salao.nome,
          tipo,
          dataVencimentoStr,
          dataVencimentoBR: formatBRDate(dataVencimentoStr),
          diffDays,
          plano,
          planoNome,
          telefone: formattedPhone,
          motivo,
        });
      }
    }

    // Se estiver em modo preview, apenas retorna a lista calculada sem disparar mensagens
    if (isPreview) {
      return NextResponse.json({
        success: true,
        modo: 'preview',
        totalAnalisados: saloes.length,
        totalElegiveis: candidatos.length,
        candidatos,
      });
    }

    if (candidatos.length === 0) {
      return NextResponse.json({
        success: true,
        totalAnalisados: saloes.length,
        totalElegiveis: 0,
        totalEnviados: 0,
        message: 'Nenhum salão com vencimento para 3 dias ou hoje.',
      });
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
    const enviados: any[] = [];
    const falhas: any[] = [];

    // 4. Itera e envia a mensagem para cada salão elegível
    for (const cand of candidatos) {
      if (!cand.telefone) {
        falhas.push({
          salaoId: cand.salaoId,
          salaoNome: cand.salaoNome,
          motivo: 'Salão não possui telefone de WhatsApp cadastrado.',
        });
        continue;
      }

      const linkAssinatura = `https://crmstudio.fidustecnologia.com.br/assinar?salaoId=${cand.salaoId}&plano=${cand.plano}`;

      let messageText = '';

      if (cand.tipo === 'trial') {
        if (cand.diffDays === 0) {
          messageText = `Olá, equipe do *${cand.salaoNome}*! 💜

Hoje (📅 ${cand.dataVencimentoBR}) é o *último dia* do seu período de teste no *CRM Studio Beauty*.

Para não perder o acesso às funcionalidades e manter seus agendamentos, clientes e finanças ativos, finalize sua assinatura agora mesmo:
👉 ${linkAssinatura}

Se precisar de qualquer ajuda ou suporte com seu salão, conte com a gente! ✨`;
        } else {
          messageText = `Olá, equipe do *${cand.salaoNome}*! 💜

Passando para lembrar que seu período de teste no *CRM Studio Beauty* encerra em *3 dias* (📅 ${cand.dataVencimentoBR}).

Para garantir que sua agenda, clientes e equipe continuem funcionando sem interrupção, escolha seu plano e ative sua assinatura:
👉 ${linkAssinatura}

Qualquer dúvida, estamos à disposição para te ajudar! ✨`;
        }
      } else {
        // Convencional
        if (cand.diffDays === 0) {
          messageText = `Olá, equipe do *${cand.salaoNome}*! 💜

Hoje (📅 ${cand.dataVencimentoBR}) é a data de renovação da mensalidade do seu *${cand.planoNome}* no *CRM Studio Beauty*.

Renove sua assinatura para continuar aproveitando todos os recursos e manter seu salão sempre em dia:
👉 ${linkAssinatura}

Agradecemos pela parceria de sempre! Caso precise de algo, estamos à disposição. ✨`;
        } else {
          messageText = `Olá, equipe do *${cand.salaoNome}*! 💜

Lembramos que a renovação mensal do seu *${cand.planoNome}* no *CRM Studio Beauty* vence em *3 dias* (📅 ${cand.dataVencimentoBR}).

Para manter todos os recursos ativos sem preocupação, você pode acessar e realizar o pagamento pelo link:
👉 ${linkAssinatura}

Muito obrigado pela confiança e parceria! ✨`;
        }
      }

      try {
        console.log(`[Cron Renovação Planos] Enviando aviso para ${cand.salaoNome} (${cand.telefone})...`);

        const evoRes = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionApiKey,
          },
          body: JSON.stringify({
            number: cand.telefone,
            text: messageText,
          }),
        });

        if (evoRes.ok) {
          enviados.push({
            salaoId: cand.salaoId,
            salaoNome: cand.salaoNome,
            telefone: cand.telefone,
            tipo: cand.tipo,
            diffDays: cand.diffDays,
          });
        } else {
          const errBody = await evoRes.text();
          falhas.push({
            salaoId: cand.salaoId,
            salaoNome: cand.salaoNome,
            motivo: `Erro Evolution API (HTTP ${evoRes.status}): ${errBody}`,
          });
        }
      } catch (err: any) {
        falhas.push({
          salaoId: cand.salaoId,
          salaoNome: cand.salaoNome,
          motivo: `Exceção de rede: ${err?.message}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalAnalisados: saloes.length,
      totalElegiveis: candidatos.length,
      totalEnviados: enviados.length,
      totalFalhas: falhas.length,
      enviados,
      falhas,
      message: `Processamento concluído: ${enviados.length} notificação(ões) enviada(s), ${falhas.length} falha(s).`,
    });
  } catch (error: any) {
    console.error('[Cron Renovação Planos] Erro interno:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Erro desconhecido' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return processarNotificacoes(req);
}

export async function POST(req: NextRequest) {
  return processarNotificacoes(req);
}
