import { useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

interface AuthEventRedirectProps {
  supabaseClient: SupabaseClient;
  onPasswordRecovery?: (hash: string) => void;
}

const AuthEventRedirect = ({ supabaseClient, onPasswordRecovery }: AuthEventRedirectProps) => {
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        const hash = window.location.hash || "";
        if (onPasswordRecovery) {
          onPasswordRecovery(hash);
        } else {
          // Fallback: use window.location for navigation
          window.location.href = "/reset-password" + hash;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabaseClient, onPasswordRecovery]);

  return null;
};

export default AuthEventRedirect;
