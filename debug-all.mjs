import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function debugAgendamentos() {
  console.log('--- ALL AGENDAMENTOS ---');
  const { data: all, error: errAll } = await supabase.from('agendamentos').select('*');
  console.log('All count:', all?.length, errAll);
  console.dir(all, { depth: null });

  console.log('--- PROFISSIONAIS ---');
  const { data: profs } = await supabase.from('profissionais').select('*');
  console.dir(profs, { depth: null });

  console.log('--- CLIENTES ---');
  const { data: clients } = await supabase.from('clientes').select('*');
  console.dir(clients, { depth: null });

  console.log('--- SERVIÇOS ---');
  const { data: servs } = await supabase.from('servicos').select('*');
  console.dir(servs, { depth: null });
}

debugAgendamentos();
