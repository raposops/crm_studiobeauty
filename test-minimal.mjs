import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function testMinimalInsert() {
  console.log('Testando inserção apenas com salao_id e nome...');
  const { data, error } = await supabase
    .from('profissionais')
    .insert({
      salao_id: 'default_salao',
      nome: 'Carlos Minimal'
    })
    .select();

  console.log('Resultado minimal insert:', data, error);
}

testMinimalInsert();
