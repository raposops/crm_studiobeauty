                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zcfvfrslpvjubyuigiig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('--- BUSCANDO SALOES ---');
  const { data: saloes, error: sErr } = await supabase.from('saloes').select('*');
  if (sErr) console.error('Erro saloes:', sErr);

  console.log('--- BUSCANDO USUARIOS ---');
  const { data: usuarios, error: uErr } = await supabase.from('usuarios').select('*');
  if (uErr) console.error('Erro usuarios:', uErr);

  console.log('--- TOTAL SALOES:', saloes?.length);
  console.log('--- TOTAL USUARIOS:', usuarios?.length);

  console.log('\n--- DETALHES SALOES ---');
  saloes?.forEach((s) => {
    console.log({
      id: s.id,
      nome: s.nome,
      email: s.email,
      telefone_whatsapp: s.telefone_whatsapp,
      status_assinatura: s.status_assinatura,
      plano: s.plano,
      asaas_customer_id: s.asaas_customer_id,
      asaas_payment_id: s.asaas_payment_id,
      criado_em: s.criado_em,
    });
  });

  console.log('\n--- DETALHES USUARIOS ---');
  usuarios?.forEach((u) => {
    console.log({
      id: u.id,
      nome: u.nome,
      email: u.email,
      telefone: u.telefone,
      role: u.role,
      salao_id: u.salao_id,
      criado_em: u.criado_em,
    });
  });
}

run();
