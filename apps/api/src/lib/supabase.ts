import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qrqdavorzpxwvaxflpbu.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycWRhdm9yenB4d3ZheGZscGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI1MDEwMywiZXhwIjoyMDk2ODI2MTAzfQ.nLPVm1krpeYVBuRVeyz9k6Melyja7AECR3jcH_TFPFQ'

export const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})
