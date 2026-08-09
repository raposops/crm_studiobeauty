import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function testInsertClient() {
  const generatedUuid = crypto.randomUUID();
  const salaoId = '00000000-0000-0000-0000-000000000000';
  
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      id: generatedUuid,
      salao_id: salaoId,
      nome: 'Fernanda Costa',
      whatsapp: '00000000000'
    })
    .select();

  console.log('Insert client result:', data, error);
}

testInsertClient();
