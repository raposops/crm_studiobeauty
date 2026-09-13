-- ==============================================================================
-- MIGRAÇÃO SUPABASE: COBRANÇA DE SINAL / ADIANTAMENTO DE PROCEDIMENTOS
-- ==============================================================================

-- 1. Campos de Chave PIX e Link de Pagamento na tabela 'saloes'
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS pix_chave text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS pix_tipo text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS pix_titular text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS link_pagamento text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS instrucoes_sinal text;

-- 2. Campos de Sinal nos Serviços ('servicos')
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS exige_sinal boolean DEFAULT false;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS porcentagem_sinal integer DEFAULT 30;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS valor_sinal_fixo integer;

-- 3. Campos de Sinal nos Agendamentos ('agendamentos')
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS exige_sinal boolean DEFAULT false;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS valor_sinal integer DEFAULT 0;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS sinal_pago boolean DEFAULT false;
