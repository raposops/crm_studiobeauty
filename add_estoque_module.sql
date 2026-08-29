-- =========================================================================
-- COMANDO SQL PARA ATIVAR O MÓDULO 'ESTOQUE' E CAMPOS NA TABELA 'produtos'
-- Copie este comando e execute no SQL Editor do seu Painel do Supabase:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Adicionar colunas de controle de estoque na tabela 'produtos'
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS quantidade INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS custo BIGINT DEFAULT 0, -- em centavos (ex: 2500 = R$ 25,00)
ADD COLUMN IF NOT EXISTS controlar_estoque BOOLEAN DEFAULT true;

-- 2. Atualizar default da coluna 'modulos_ativos' na tabela 'saloes'
ALTER TABLE saloes 
ALTER COLUMN modulos_ativos SET DEFAULT '{"fluxo_de_caixa": true, "fluxo_caixa_avancado": true, "comissao_customizada": true, "whatsapp_automatico": true, "relatorios_avancados": true, "estoque": true}'::jsonb;

-- 3. Opcional: inicializar produtos com quantidade padrão caso estejam nulos
UPDATE produtos SET quantidade = 10 WHERE quantidade IS NULL;
UPDATE produtos SET estoque_minimo = 2 WHERE estoque_minimo IS NULL;
UPDATE produtos SET controlar_estoque = true WHERE controlar_estoque IS NULL;
