import { createClient } from '@supabase/supabase-js';

// Using anon key to verify and set up via Supabase JS client
const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function testSaaSSetup() {
  console.log('Testing saloes query...');
  const { data: saloes, error: sErr } = await supabase.from('saloes').select('*');
  console.log('Saloes:', saloes, 'Error:', sErr);
}

testSaaSSetup();
