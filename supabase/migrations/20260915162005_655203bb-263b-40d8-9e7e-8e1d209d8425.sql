ALTER TABLE public.inspecoes
  ADD COLUMN IF NOT EXISTS assinatura_obra text,
  ADD COLUMN IF NOT EXISTS assinatura_obra_nome text,
  ADD COLUMN IF NOT EXISTS assinatura_obra_cargo text,
  ADD COLUMN IF NOT EXISTS assinatura_obra_data timestamp with time zone;