import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function inspectColumns() {
  // We can run an RPC or just try a SELECT with a column that doesn't exist to see if it lists columns, or run a query on pg_attribute
  // Since we cannot run raw SQL via client directly unless we have an RPC, let's check if we can fetch a single insert with just 'nome'
  // and see what columns it returns in the selection.
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      salao_id: '00000000-0000-0000-0000-000000000000',
      nome: 'Teste Colunas'
    })
    .select();
    
  console.log('Insert response:', data, error);
}

inspectColumns();
