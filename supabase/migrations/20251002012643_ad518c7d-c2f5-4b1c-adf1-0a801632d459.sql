-- Function to handle account_inventory updates on profile deletion
CREATE OR REPLACE FUNCTION public.handle_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all account_inventory records for this user
  UPDATE public.account_inventory
  SET 
    status = 'Inactive',
    date_access_revoked = CURRENT_DATE,
    modified_at = NOW(),
    modified_by = COALESCE(OLD.full_name, OLD.username, OLD.id::text)
  WHERE user_id = OLD.id
    AND status != 'Inactive';
  
  RETURN OLD;
END;
$$;

-- Trigger to run before profile deletion
CREATE TRIGGER before_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_deletion();

-- Function to handle account_inventory activation
CREATE OR REPLACE FUNCTION public.handle_profile_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When profile status changes to Active, update account_inventory
  IF NEW.status = 'Active' AND OLD.status != 'Active' THEN
    UPDATE public.account_inventory
    SET 
      status = 'Active',
      modified_at = NOW(),
      modified_by = COALESCE(NEW.full_name, NEW.username, NEW.id::text)
    WHERE user_id = NEW.id
      AND status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to run after profile update
CREATE TRIGGER after_profile_activation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.status = 'Active' AND OLD.status != 'Active')
  EXECUTE FUNCTION public.handle_profile_activation();

-- Ensure account_inventory has proper defaults
ALTER TABLE public.account_inventory 
  ALTER COLUMN status SET DEFAULT 'Pending';

-- Add trigger to set created_by on account_inventory insert
CREATE OR REPLACE FUNCTION public.set_account_inventory_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set created_by from the user's profile if not already set
  IF NEW.created_by IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT COALESCE(full_name, username, id::text)
    INTO NEW.created_by
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER before_account_inventory_insert
  BEFORE INSERT ON public.account_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_account_inventory_created_by();