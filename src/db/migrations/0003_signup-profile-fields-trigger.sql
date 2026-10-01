CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_role public.user_role;
  full_name text := nullif(left(btrim(NEW.raw_user_meta_data->>'full_name'), 100), '');
  company_name text := nullif(left(btrim(NEW.raw_user_meta_data->>'company'), 100), '');
  job_title text := nullif(left(btrim(NEW.raw_user_meta_data->>'job_title'), 100), '');
BEGIN
  new_role := (CASE WHEN NEW.raw_user_meta_data->>'role' = 'recruiter' THEN 'recruiter' ELSE 'applicant' END)::public.user_role;

  INSERT INTO public.profiles (id, email, role, display_name, job_title)
  VALUES (
    NEW.id,
    NEW.email,
    new_role,
    full_name,
    CASE WHEN new_role = 'recruiter' THEN job_title END
  );

  IF new_role = 'recruiter' AND company_name IS NOT NULL THEN
    INSERT INTO public.companies (owner_id, name) VALUES (NEW.id, company_name);
  END IF;

  RETURN NEW;
END;
$$;
