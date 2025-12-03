-- Fix location_id validation in handle_new_user function to check against locations table
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  final_username text;
  final_employee_id text;
  counter integer;
  user_access_level text;
  assigned_role app_role;
BEGIN
  -- Validate that app_role type exists and is accessible
  -- This will fail early if there are permission issues
  SELECT 'user'::app_role INTO assigned_role;
  
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
  
  -- Role mapping for user_roles table
  CASE user_access_level
    WHEN 'Super Admin' THEN assigned_role := 'super_admin';
    WHEN 'Admin' THEN assigned_role := 'super_admin';
    WHEN 'Client Admin' THEN assigned_role := 'client_admin';
    WHEN 'Author' THEN assigned_role := 'Author';
    WHEN 'Manager' THEN assigned_role := 'manager';
    ELSE assigned_role := 'user';
  END CASE;
  
  -- Validate location_id if provided - CHECK AGAINST LOCATIONS TABLE
  IF NEW.raw_user_meta_data ->> 'location_id' IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.locations 
      WHERE id = (NEW.raw_user_meta_data ->> 'location_id')::uuid
    ) THEN
      RAISE LOG 'Invalid location_id provided: %, creating user without location', 
        NEW.raw_user_meta_data ->> 'location_id';
      -- Continue without location_id rather than failing
    END IF;
  END IF;
  
  -- Insert profile with validation
  INSERT INTO public.profiles (
    id, 
    full_name, 
    first_name,
    last_name,
    username,
    status,
    employee_id,
    phone,
    location,
    location_id,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    final_username,
    'Pending',
    final_employee_id,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'location', ''),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'location_id' IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM public.locations 
          WHERE id = (NEW.raw_user_meta_data ->> 'location_id')::uuid
        )
      THEN (NEW.raw_user_meta_data ->> 'location_id')::uuid 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'bio', ''),
    NOW(),
    NOW()
  );
  
  -- Insert into user_roles table with appropriate role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id) DO UPDATE SET role = assigned_role;
  
  RAISE LOG 'Successfully created profile for user % with username % and role %', 
    NEW.id, final_username, assigned_role;
  
  RETURN NEW;
EXCEPTION
  -- Only catch specific expected errors, let critical ones bubble up
  WHEN unique_violation THEN
    RAISE LOG 'Unique violation creating profile for user %: %', NEW.id, SQLERRM;
    -- Try to continue with a different username
    final_username := base_username || extract(epoch from now())::text;
    
    -- Retry the insert with a timestamp-based username
    INSERT INTO public.profiles (
      id, full_name, first_name, last_name, username, status, employee_id,
      phone, location, location_id, bio, created_at, updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      final_username,
      'Pending',
      final_employee_id,
      COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'location', ''),
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'location_id' IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM public.locations 
            WHERE id = (NEW.raw_user_meta_data ->> 'location_id')::uuid
          )
        THEN (NEW.raw_user_meta_data ->> 'location_id')::uuid 
        ELSE NULL 
      END,
      COALESCE(NEW.raw_user_meta_data ->> 'bio', ''),
      NOW(),
      NOW()
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id) DO UPDATE SET role = assigned_role;
    
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but let it bubble up to fail user creation
    RAISE LOG 'Critical error creating profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    RAISE;
END;
$function$;