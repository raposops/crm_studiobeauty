import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const salaoId = searchParams.get('salaoId');

    if (!salaoId) {
      return NextResponse.json(
        { error: 'Parâmetro salaoId é obrigatório.' },
        { status: 400 }
      );
    }

    const { data: salao, error } = await supabase
      .from('saloes')
      .select('id, nome, plano, status_assinatura, asaas_payment_id')
      .eq('id', salaoId)
      .single();

    if (error || !salao) {
      return NextResponse.json(
        { error: 'Salão não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: salao.status_assinatura || 'pendente',
      isAtivo: salao.status_assinatura === 'ativo',
      salao,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar status.' },
      { status: 500 }
    );
  }
}
