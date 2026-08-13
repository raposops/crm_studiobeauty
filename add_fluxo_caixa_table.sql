-- =========================================================================
-- COMANDO SQL PARA CRIAR A TABELA 'fluxo_caixa' NO SUPABASE
-- Se for usar no Supabase, execute no SQL Editor:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

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
