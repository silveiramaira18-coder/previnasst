-- 1. Tipos de usuário
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'inspetor', 'responsavel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Perfil: foto e telefone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone text;

-- 3. Papel automático no cadastro (primeiro usuário vira admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, empresa)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'empresa')
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    v_role := 'admin';
  ELSE
    BEGIN
      v_role := COALESCE((NEW.raw_user_meta_data ->> 'perfil')::public.app_role, 'inspetor');
    EXCEPTION WHEN others THEN
      v_role := 'inspetor';
    END;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

-- 3b. Papel para usuários já existentes (o mais antigo vira admin)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, CASE WHEN u.id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
                  THEN 'admin'::public.app_role ELSE 'inspetor'::public.app_role END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id);

-- 4. Acesso total do administrador aos registros
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'obras','inspecoes','itens_inspecao','checklists','itens_checklist','respostas_inspecao',
    'nao_conformidades','acoes_corretivas','fotos_inspecao','fotos_item_inspecao',
    'fotos_nao_conformidade','fotos_acao_corretiva','profiles'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))',
        t || '_admin_all', t);
    END IF;
  END LOOP;
END $$;

-- 5. Storage: dono da pasta ou administrador
DROP POLICY IF EXISTS "fotos_select_own" ON storage.objects;
DROP POLICY IF EXISTS "fotos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "fotos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "fotos_delete_own" ON storage.objects;

CREATE POLICY "fotos_select_own_or_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'fotos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "fotos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fotos_update_own_or_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')))
  WITH CHECK (bucket_id = 'fotos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "fotos_delete_own_or_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'fotos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));