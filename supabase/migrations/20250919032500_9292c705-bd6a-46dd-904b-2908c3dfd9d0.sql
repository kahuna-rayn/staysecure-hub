-- Replace moderator role with manager and implement manager permissions

-- Step 1: Update existing user_roles records from 'moderator' to 'manager'
UPDATE public.user_roles 
SET role = 'manager'::app_role 
WHERE role = 'moderator'::app_role;

-- Step 2: Update the app_role enum to replace 'moderator' with 'manager'
ALTER TYPE public.app_role RENAME VALUE 'moderator' TO 'manager';

-- Step 3: Update the handle_new_user function to map Manager access level to manager role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
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
  
  -- Updated role mapping to use manager instead of moderator  
  CASE user_access_level
    WHEN 'Super Admin' THEN assigned_role := 'super_admin';
    WHEN 'Admin' THEN assigned_role := 'super_admin';  -- Admin gets full access
    WHEN 'Manager' THEN assigned_role := 'manager';    -- Changed from moderator to manager
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

-- Step 4: Create security definer function to check if user is manager of a department
CREATE OR REPLACE FUNCTION public.get_current_user_managed_departments()
RETURNS TABLE(department_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id
  FROM departments d
  WHERE d.manager_id = auth.uid();
END;
$$;

-- Step 5: Add RLS policies for managers to view users in their managed departments
-- Update profiles RLS to allow managers to view users in departments they manage
CREATE POLICY "Managers can view users in their departments" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  id IN (
    SELECT ud.user_id 
    FROM user_departments ud
    INNER JOIN get_current_user_managed_departments() mgd ON ud.department_id = mgd.department_id
  )
);

-- Update user_departments RLS to allow managers to view department assignments they manage
CREATE POLICY "Managers can view department assignments they manage" 
ON public.user_departments 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  department_id IN (SELECT department_id FROM get_current_user_managed_departments())
);

-- Update user_profile_roles RLS to allow managers to view role assignments for users in their departments
CREATE POLICY "Managers can view role assignments in their departments" 
ON public.user_profile_roles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  user_id IN (
    SELECT ud.user_id 
    FROM user_departments ud
    INNER JOIN get_current_user_managed_departments() mgd ON ud.department_id = mgd.department_id
  )
);