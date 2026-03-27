import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')

  if (errorParam) {
    const errorMessage = errorDescription || errorParam || 'Authentication failed'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No authorization code provided`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            response.cookies.set(name, value, {
              path: '/',
              sameSite: 'lax',
              secure: !isLocalhost,
              maxAge: 60 * 60 * 24 * 365,
            })
          })
        },
      },
    }
  )

  const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
  }

  if (!data.session) {
    return NextResponse.redirect(`${origin}/login?error=Session creation failed`)
  }

  return response
}