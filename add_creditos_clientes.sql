-- =========================================================================
-- COMANDO SQL PARA SUPORTE A CRÉDITO DE CLIENTES (TROCO / CRÉDITO EM HAVER)
-- Execute este script no SQL Editor do Supabase:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Adicionar coluna de saldo de crédito na tabela de clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS saldo_credito BIGINT DEFAULT 0;

-- 2. Criar tabela para histórico e auditoria de movimentações de crédito
CREATE TABLE IF NOT EXISTS movimentacoes_credito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID REFERENCES saloes(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor BIGINT NOT NULL, -- em centavos (ex: 2000 = R$ 20,00)
  motivo TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_mov_credito_salao ON movimentacoes_credito(salao_id);
CREATE INDEX IF NOT EXISTS idx_mov_credito_cliente ON movimentacoes_credito(cliente_id);
