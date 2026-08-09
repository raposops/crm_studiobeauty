import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function testInsertProfissional() {
  console.log('Testando inserção na tabela profissionais...');
  const { data, error } = await supabase
    .from('profissionais')
    .insert({
      salao_id: 'default_salao',
      nome: 'Carlos Teste',
      iniciais: 'CT',
      cor: 'from-purple-500 to-indigo-500'
    })
    .select();

  if (error) {
    console.error('❌ ERRO DETALHADO DO SUPABASE:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('✅ Inserção bem sucedida!', data);
  }
}

testInsertProfissional();
