import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';

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

      // Notifica o Administrador no WhatsApp sobre o novo pagamento
      try {
        const { data: salaoData } = await supabase
          .from('saloes')
          .select('*')
          .eq('id', salaoId)
          .single();

        const adminPhone =
          process.env.ADMIN_WHATSAPP_PHONE ||
          process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE ||
          '5551981108170';

        const valorFormatado = payment?.value
          ? `R$ ${Number(payment.value).toFixed(2).replace('.', ',')}`
          : 'R$ 69,90';

        const msgAdmin = `🎉 *NOVO PAGAMENTO CONFIRMADO!* (SaaS Studio Beauty)

🏢 *Salão:* ${salaoData?.nome || 'Salão'}
💰 *Valor:* ${valorFormatado}
📦 *Plano:* ${(salaoData?.plano || 'pro').toUpperCase()}
💳 *Forma de Pagamento:* ${payment?.billingType || 'PIX'} (Asaas)
📱 *Contato do Salão:* ${salaoData?.telefone_whatsapp || 'Não informado'}

✅ O acesso do salão foi liberado com sucesso no sistema! 🚀`;

        await sendDirectWhatsAppMessage({
          phone: adminPhone,
          message: msgAdmin,
        });
        console.log('[Asaas Webhook] Administrador notificado no WhatsApp com sucesso!');
      } catch (notifyErr) {
        console.error('[Asaas Webhook] Erro ao enviar notificação WhatsApp ao admin:', notifyErr);
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
