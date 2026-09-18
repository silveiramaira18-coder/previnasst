CREATE TABLE public.company_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES public.contractors(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_job_roles TO authenticated;
GRANT ALL ON public.company_job_roles TO service_role;

ALTER TABLE public.company_job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_job_roles_own ON public.company_job_roles
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    contractor_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = contractor_id AND c.user_id = auth.uid()
    )
  )
);

CREATE POLICY company_job_roles_admin_all ON public.company_job_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX company_job_roles_direct_name_unique
ON public.company_job_roles (user_id, lower(name))
WHERE contractor_id IS NULL;

CREATE UNIQUE INDEX company_job_roles_contractor_name_unique
ON public.company_job_roles (user_id, contractor_id, lower(name))
WHERE contractor_id IS NOT NULL;

CREATE INDEX company_job_roles_contractor_idx
ON public.company_job_roles (contractor_id, name);