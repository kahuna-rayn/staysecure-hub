-- Update the handle_new_user function to handle username conflicts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
as $$
DECLARE
  base_username text;
  final_username text;
  final_employee_id text;
  counter integer;
BEGIN
  -- Generate base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    split_part(NEW.email, '@', 1),
    'user'
  );
  
  -- Ensure username is unique
  final_username := base_username;
  counter := 0;
  
  WHILE EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
    
    -- Safety break to prevent infinite loops
    IF counter > 999 THEN
      final_username := base_username || extract(epoch from now())::text;
      EXIT;
    END IF;
  END LOOP;
  
  -- Generate unique employee_id if not provided
  final_employee_id := COALESCE(
    NEW.raw_user_meta_data ->> 'employee_id',
    'EMP-' || EXTRACT(YEAR FROM NOW()) || '-' || 
    LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' || 
    UPPER(SUBSTR(NEW.id::text, 1, 6))
  );
  
  -- Insert profile with unique values
  INSERT INTO public.profiles (
    id, 
    full_name, 
    first_name,
    last_name,
    username,
    access_level,
    status,
    employee_id,
    last_login,
    phone,
    location,
    location_id,
    bio
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    final_username,
    COALESCE(NEW.raw_user_meta_data ->> 'access_level', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'status', 'Active'),
    final_employee_id,
    NOW(),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'location', ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'location_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'location_id')::uuid 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'bio', '')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;