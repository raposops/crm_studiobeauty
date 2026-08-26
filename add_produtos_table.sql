-- =========================================================================
-- COMANDO SQL PARA SUPORTE A PRODUTOS EXTRAS / UPSELL NA COMANDA
-- Execute este script no SQL Editor do Supabase se desejar persistir na nuvem:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID REFERENCES saloes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco BIGINT NOT NULL, -- em centavos (ex: 4500 = R$ 45,00)
  categoria TEXT NOT NULL DEFAULT 'Geral',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas por salão e categoria
CREATE INDEX IF NOT EXISTS idx_produtos_salao ON produtos(salao_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
