-- Drop the old has_role function that takes text parameter
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Keep only the correct version that takes app_role enum
-- This should already exist from our previous migration