import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          const cookies = document.cookie.split(';')
          return cookies.map(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=')
            return { name, value: valueParts.join('=') }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}`
            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
            if (options?.path) cookie += `; path=${options.path}`
            cookie += '; sameSite=lax'
            document.cookie = cookie
          })
        },
      },
    }
  )
}