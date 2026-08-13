-- =========================================================================
-- COMANDO SQL PARA ADICIONAR A COLUNA 'modulos_ativos' NA TABELA 'saloes'
-- Copie este comando e execute no SQL Editor do seu Painel do Supabase:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

ALTER TABLE saloes 
ADD COLUMN IF NOT EXISTS modulos_ativos JSONB DEFAULT '{"fluxo_caixa_avancado": true, "comissao_customizada": true, "whatsapp_automatico": true, "relatorios_avancados": true}'::jsonb;
