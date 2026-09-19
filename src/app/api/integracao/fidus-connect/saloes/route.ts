import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcularProximoVencimento, formatPhone } from '@/lib/assinaturas';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, X-API-KEY, x-api-secret, X-API-SECRET, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function validarAutenticacao(req: NextRequest): boolean {
  const expectedKey = process.env.FIDUS_CONNECT_API_KEY || 'fidus_sec_studiobeauty_2026_x9k2';

  // 1. Header x-api-key ou x-api-secret (case-insensitive via req.headers.get)
  const headerApiKey = req.headers.get('x-api-key');
  const headerApiSecret = req.headers.get('x-api-secret');
  if (
    (headerApiKey && headerApiKey.trim() === expectedKey.trim()) ||
    (headerApiSecret && headerApiSecret.trim() === expectedKey.trim())
  ) {
    return true;
  }

  // 2. Header Authorization: Bearer <key>
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token?.trim() === expectedKey.trim()) {
      return true;
    }
  }

  // 3. Query param opcional ?api_key= ou ?api_secret= (facilita testes diretos)
  const url = new URL(req.url);
  const queryApiKey = url.searchParams.get('api_key') || url.searchParams.get('api_secret');
  if (queryApiKey && queryApiKey.trim() === expectedKey.trim()) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!validarAutenticacao(req)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Não autorizado. Chave de API inválida ou ausente.',
        ajuda: 'Envie a chave no cabeçalho "x-api-key" ou "Authorization: Bearer <chave>"',
      },
      {
        status: 401,
        headers: CORS_HEADERS,
      }
    );
  }

  try {
    // 1. Busca todos os salões
    const { data: saloes, error: saloesError } = await supabase
      .from('saloes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (saloesError) {
      return NextResponse.json(
        { success: false, error: saloesError.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // 2. Busca totais de profissionais, agendamentos e clientes para métricas
    const [{ data: profs }, { data: agends }, { data: clientes }] = await Promise.all([
      supabase.from('profissionais').select('salao_id, ativo'),
      supabase.from('agendamentos').select('salao_id, status'),
      supabase.from('clientes').select('salao_id'),
    ]);

    const profMap = new Map<string, number>();
    profs?.forEach((p: any) => {
      if (p.ativo !== false) {
        profMap.set(p.salao_id, (profMap.get(p.salao_id) || 0) + 1);
      }
    });

    const agendMap = new Map<string, number>();
    agends?.forEach((a: any) => {
      agendMap.set(a.salao_id, (agendMap.get(a.salao_id) || 0) + 1);
    });

    const clientMap = new Map<string, number>();
    clientes?.forEach((c: any) => {
      clientMap.set(c.salao_id, (clientMap.get(c.salao_id) || 0) + 1);
    });

    // 3. Monta retorno formatado com estatísticas de renovação
    let countAtivos = 0;
    let countTrial = 0;
    let countInadimplentes = 0;
    let countAVencerEmBreve = 0;
    let countVencidos = 0;

    const saloesFormatados = (saloes || []).map((salao: any) => {
      const vencimento = calcularProximoVencimento(salao);
      const modulos = salao.modulos_ativos && typeof salao.modulos_ativos === 'object' ? salao.modulos_ativos : {};
      const followups = modulos._followups && typeof modulos._followups === 'object' ? modulos._followups : {};

      const statusAssinatura = salao.status_assinatura || 'ativo';
      if (statusAssinatura === 'ativo') countAtivos++;
      else if (statusAssinatura === 'trial') countTrial++;
      else if (statusAssinatura === 'inadimplente') countInadimplentes++;

      if (vencimento.diffDays <= 3 && vencimento.diffDays >= 0) {
        countAVencerEmBreve++;
      }
      if (vencimento.expirado) {
        countVencidos++;
      }

      return {
        id: salao.id,
        nome: salao.nome,
        slug: salao.slug,
        documento: salao.cnpj_cpf || null,
        email: salao.email || null,
        telefone_whatsapp: salao.telefone_whatsapp || null,
        telefone_formatado: formatPhone(salao.telefone_whatsapp || ''),
        cidade: salao.cidade || null,
        estado: salao.estado || null,
        endereco: salao.endereco || null,
        plano: salao.plano || 'pro',
        status_assinatura: statusAssinatura,
        trial_ate: salao.trial_ate || null,
        asaas_customer_id: salao.asaas_customer_id || null,
        asaas_payment_id: salao.asaas_payment_id || null,
        criado_em: salao.criado_em,
        atualizado_em: salao.atualizado_em || null,

        // Dados calculados de renovação
        renovacao: {
          tipo: vencimento.tipo,
          data_vencimento: vencimento.dataVencimentoStr,
          data_vencimento_br: vencimento.dataVencimentoBR,
          dias_restantes: vencimento.diffDays,
          expirado: vencimento.expirado,
          status_calculado: vencimento.statusCalculado,
        },

        // Follow-ups de renovação enviados
        followups_renovacao: {
          aviso_3_dias: followups.aviso_3_dias || { enviado: false },
          aviso_dia_vencimento: followups.aviso_dia_vencimento || { enviado: false },
          historico_completo: followups,
        },

        // Métricas básicas
        metricas: {
          total_profissionais: profMap.get(salao.id) || 0,
          total_agendamentos: agendMap.get(salao.id) || 0,
          total_clientes: clientMap.get(salao.id) || 0,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        total_saloes: saloesFormatados.length,
        resumo: {
          ativos: countAtivos,
          trial: countTrial,
          inadimplentes: countInadimplentes,
          a_vencer_em_breve: countAVencerEmBreve,
          vencidos: countVencidos,
        },
        saloes: saloesFormatados,
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error: any) {
    console.error('[API Fidus Connect - Salões] Erro:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno do servidor' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
