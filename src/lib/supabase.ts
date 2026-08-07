import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://mhmjkutnyixrhssvblka.supabase.co"

const supabaseKey = "sb_publishable_3jmoPTnXgPzPK3ccxJdQBg_BRk4TxPf"

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)