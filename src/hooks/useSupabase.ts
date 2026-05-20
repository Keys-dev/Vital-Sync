import { supabase } from '@/lib/supabase';

// Supabase is now a plain singleton — no JWT injection needed.
// This shim keeps existing hook imports working unchanged.
export function useSupabase() {
  return supabase;
}