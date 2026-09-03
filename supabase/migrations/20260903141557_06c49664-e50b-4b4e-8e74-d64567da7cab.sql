ALTER TABLE public.nao_conformidades
  ADD COLUMN IF NOT EXISTS acao_imediata boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS descricao_acao_imediata text,
  ADD COLUMN IF NOT EXISTS data_acao_imediata date,
  ADD COLUMN IF NOT EXISTS responsaveis text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.nao_conformidades
SET responsaveis = ARRAY[responsavel]
WHERE responsavel IS NOT NULL
  AND btrim(responsavel) <> ''
  AND cardinality(responsaveis) = 0;