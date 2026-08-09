import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function inspectTables() {
  console.log('--- PROFISSIONAIS ---');
  const { data: pData, error: pError } = await supabase.from('profissionais').select('*').limit(1);
  console.log('Profissionais sample:', pData, pError);

  console.log('--- SERVIÇOS ---');
  const { data: sData, error: sError } = await supabase.from('servicos').select('*').limit(1);
  console.log('Serviços sample:', sData, sError);
}

inspectTables();
