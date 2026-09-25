ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_phone text,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.company_documents ADD COLUMN IF NOT EXISTS alerta_7d_enviado date;
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS alerta_7d_enviado date;