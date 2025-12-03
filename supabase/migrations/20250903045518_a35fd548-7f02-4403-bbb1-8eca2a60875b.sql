-- Simplify role system by migrating admin to super_admin and removing client_admin complexity
-- Update all existing 'admin' roles to 'super_admin' for clarity
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE role = 'admin';

-- Update handle_new_user function with cleaner role mapping
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
  user_access_level text;
  assigned_role app_role;
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
  
  -- Get access level to determine role
  user_access_level := COALESCE(NEW.raw_user_meta_data ->> 'access_level', 'User');
  
  -- Simplified role mapping
  CASE user_access_level
    WHEN 'Super Admin' THEN assigned_role := 'super_admin';
    WHEN 'Admin' THEN assigned_role := 'super_admin';  -- Admin gets full access
    WHEN 'Manager' THEN assigned_role := 'moderator';
    ELSE assigned_role := 'user';
  END CASE;
  
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
    user_access_level,
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
  
  -- Assign appropriate role based on access level
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id) DO UPDATE SET role = assigned_role;
  
  RETURN NEW;
END;
$$;