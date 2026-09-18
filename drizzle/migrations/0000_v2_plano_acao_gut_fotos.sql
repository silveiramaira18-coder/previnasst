ALTER TABLE public.nao_conformidades
  ADD COLUMN IF NOT EXISTS gut_gravidade smallint,
  ADD COLUMN IF NOT EXISTS gut_urgencia smallint,
  ADD COLUMN IF NOT EXISTS gut_tendencia smallint,
  ADD COLUMN IF NOT EXISTS gut_score integer;

ALTER TABLE public.fotos_nao_conformidade
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'problema';

CREATE INDEX IF NOT EXISTS fotos_nao_conformidade_tipo_idx
  ON public.fotos_nao_conformidade (nao_conformidade_id, tipo);