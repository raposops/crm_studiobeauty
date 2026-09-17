import { NextRequest, NextResponse } from 'next/server';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salaoNome, ownerNome, email, phone, plano, isTrialMode } = body;

    const adminPhone =
      process.env.ADMIN_WHATSAPP_PHONE ||
      process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_PHONE ||
      '5551981108170';

    const tipoModo = isTrialMode ? '🎁 TRIAL 14 DIAS GRÁTIS' : '💳 PAGO (Aguardando Ativação)';
    const planoStr = (plano || 'pro').toUpperCase();

    const msgAdmin = `🚀 *NOVO SALÃO CADASTRADO NO CRMSaaS!*

🏢 *Salão:* ${salaoNome || 'Não informado'}
👤 *Responsável:* ${ownerNome || 'Não informado'}
📧 *E-mail de Login:* ${email || 'Não informado'}
📱 *WhatsApp Salão:* ${phone || 'Não informado'}
📦 *Plano Escolhido:* ${planoStr}
🏷️ *Modalidade:* ${tipoModo}

🎉 Uhuuu! Mais um cliente na plataforma Studio Beauty!`;

    console.log(`[Admin Novo Cadastro Route] Enviando WhatsApp para ${adminPhone}...`);
    const result = await sendDirectWhatsAppMessage({
      phone: adminPhone,
      message: msgAdmin,
    });

    if (result.success) {
      console.log('[Admin Novo Cadastro Route] Notificação enviada ao admin com sucesso!');
      return NextResponse.json({ success: true, result });
    } else {
      console.warn('[Admin Novo Cadastro Route] Falha ao enviar WhatsApp:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[Admin Novo Cadastro Route] Erro interno:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
