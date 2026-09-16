-- Executar este script no SQL Editor do Supabase para adicionar a coluna de especialidade/tipo de profissional
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS especialidade TEXT;
