import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zcfvfrslpvjubyuigiig.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZnZmcnNscHZqdWJ5dWlnaWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzI2ODMsImV4cCI6MjA4NTIwODY4M30.mvLR6RgtpQlx7kf9pta_zgrYz63wNGEqsE5a1oZ1kyU');

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'agendamentos' }); // if RPC exists
  if (error) {
    console.log("No RPC, fetching one row:");
    const { data: row } = await supabase.from('agendamentos').select('*').limit(1);
    console.log(row ? Object.keys(row[0] || {}) : "No data");
  } else {
    console.log(data);
  }
}
checkSchema();
