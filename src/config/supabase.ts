import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ufvingocbzegpgjknzhm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmdmluZ29jYnplZ3BnamtuemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjQ2MTUsImV4cCI6MjA2Mzk0MDYxNX0.lEUYYYZnZcWtJLdcDk4qUm2M_zL5Xv58N0FheSHgGp0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
