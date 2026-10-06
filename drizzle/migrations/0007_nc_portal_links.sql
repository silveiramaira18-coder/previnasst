CREATE TABLE public.nc_links (
  token text PRIMARY KEY DEFAULT encode(gen_random_bytes(24), 'hex'),
  nao_conformidade_id uuid NOT NULL REFERENCES public.nao_conformidades(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '60 days',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.nc_links TO authenticated;
GRANT ALL ON public.nc_links TO service_role;
ALTER TABLE public.nc_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY nc_links_select ON public.nc_links FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY nc_links_insert ON public.nc_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY nc_links_delete ON public.nc_links FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX nc_links_nc_idx ON public.nc_links(nao_conformidade_id);
ALTER TABLE public.nao_conformidades ADD COLUMN IF NOT EXISTS motivo_rejeicao text;