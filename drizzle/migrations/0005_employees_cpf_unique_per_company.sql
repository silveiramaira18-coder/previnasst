-- Impede o mesmo CPF, já normalizado, duas vezes na mesma empresa do mesmo usuário.
-- Empresa própria: contractor_id nulo. Terceirizada: o contractor_id da empresa.

CREATE OR REPLACE FUNCTION public.cpf_somente_digitos(valor text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT nullif(regexp_replace(coalesce(valor, ''), '[^0-9]', '', 'g'), '');
$$;

CREATE UNIQUE INDEX IF NOT EXISTS employees_cpf_propria_uidx
ON public.employees (user_id, public.cpf_somente_digitos(cpf))
WHERE contractor_id IS NULL
  AND public.cpf_somente_digitos(cpf) IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS employees_cpf_contractor_uidx
ON public.employees (user_id, contractor_id, public.cpf_somente_digitos(cpf))
WHERE contractor_id IS NOT NULL
  AND public.cpf_somente_digitos(cpf) IS NOT NULL;
