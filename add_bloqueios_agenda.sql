-- Adiciona a coluna de dias de trabalho na tabela profissionais se não existir
-- 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
ALTER TABLE profissionais 
ADD COLUMN IF NOT EXISTS dias_trabalho jsonb DEFAULT '[1,2,3,4,5,6]'::jsonb;

-- Cria a tabela de bloqueios de agenda (folgas pontuais, férias, fechamento do dia)
CREATE TABLE IF NOT EXISTS bloqueios_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id text NOT NULL,
  profissional_id uuid NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  data text NOT NULL, -- formato YYYY-MM-DD
  dia_inteiro boolean DEFAULT true,
  hora_inicio text,
  hora_fim text,
  motivo text DEFAULT 'Folga',
  criado_em timestamptz DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_bloqueios_salao_data ON bloqueios_agenda (salao_id, data);
CREATE INDEX IF NOT EXISTS idx_bloqueios_profissional ON bloqueios_agenda (profissional_id);
