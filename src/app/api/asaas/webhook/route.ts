import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload.event;
    const payment = payload.payment;

    console.log(`[Asaas Webhook] Evento recebido: ${event}`, {
      paymentId: payment?.id,
      externalReference: payment?.externalReference,
      status: payment?.status,
      value: payment?.value,
    });

    const salaoId = payment?.externalReference;

    if (!salaoId) {
      console.warn('[Asaas Webhook] Pagamento sem externalReference (salaoId). Ignorando atualização de salão.');
      return NextResponse.json({ received: true, message: 'No salaoId reference' });
    }

    // 1. Processa eventos de confirmação de pagamento
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const { error } = await supabase
        .from('saloes')
        .update({
          status_assinatura: 'ativo',
          asaas_payment_id: payment.id,
        })
        .eq('id', salaoId);

      if (error) {
        console.error('[Asaas Webhook] Erro ao ativar assinatura do salão:', error);
      } else {
        console.log(`[Asaas Webhook] Salão ${salaoId} ATIVADO com sucesso via Asaas.`);
      }
    }

    // 2. Processa eventos de atraso / inadimplência
    else if (event === 'PAYMENT_OVERDUE') {
      const { error } = await supabase
        .from('saloes')
        .update({
          status_assinatura: 'inadimplente',
        })
        .eq('id', salaoId);

      if (error) {
        console.error('[Asaas Webhook] Erro ao marcar salão como inadimplente:', error);
      }
    }

    // 3. Processa cancelamento / estorno
    else if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_DELETED') {
      const { error } = await supabase
        .from('saloes')
        .update({
          status_assinatura: 'inativo',
        })
        .eq('id', salaoId);

      if (error) {
        console.error('[Asaas Webhook] Erro ao desativar salão:', error);
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (error: any) {
    console.error('[Asaas Webhook Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno no processamento do webhook Asaas.' },
      { status: 500 }
    );
  }
}
