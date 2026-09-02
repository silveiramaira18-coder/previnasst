ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS engenheiro_responsavel text;
ALTER TABLE public.itens_inspecao ADD COLUMN IF NOT EXISTS norma_regulamentadora text;
ALTER TABLE public.itens_inspecao ADD COLUMN IF NOT EXISTS risco_potencial text;
ALTER TABLE public.nao_conformidades ADD COLUMN IF NOT EXISTS data_conclusao date;