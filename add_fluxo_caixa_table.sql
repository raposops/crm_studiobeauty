-- =========================================================================
-- COMANDO SQL DEFINITIVO PARA A TABELA 'fluxo_caixa' NO SUPABASE
-- Execute no SQL Editor do Supabase:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Criar a tabela fluxo_caixa caso não exista
CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID REFERENCES saloes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor BIGINT NOT NULL,
  data DATE NOT NULL,
  origem_caixa_auto BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para otimização de busca por salão e período
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_salao_data ON fluxo_caixa(salao_id, data);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_tipo ON fluxo_caixa(tipo);

-- 3. Configurar permissões de RLS (Row Level Security) para anon e authenticated
ALTER TABLE fluxo_caixa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao total fluxo_caixa" ON fluxo_caixa;
CREATE POLICY "Permissao total fluxo_caixa"
ON fluxo_caixa
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

