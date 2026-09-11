-- Adicionar coluna trial_ate na tabela saloes se não existir
ALTER TABLE saloes 
ADD COLUMN IF NOT EXISTS trial_ate TIMESTAMPTZ;
