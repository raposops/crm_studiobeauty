import { createClient } from '@supabase/supabase-js';

// Get url from args or hardcode for test
// The user has "/rest/v1/" in their .env.local, let's test if it works or fails
const supabaseUrl = 'https://zcfvfrslpvjubyuigiig.supabase.co'; // without /rest/v1/
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testando conexão com o Supabase...');
  try {
    const { data, error } = await supabase.from('clientes').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erro de conexão ou permissão:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Conexão bem sucedida!');
      console.log('Dados da tabela "clientes":', data);
      
      // Let's also check if RPC exists
      const { data: rpcData, error: rpcError } = await supabase.rpc('concluir_atendimento', {
        p_agendamento_id: '00000000-0000-0000-0000-000000000000',
        p_salao_id: 'test',
        p_forma_pagamento: 'pix',
        p_valor_total: 0,
        p_comissao_profissional: 0,
        p_valor_liquido: 0,
        p_produtos_extras: [],
        p_valor_servicos: 0,
        p_valor_produtos: 0,
        p_cliente_nome: 'test',
        p_profissional_id: '00000000-0000-0000-0000-000000000000',
        p_servicos_nomes: []
      });
      // It might fail with foreign key violation, but if it says "function not found", we know the script wasn't run.
      if (rpcError) {
        if (rpcError.message.includes('Could not find')) {
           console.log('⚠️ A RPC concluir_atendimento não foi encontrada. Você executou o script SQL no dashboard?');
        } else {
           // FK violation means the RPC exists!
           console.log('✅ A RPC concluir_atendimento foi encontrada no banco (erro esperado por IDs inválidos).');
        }
      } else {
         console.log('✅ A RPC concluir_atendimento foi executada.');
      }

    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

testConnection();
