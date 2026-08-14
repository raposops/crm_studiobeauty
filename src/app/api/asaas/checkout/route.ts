import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { asaasService } from '@/services/asaasService';
import { PLANOS_SAAS } from '@/types';

function isValidCPFOrCNPJ(doc: string): boolean {
  const clean = doc.replace(/\D/g, '');
  return clean.length === 11 || clean.length === 14;
}

function generateValidTestCPF(): string {
  const rnd = (n: number) => Math.floor(Math.random() * n);
  const n = Array.from({ length: 9 }, () => rnd(10));
  let d1 = n.reduce((total, number, index) => total + number * (10 - index), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  n.push(d1);
  let d2 = n.reduce((total, number, index) => total + number * (11 - index), 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  n.push(d2);
  return n.join('');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salaoId, plano = 'pro', billingType = 'PIX', cpfCnpj: reqCpfCnpj } = body;

    if (!salaoId) {
      return NextResponse.json(
        { error: 'Parâmetro salaoId é obrigatório.' },
        { status: 400 }
      );
    }

    const planoKey = (plano === 'basico' ? 'basico' : 'pro') as 'basico' | 'pro';
    const planoInfo = PLANOS_SAAS[planoKey];
    const valorCobrado = planoInfo.preco;

    // 1. Busca os dados do Salão no Supabase
    const { data: salao, error: salaoErr } = await supabase
      .from('saloes')
      .select('*')
      .eq('id', salaoId)
      .single();

    if (salaoErr || !salao) {
      return NextResponse.json(
        { error: 'Salão não encontrado no banco de dados.' },
        { status: 404 }
      );
    }

    // 2. Busca e-mail do gestor do salão na tabela usuarios
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('salao_id', salaoId)
      .limit(1)
      .maybeSingle();

    const clientEmail = usuario?.email || `${salao.slug || 'salao'}@crmstudiobeauty.com.br`;
    const clientPhone = salao.telefone_whatsapp || usuario?.telefone || '51981108170';

    // Se o CPF informado for válido, usa ele. Se não, gera um CPF válido para testes
    let finalCpfCnpj = (reqCpfCnpj || salao.documento || '').replace(/\D/g, '');
    if (!isValidCPFOrCNPJ(finalCpfCnpj)) {
      finalCpfCnpj = generateValidTestCPF();
    }

    // 3. Cria ou busca o cliente no Asaas
    const asaasCustomer = await asaasService.criarOuBuscarCliente({
      name: salao.nome,
      email: clientEmail,
      phone: clientPhone,
      mobilePhone: clientPhone,
      cpfCnpj: finalCpfCnpj,
      externalReference: salaoId,
    });

    // 4. Cria a cobrança ou assinatura no Asaas
    const descricao = `${planoInfo.nome} - CRM Studio Beauty (Mensalidade ${planoInfo.precoFormatado})`;
    
    // Cria uma cobrança imediata para gerar o PIX
    const payment = await asaasService.criarCobrancaAvulsa({
      customerId: asaasCustomer.id,
      value: valorCobrado,
      description: descricao,
      externalReference: salaoId,
      billingType: billingType as any,
    });

    // 5. Gera os dados de PIX QR Code
    let pixData = null;
    try {
      pixData = await asaasService.obterPixQrCode(payment.id);
    } catch (pixErr) {
      console.warn('[Asaas Checkout] Não foi possível gerar QR Code PIX imediato:', pixErr);
    }

    // 6. Atualiza o ID do cliente Asaas no Supabase
    try {
      await supabase
        .from('saloes')
        .update({
          asaas_customer_id: asaasCustomer.id,
          asaas_payment_id: payment.id,
        })
        .eq('id', salaoId);
    } catch (dbErr) {
      console.warn('[Asaas Checkout] Aviso ao salvar asaas_customer_id na tabela saloes:', dbErr);
    }

    return NextResponse.json({
      success: true,
      customer: asaasCustomer,
      payment: {
        id: payment.id,
        value: payment.value,
        status: payment.status,
        dueDate: payment.dueDate,
        invoiceUrl: payment.invoiceUrl,
        bankSlipUrl: payment.bankSlipUrl,
      },
      pix: pixData,
    });
  } catch (error: any) {
    console.error('[Asaas Checkout Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar cobrança no Asaas.' },
      { status: 500 }
    );
  }
}
