ALTER TABLE public.nao_conformidades
  ADD COLUMN IF NOT EXISTS emails_responsaveis text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ultimo_email_cobranca timestamptz;