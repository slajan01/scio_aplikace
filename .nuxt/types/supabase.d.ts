declare module '#supabase/server' {
  const serverSupabaseClient: typeof import('/workspaces/scio_aplikace/node_modules/@nuxtjs/supabase/dist/runtime/server/services').serverSupabaseClient
  const serverSupabaseServiceRole: typeof import('/workspaces/scio_aplikace/node_modules/@nuxtjs/supabase/dist/runtime/server/services').serverSupabaseServiceRole
  const serverSupabaseUser: typeof import('/workspaces/scio_aplikace/node_modules/@nuxtjs/supabase/dist/runtime/server/services').serverSupabaseUser
  const serverSupabaseSession: typeof import('/workspaces/scio_aplikace/node_modules/@nuxtjs/supabase/dist/runtime/server/services').serverSupabaseSession
}