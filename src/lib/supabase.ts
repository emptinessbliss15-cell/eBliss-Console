import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zaabghrczrbqkxrhkinj.supabase.co'
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_QL6Bz9m30CV8HFIdkLQ42Q_N9AFIOkF'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
