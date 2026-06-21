import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente con Service Role Key — bypassea RLS por completo.
 *
 * REGLA CRÍTICA: nunca importar este módulo desde código que pueda
 * terminar en un bundle de cliente (componentes 'use client', hooks,
 * etc.). Solo usar dentro de:
 *   - Route Handlers (app/api/.../route.ts)
 *   - Server Actions ('use server')
 *   - Server Components que NO pasan el resultado crudo al cliente
 *
 * No exportar una instancia singleton a nivel de módulo importable
 * desde cualquier lado: se expone solo a través de getAdminClient(),
 * y se verifica explícitamente que SUPABASE_SERVICE_ROLE_KEY exista
 * solo en runtime de servidor (no tiene prefijo NEXT_PUBLIC_).
 */

let cachedClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createAdminClient() fue invocado en el browser. ' +
        'Este cliente usa la service role key y NUNCA debe ejecutarse client-side.'
    )
  }

  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.'
    )
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      // CRÍTICO: Next.js cachea automáticamente las llamadas fetch()
      // hechas en el servidor (Data Cache). El cliente de Supabase usa
      // fetch internamente para cada query — sin esto, una consulta
      // (ej. "¿es admin?") puede quedar cacheada y devolver datos viejos
      // en requests posteriores aunque la fila haya cambiado en la DB.
      fetch: (url: RequestInfo | URL, options?: RequestInit) =>
        fetch(url, { ...options, cache: 'no-store' })
    }
  })

  return cachedClient
}

/**
 * Verifica que el usuario de la sesión actual (obtenida vía cliente server
 * normal, con cookies) tenga role === 'admin' antes de permitir cualquier
 * operación admin. Debe llamarse al inicio de TODO endpoint que use
 * createAdminClient() para mutaciones sensibles.
 *
 * Lanza si no es admin; quien llama decide cómo traducir eso a una
 * respuesta HTTP (401/403).
 */
export async function assertIsAdmin(userId: string | undefined): Promise<void> {
  if (!userId) {
    throw new Error('UNAUTHENTICATED')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !data || data.role !== 'admin') {
    throw new Error('FORBIDDEN_NOT_ADMIN')
  }
}
