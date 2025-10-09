-- Fix hard delete failure: account_inventory.modified_by is uuid but trigger wrote text
-- Update trigger functions to store UUID (the user id) instead of text values

-- 1) Handle profile deletion: set modified_by = OLD.id (uuid)
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update all account_inventory records for this user
  UPDATE public.account_inventory
  SET 
    status = 'Inactive',
    date_access_revoked = CURRENT_DATE,
    modified_at = NOW(),
    modified_by = OLD.id -- use uuid, not text
  WHERE user_id = OLD.id
    AND status != 'Inactive';
  
  RETURN OLD;
END;
$function$;

-- 2) Handle profile activation: set modified_by = NEW.id (uuid)
CREATE OR REPLACE FUNCTION public.handle_profile_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When profile status changes to Active, update account_inventory
  IF NEW.status = 'Active' AND OLD.status != 'Active' THEN
    UPDATE public.account_inventory
    SET 
      status = 'Active',
      modified_at = NOW(),
      modified_by = NEW.id -- use uuid, not text
    WHERE user_id = NEW.id
      AND status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$function$;