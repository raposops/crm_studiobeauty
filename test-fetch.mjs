import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function testFetchDisambiguated() {
  const salaoId = '00000000-0000-0000-0000-000000000000';
  const data = '2026-08-10';
  
  const { data: result, error } = await supabase
    .from('agendamentos')
    .select(`
      *,
      cliente:clientes(*),
      profissional:profissionais(*),
      servico:servicos!agendamentos_servico_id_fkey(*),
      servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(*))
    `)
    .eq('salao_id', salaoId)
    .eq('data', data);
    
  console.log('Disambiguated Fetch Result:', result, error);
}

testFetchDisambiguated();
