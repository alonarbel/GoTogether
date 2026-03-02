import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Only create client if env vars are set
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// TODO: Replace mock-data.ts calls with real Supabase queries once env vars are set
// Example:
// export async function getCards() {
//   if (!supabase) return mockCards
//   const { data } = await supabase.from('cards_with_count').select('*, card_images(*), participants(*)')
//   return data ?? []
// }
