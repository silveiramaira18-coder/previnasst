CREATE TABLE public.itens_inspecao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  inspecao_id uuid NOT NULL REFERENCES public.inspecoes(id) ON DELETE CASCADE,
  numero integer NOT NULL DEFAULT 1,
  ordem integer NOT NULL DEFAULT 0,
  categoria text,
  pergunta text,
  resposta text,
  observacao text,
  status text NOT NULL DEFAULT 'Pendente',
  data_criacao timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_inspecao TO authenticated;
GRANT ALL ON public.itens_inspecao TO service_role;
ALTER TABLE public.itens_inspecao ENABLE ROW LEVEL SECURITY;
CREATE POLICY itens_inspecao_own ON public.itens_inspecao FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_itens_inspecao_inspecao ON public.itens_inspecao(inspecao_id, ordem);

CREATE TABLE public.fotos_item_inspecao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  item_inspecao_id uuid NOT NULL REFERENCES public.itens_inspecao(id) ON DELETE CASCADE,
  url text NOT NULL,
  nome_arquivo text,
  descricao text,
  data_upload timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fotos_item_inspecao TO authenticated;
GRANT ALL ON public.fotos_item_inspecao TO service_role;
ALTER TABLE public.fotos_item_inspecao ENABLE ROW LEVEL SECURITY;
CREATE POLICY fotos_item_inspecao_own ON public.fotos_item_inspecao FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_fotos_item_inspecao_item ON public.fotos_item_inspecao(item_inspecao_id);

ALTER TABLE public.nao_conformidades
  ADD COLUMN IF NOT EXISTS item_inspecao_id uuid REFERENCES public.itens_inspecao(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsavel text;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_itens_inspecao_updated_at
  BEFORE UPDATE ON public.itens_inspecao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();