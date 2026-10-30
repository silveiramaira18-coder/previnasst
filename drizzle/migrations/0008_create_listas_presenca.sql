CREATE TABLE public.listas_presenca (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local text,
  data date,
  empresa text,
  horario text,
  carga_horaria text,
  tema text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listas_presenca TO authenticated;
GRANT ALL ON public.listas_presenca TO service_role;
ALTER TABLE public.listas_presenca ENABLE ROW LEVEL SECURITY;
CREATE POLICY listas_presenca_select ON public.listas_presenca FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY listas_presenca_insert ON public.listas_presenca FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY listas_presenca_update ON public.listas_presenca FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY listas_presenca_delete ON public.listas_presenca FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lista_presenca_participantes (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references public.listas_presenca(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  ordem integer not null default 0,
  nome text not null,
  funcao text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lista_presenca_participantes TO authenticated;
GRANT ALL ON public.lista_presenca_participantes TO service_role;
ALTER TABLE public.lista_presenca_participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY lpp_select ON public.lista_presenca_participantes FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY lpp_insert ON public.lista_presenca_participantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY lpp_update ON public.lista_presenca_participantes FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY lpp_delete ON public.lista_presenca_participantes FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));