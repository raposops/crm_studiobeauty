import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function testFetchServiceLogic(dataStr) {
  const salaoId = '00000000-0000-0000-0000-000000000000';
  
  let query = supabase
    .from('agendamentos')
    .select(`
      *,
      cliente:clientes(*),
      profissional:profissionais(*),
      servico:servicos!agendamentos_servico_id_fkey(*),
      servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(*))
    `)
    .eq('salao_id', salaoId)
    .eq('data', dataStr);

  const { data: result, error } = await query;
  console.log(`Fetch for date ${dataStr}:`, error ? `ERROR: ${error.message}` : `Found ${result.length} items`);
  if (result) {
    const mapped = result.map((ag) => {
      let mappedServicos = ag.servicos?.map((s) => s.servico).filter(Boolean) || [];
      if (mappedServicos.length === 0 && ag.servico) {
        mappedServicos = [ag.servico];
      }
      return {
        ...ag,
        servicos: mappedServicos,
        cliente: ag.cliente ? {
          ...ag.cliente,
          whatsapp: ag.cliente.telefone_whatsapp || ag.cliente.whatsapp,
        } : null,
      };
    });
    console.dir(mapped, { depth: null });
  }
}

async function run() {
  await testFetchServiceLogic('2026-08-10');
  await testFetchServiceLogic('2026-08-11');
}

run();
