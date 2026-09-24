-- Permite que o autor do registro (além do administrador) crie, edite e exclua seus documentos GED.
DROP POLICY IF EXISTS company_documents_admin_insert ON public.company_documents;
DROP POLICY IF EXISTS company_documents_admin_update ON public.company_documents;
DROP POLICY IF EXISTS company_documents_admin_delete ON public.company_documents;
CREATE POLICY company_documents_insert_own ON public.company_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY company_documents_update_own ON public.company_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY company_documents_delete_own ON public.company_documents FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS employee_documents_admin_insert ON public.employee_documents;
DROP POLICY IF EXISTS employee_documents_admin_update ON public.employee_documents;
DROP POLICY IF EXISTS employee_documents_admin_delete ON public.employee_documents;
CREATE POLICY employee_documents_insert_own ON public.employee_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY employee_documents_update_own ON public.employee_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY employee_documents_delete_own ON public.employee_documents FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS employees_admin_insert ON public.employees;
DROP POLICY IF EXISTS employees_admin_update ON public.employees;
DROP POLICY IF EXISTS employees_admin_delete ON public.employees;
CREATE POLICY employees_insert_own ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY employees_update_own ON public.employees FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY employees_delete_own ON public.employees FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS contractors_admin_insert ON public.contractors;
DROP POLICY IF EXISTS contractors_admin_update ON public.contractors;
DROP POLICY IF EXISTS contractors_admin_delete ON public.contractors;
CREATE POLICY contractors_insert_own ON public.contractors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY contractors_update_own ON public.contractors FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY contractors_delete_own ON public.contractors FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS company_job_roles_admin_insert ON public.company_job_roles;
DROP POLICY IF EXISTS company_job_roles_admin_update ON public.company_job_roles;
DROP POLICY IF EXISTS company_job_roles_admin_delete ON public.company_job_roles;
CREATE POLICY company_job_roles_insert_own ON public.company_job_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY company_job_roles_update_own ON public.company_job_roles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY company_job_roles_delete_own ON public.company_job_roles FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS documentos_insert_admin ON storage.objects;
DROP POLICY IF EXISTS documentos_update_admin ON storage.objects;
DROP POLICY IF EXISTS documentos_delete_admin ON storage.objects;
CREATE POLICY documentos_insert_own_or_admin ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos' AND (((storage.foldername(name))[1] = auth.uid()::text) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY documentos_update_own_or_admin ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documentos' AND (((storage.foldername(name))[1] = auth.uid()::text) OR public.has_role(auth.uid(), 'admin'))) WITH CHECK (bucket_id = 'documentos' AND (((storage.foldername(name))[1] = auth.uid()::text) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY documentos_delete_own_or_admin ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos' AND (((storage.foldername(name))[1] = auth.uid()::text) OR public.has_role(auth.uid(), 'admin')));