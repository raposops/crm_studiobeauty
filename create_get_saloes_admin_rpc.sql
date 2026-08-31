-- =========================================================================
-- COMANDO SQL DEFINITIVO: POPULAR EMAILS E CRIAR FUNÇÃO RPC
-- =========================================================================

-- 1. Garante que a coluna email existe na tabela saloes
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Atualiza diretamente o e-mail de login dos salões existentes a partir de auth.users
UPDATE saloes s
SET email = u.email
FROM auth.users u
WHERE (u.raw_user_meta_data->>'salao_id')::text = s.id::text 
   OR u.id = s.id
   OR (u.raw_user_meta_data->>'slug')::text = s.slug::text
   OR (u.raw_user_meta_data->>'salao_nome')::text = s.nome::text;

-- 3. Remove e recria a função RPC com tipos flexíveis
DROP FUNCTION IF EXISTS get_saloes_admin();

CREATE OR REPLACE FUNCTION get_saloes_admin()
RETURNS SETOF saloes
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza e-mails vazios antes de retornar
  UPDATE saloes s
  SET email = u.email
  FROM auth.users u
  WHERE (s.email IS NULL OR s.email = '')
    AND (
      (u.raw_user_meta_data->>'salao_id')::text = s.id::text 
      OR u.id = s.id
      OR (u.raw_user_meta_data->>'slug')::text = s.slug::text
      OR (u.raw_user_meta_data->>'salao_nome')::text = s.nome::text
    );

  RETURN QUERY
  SELECT * FROM saloes ORDER BY criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_saloes_admin() TO anon, authenticated, service_role;
