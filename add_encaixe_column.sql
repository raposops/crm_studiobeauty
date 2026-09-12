-- Executar este script no SQL Editor do Supabase se desejar coluna dedicada
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS is_encaixe boolean DEFAULT false;
