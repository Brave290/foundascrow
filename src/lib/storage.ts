import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'vault-files'

let client: SupabaseClient | null = null
function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    })
  }
  return client
}

async function ensureBucket() {
  const { error } = await supabaseAdmin().storage.createBucket(BUCKET, { public: false })
  if (error && !error.message.includes('already exists')) throw new Error(error.message)
}

export async function uploadToVault(reference: string, fileName: string, data: Buffer, contentType: string) {
  await ensureBucket()
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${reference}/${Date.now()}-${safe}`
  const { error } = await supabaseAdmin().storage.from(BUCKET).upload(path, data, { contentType })
  if (error) throw new Error(error.message)
  return path
}

export async function signedUrl(path: string) {
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUrl(path, 120)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
