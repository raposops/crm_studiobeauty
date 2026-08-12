import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function checkCols() {
  const { data, error } = await supabase.from('saloes').insert({
    id: '00000000-0000-0000-0000-000000000000',
    nome: 'Studio Beauty'
  }).select();

  console.log('Result:', data, 'Error:', error);
}

checkCols();
