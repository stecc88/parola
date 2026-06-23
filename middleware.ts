import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set(name, '', options)
        }
      }
    }
  )

  const { data: userData } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isStudentArea = pathname.startsWith('/student')
  const isExempt = pathname === '/student/pending' || pathname === '/student/join-class'

  if (userData.user && isStudentArea && !isExempt) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, student_status')
      .eq('id', userData.user.id)
      .single()

    if (
      profile?.role === 'student' &&
      profile.student_status !== 'approved' &&
      profile.student_status !== null
    ) {
      return NextResponse.redirect(new URL('/student/pending', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
