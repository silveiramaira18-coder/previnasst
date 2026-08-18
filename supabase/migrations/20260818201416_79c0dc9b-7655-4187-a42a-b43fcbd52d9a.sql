-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  empresa TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, empresa)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'empresa')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- OBRAS
CREATE TABLE public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  empresa TEXT,
  endereco TEXT,
  responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CHECKLISTS
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.itens_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  categoria TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- INSPECOES
CREATE SEQUENCE public.inspecoes_numero_seq;
CREATE TABLE public.inspecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL DEFAULT ('INS-' || lpad(nextval('public.inspecoes_numero_seq')::text, 4, '0')),
  obra_id UUID REFERENCES public.obras(id) ON DELETE SET NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario TIME,
  responsavel TEXT,
  local TEXT,
  tipo_inspecao TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT USAGE, SELECT ON SEQUENCE public.inspecoes_numero_seq TO authenticated;

CREATE TABLE public.respostas_inspecao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  inspecao_id UUID NOT NULL REFERENCES public.inspecoes(id) ON DELETE CASCADE,
  item_checklist_id UUID REFERENCES public.itens_checklist(id) ON DELETE SET NULL,
  resposta TEXT,
  observacao TEXT,
  status TEXT
);

CREATE TABLE public.fotos_inspecao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  inspecao_id UUID NOT NULL REFERENCES public.inspecoes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nome_arquivo TEXT,
  descricao TEXT,
  data_upload TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NAO CONFORMIDADES
CREATE SEQUENCE public.nc_numero_seq;
CREATE TABLE public.nao_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL DEFAULT ('NC-' || lpad(nextval('public.nc_numero_seq')::text, 4, '0')),
  inspecao_id UUID REFERENCES public.inspecoes(id) ON DELETE CASCADE,
  categoria TEXT,
  descricao TEXT NOT NULL,
  severidade TEXT NOT NULL DEFAULT 'Média',
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'Aberta',
  observacao TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT USAGE, SELECT ON SEQUENCE public.nc_numero_seq TO authenticated;

CREATE TABLE public.fotos_nao_conformidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nao_conformidade_id UUID NOT NULL REFERENCES public.nao_conformidades(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nome_arquivo TEXT,
  descricao TEXT,
  data_upload TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACOES CORRETIVAS
CREATE SEQUENCE public.ac_numero_seq;
CREATE TABLE public.acoes_corretivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL DEFAULT ('AC-' || lpad(nextval('public.ac_numero_seq')::text, 4, '0')),
  nao_conformidade_id UUID NOT NULL REFERENCES public.nao_conformidades(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  prazo DATE,
  status TEXT NOT NULL DEFAULT 'Aberta',
  data_conclusao DATE,
  observacao TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT USAGE, SELECT ON SEQUENCE public.ac_numero_seq TO authenticated;

CREATE TABLE public.fotos_acao_corretiva (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  acao_corretiva_id UUID NOT NULL REFERENCES public.acoes_corretivas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nome_arquivo TEXT,
  descricao TEXT,
  data_upload TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTS + RLS
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['obras','checklists','itens_checklist','inspecoes','respostas_inspecao','fotos_inspecao','nao_conformidades','fotos_nao_conformidade','acoes_corretivas','fotos_acao_corretiva']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t || '_own', t);
  END LOOP;
END $$;

CREATE INDEX ON public.inspecoes (user_id, data DESC);
CREATE INDEX ON public.fotos_inspecao (inspecao_id);
CREATE INDEX ON public.nao_conformidades (inspecao_id);
CREATE INDEX ON public.fotos_nao_conformidade (nao_conformidade_id);
CREATE INDEX ON public.acoes_corretivas (nao_conformidade_id);
CREATE INDEX ON public.fotos_acao_corretiva (acao_corretiva_id);