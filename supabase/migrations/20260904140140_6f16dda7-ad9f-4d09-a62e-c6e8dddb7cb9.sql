CREATE TABLE public.pavimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pavimentos TO authenticated;
GRANT ALL ON public.pavimentos TO service_role;

ALTER TABLE public.pavimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pavimentos_own ON public.pavimentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY pavimentos_admin_all ON public.pavimentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_pavimentos_updated_at BEFORE UPDATE ON public.pavimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX pavimentos_obra_idx ON public.pavimentos (obra_id, ordem);

ALTER TABLE public.itens_inspecao
  ADD COLUMN IF NOT EXISTS normas_regulamentadoras text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.itens_inspecao
  SET normas_regulamentadoras = ARRAY[norma_regulamentadora]
  WHERE norma_regulamentadora IS NOT NULL
    AND norma_regulamentadora <> ''
    AND cardinality(normas_regulamentadoras) = 0;

ALTER TABLE public.inspecoes
  ADD COLUMN IF NOT EXISTS engenheiro_responsavel text;