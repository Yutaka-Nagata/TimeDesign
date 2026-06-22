import { createClient } from '@supabase/supabase-js'

// Fallback values prevent build-time crash when env vars are not set.
// Actual API calls will fail gracefully and redirect to /auth.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
)
