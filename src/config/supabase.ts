import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cleqfnrbiqpxpzxkatda.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bGMmJHoaG9v29DQ4GrvuKA_BvHrHKf_";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
