ALTER TABLE public.profiles ADD COLUMN empresa_logo text;
ALTER TABLE public.listas_presenca ADD COLUMN company_id uuid REFERENCES public.profiles(id), ADD COLUMN nome_treinamento text, ADD COLUMN horario_inicial text, ADD COLUMN horario_final text, ADD COLUMN modo_assinatura text NOT NULL DEFAULT 'manual' CHECK (modo_assinatura IN ('digital','manual'));
UPDATE public.listas_presenca SET company_id = user_id, nome_treinamento = tema;
ALTER TABLE public.lista_presenca_participantes ADD COLUMN assinatura text, ADD COLUMN assinatura_data timestamptz;
CREATE OR REPLACE FUNCTION public.salvar_lista_treinamento(p_id uuid, p_dados jsonb, p_participantes jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_id uuid; v_owner uuid; p jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão expirada'; END IF;
 IF jsonb_typeof(p_participantes) <> 'array' THEN RAISE EXCEPTION 'Participantes inválidos'; END IF;
 IF p_id IS NULL THEN
  v_owner := auth.uid();
  INSERT INTO public.listas_presenca(user_id, company_id, tema) VALUES(v_owner,v_owner,'') RETURNING id INTO v_id;
 ELSE
  SELECT id,user_id INTO v_id,v_owner FROM public.listas_presenca WHERE id=p_id FOR UPDATE;
  IF v_id IS NULL OR (v_owner <> auth.uid() AND NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Sem permissão para editar esta lista'; END IF;
 END IF;
 IF trim(coalesce(p_dados->>'nome_treinamento','')) = '' THEN RAISE EXCEPTION 'Informe o nome do treinamento'; END IF;
 UPDATE public.listas_presenca SET local=nullif(trim(p_dados->>'local'),''), data=nullif(p_dados->>'data','')::date, empresa=upper(nullif(trim(p_dados->>'empresa'),'')), horario=nullif(p_dados->>'horario',''), horario_inicial=nullif(p_dados->>'horario_inicial',''), horario_final=nullif(p_dados->>'horario_final',''), carga_horaria=nullif(p_dados->>'carga_horaria',''), tema=upper(trim(coalesce(p_dados->>'tema',''))), nome_treinamento=upper(trim(p_dados->>'nome_treinamento')), modo_assinatura=coalesce(p_dados->>'modo_assinatura','manual') WHERE id=v_id;
 DELETE FROM public.lista_presenca_participantes WHERE lista_id=v_id AND id NOT IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(p_participantes) x WHERE nullif(x->>'id','') IS NOT NULL);
 FOR p IN SELECT value FROM jsonb_array_elements(p_participantes) LOOP
  IF trim(coalesce(p->>'nome','')) = '' THEN RAISE EXCEPTION 'Informe o nome do participante'; END IF;
  IF nullif(p->>'employee_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.employees WHERE id=(p->>'employee_id')::uuid AND user_id=v_owner) THEN RAISE EXCEPTION 'Colaborador não pertence à empresa da lista'; END IF;
  IF nullif(p->>'id','') IS NOT NULL THEN
   UPDATE public.lista_presenca_participantes SET nome=upper(trim(p->>'nome')),funcao=upper(nullif(trim(p->>'funcao'),'')),ordem=(p->>'ordem')::integer WHERE id=(p->>'id')::uuid AND lista_id=v_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Participante inválido'; END IF;
  ELSE
   INSERT INTO public.lista_presenca_participantes(lista_id,user_id,employee_id,ordem,nome,funcao) VALUES(v_id,v_owner,nullif(p->>'employee_id','')::uuid,(p->>'ordem')::integer,upper(trim(p->>'nome')),upper(nullif(trim(p->>'funcao'),'')));
  END IF;
 END LOOP;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.salvar_lista_treinamento(uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_lista_treinamento(uuid,jsonb,jsonb) TO authenticated;
DROP POLICY lpp_insert ON public.lista_presenca_participantes;
DROP POLICY lpp_update ON public.lista_presenca_participantes;
CREATE POLICY lpp_insert ON public.lista_presenca_participantes FOR INSERT TO authenticated WITH CHECK (EXISTS(SELECT 1 FROM public.listas_presenca l WHERE l.id=lista_id AND l.user_id=lista_presenca_participantes.user_id AND (l.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY lpp_update ON public.lista_presenca_participantes FOR UPDATE TO authenticated USING (EXISTS(SELECT 1 FROM public.listas_presenca l WHERE l.id=lista_id AND l.user_id=lista_presenca_participantes.user_id AND (l.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')))) WITH CHECK (EXISTS(SELECT 1 FROM public.listas_presenca l WHERE l.id=lista_id AND l.user_id=lista_presenca_participantes.user_id AND (l.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));