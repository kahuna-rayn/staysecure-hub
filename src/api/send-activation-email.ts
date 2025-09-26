import { createClient } from "@supabase/supabase-js";

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    // First, check if user exists in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, full_name')
      .eq('username', email)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (!profile) {
      return res.status(404).json({ 
        error: "This email address is not registered in our system. Please contact your administrator to request access." 
      });
    }

    // Get the current app's base URL and redirect to activation page
    const baseUrl = req.headers.origin || 'http://localhost:5175';
    const redirectUrl = `${baseUrl}/activate-account`;

    // Use service role to send activation email
    const { data, error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      message: "Activation email sent successfully!",
      data 
    });

  } catch (err: any) {
    console.error('Activation email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
