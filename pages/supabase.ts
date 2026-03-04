import { createClient } from '@supabase/supabase-js'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase      = createClient(URL, ANON)
export const supabaseAdmin = createClient(URL, SVC, {
  auth: { autoRefreshToken: false, persistSession: false }
})
