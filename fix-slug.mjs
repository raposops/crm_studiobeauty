import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSlug() {
  const { data, error } = await supabase
    .from('saloes')
    .update({ slug: 'salao-teste' })
    .eq('nome', 'Salão Teste');

  if (error) {
    console.error('Error updating slug:', error);
  } else {
    console.log('Slug updated successfully for Salão Teste');
  }
}

fixSlug();
