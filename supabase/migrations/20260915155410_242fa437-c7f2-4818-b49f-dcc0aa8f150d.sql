ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS email_engenheiro text;
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS email_engenheiro text;
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS assinatura text;
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS assinatura_nome text;
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS assinatura_cargo text;
ALTER TABLE public.inspecoes ADD COLUMN IF NOT EXISTS assinatura_data timestamptz;