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
  const isTeacherArea = pathname.startsWith('/teacher')
  const isAdminArea = pathname.startsWith('/admin')
  const isStudentExempt =
    pathname === '/student/pending' ||
    pathname === '/student/expired' ||
    pathname === '/student/join-class'
  const isTeacherExempt =
    pathname === '/teacher/pending' ||
    pathname === '/teacher/expired'

  if (!userData.user) {
    if (isStudentArea || isTeacherArea || isAdminArea) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  if (isStudentArea && !isStudentExempt) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, student_status, subscription_end_at')
      .eq('id', userData.user.id)
      .single()

    if (profile?.role !== 'student') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (profile.student_status !== 'approved' && profile.student_status !== null) {
      return NextResponse.redirect(new URL('/student/pending', request.url))
    }
    if (profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()) {
      return NextResponse.redirect(new URL('/student/expired', request.url))
    }
  }

  if (isTeacherArea && !isTeacherExempt) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, teacher_status, subscription_end_at')
      .eq('id', userData.user.id)
      .single()

    if (profile?.role !== 'teacher') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (profile.teacher_status !== 'approved') {
      return NextResponse.redirect(new URL('/teacher/pending', request.url))
    }
    if (profile.subscription_end_at && new Date(profile.subscription_end_at) < new Date()) {
      return NextResponse.redirect(new URL('/teacher/expired', request.url))
    }
  }

  if (isAdminArea) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
