-- 1. Perfil: cargo
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo text;

-- 2. Administradora principal
CREATE OR REPLACE FUNCTION public.is_admin_principal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id AND lower(u.email) = 'silveiramaira18@gmail.com'
  )
$$;

-- 3. has_role: papel admin exige ser a administradora principal
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
  AND (_role <> 'admin' OR public.is_admin_principal(_user_id))
$$;

-- 4. Limpeza: remove admin de contas que não são a principal
DELETE FROM public.user_roles ur
WHERE ur.role = 'admin' AND NOT public.is_admin_principal(ur.user_id);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE lower(u.email) = 'silveiramaira18@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'inspetor'::public.app_role FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Impede escalonamento de privilégio
CREATE OR REPLACE FUNCTION public.bloquear_admin_indevido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' AND NOT public.is_admin_principal(NEW.user_id) THEN
    RAISE EXCEPTION 'Apenas a administradora principal pode ter o papel de administrador.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS user_roles_bloquear_admin ON public.user_roles;
CREATE TRIGGER user_roles_bloquear_admin
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.bloquear_admin_indevido();

-- 6. Novo usuário: nunca admin (exceto a principal)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, empresa, cargo)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'empresa', NEW.raw_user_meta_data ->> 'cargo')
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email, '')) = 'silveiramaira18@gmail.com' THEN
    v_role := 'admin';
  ELSE
    BEGIN
      v_role := COALESCE((NEW.raw_user_meta_data ->> 'perfil')::public.app_role, 'inspetor');
    EXCEPTION WHEN others THEN
      v_role := 'inspetor';
    END;
    IF v_role = 'admin' THEN v_role := 'inspetor'; END IF;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

-- 7. Checklists: leitura para todos os usuários autenticados, escrita só da administradora
DROP POLICY IF EXISTS checklists_own ON public.checklists;
DROP POLICY IF EXISTS itens_checklist_own ON public.itens_checklist;

CREATE POLICY checklists_select_autenticados ON public.checklists
FOR SELECT TO authenticated USING (true);

CREATE POLICY itens_checklist_select_autenticados ON public.itens_checklist
FOR SELECT TO authenticated USING (true);
