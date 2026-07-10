import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://qrqdavorzpxwvaxflpbu.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycWRhdm9yenB4d3ZheGZscGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTAxMDMsImV4cCI6MjA5NjgyNjEwM30.IFGD--AzjxSxXN5HYxEf-74o63D4EOoX4-VbJ1dc8XI"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const TENANT_ID = "55ac8fa1-60e1-47f4-8dab-3dfdb3ec1f23"
