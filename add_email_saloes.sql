-- =========================================================================
-- COMANDO SQL PARA ADICIONAR A COLUNA 'email' NA TABELA 'saloes'
-- Copie este comando e execute no SQL Editor do seu Painel do Supabase:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Adiciona a coluna email na tabela saloes
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Atualiza os emails dos salões a partir dos usuários cadastrados na autenticação do Supabase
UPDATE saloes s
SET email = u.email
FROM auth.users u
WHERE (u.raw_user_meta_data->>'salao_id')::text = s.id::text
  AND (s.email IS NULL OR s.email = '');

-- 3. Atualiza os emails dos salões a partir da tabela 'usuarios' caso exista
UPDATE saloes s
SET email = us.email
FROM usuarios us
WHERE us.salao_id::text = s.id::text
  AND (s.email IS NULL OR s.email = '');
