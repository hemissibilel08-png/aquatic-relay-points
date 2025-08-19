// Supabase client configuration for Biancotto V2
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuration Supabase - Remplacez par vos vraies valeurs
const SUPABASE_URL = "https://kqfvleidiwpfsrmgkfpm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZnZsZWlkaXdwZnNybWdrZnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDI1MzgsImV4cCI6MjA3MTIxODUzOH0.gVJtKS1969wl0mDrsIVUGzCB3Gr6Dv6VeIZBIl3yAyE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Configuration pour magic links
    flowType: 'pkce'
  }
});