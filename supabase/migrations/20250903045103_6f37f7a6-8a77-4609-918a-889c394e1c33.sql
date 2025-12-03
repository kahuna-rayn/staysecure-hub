-- Update naresh@parshotam.com to have super_admin role
UPDATE public.user_roles 
SET role = 'super_admin'
FROM auth.users au 
WHERE user_roles.user_id = au.id 
  AND au.email = 'naresh@parshotam.com';