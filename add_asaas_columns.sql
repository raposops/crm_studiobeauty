-- Adicionar colunas de integração Asaas na tabela saloes
ALTER TABLE saloes 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT,
ADD COLUMN IF NOT EXISTS vencimento_plano TIMESTAMPTZ;
