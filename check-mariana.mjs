import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function checkMariana() {
  console.log('--- MARIANA CLIENT SEARCH ---');
  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .ilike('nome', '%mariana%');

  console.dir(clientes, { depth: null });

  console.log('--- RECENT AGENDAMENTOS ---');
  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('*, cliente:clientes(*)')
    .order('criado_em', { ascending: false })
    .limit(5);

  console.dir(agendamentos, { depth: null });
}

checkMariana();
