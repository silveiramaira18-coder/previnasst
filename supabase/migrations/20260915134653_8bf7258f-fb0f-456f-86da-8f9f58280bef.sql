CREATE OR REPLACE FUNCTION public.is_admin_principal(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id
      AND lower(u.email) IN ('silveiramaira18@gmail.com', 'previnasst2@gmail.com')
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, empresa, cargo)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'empresa', NEW.raw_user_meta_data ->> 'cargo')
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email, '')) IN ('silveiramaira18@gmail.com', 'previnasst2@gmail.com') THEN
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
END; $function$;

-- Garante o papel de administrador para os dois e-mails já cadastrados
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('silveiramaira18@gmail.com', 'previnasst2@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove papel de administrador de qualquer outro e-mail
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'admin'
  AND lower(u.email) NOT IN ('silveiramaira18@gmail.com', 'previnasst2@gmail.com');