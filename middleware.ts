import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { VERIFIED_HEADER, type VerifiedAuth } from '@/lib/auth/verifiedRequest'

export async function middleware(request: NextRequest) {
  // Un client potrebbe inviare questo header per conto suo: lo togliamo
  // SEMPRE prima di eventualmente impostare il nostro valore verificato,
  // altrimenti potrebbe far credere a un Server Component di essere già
  // stato verificato qui senza esserlo davvero.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete(VERIFIED_HEADER)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

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
  const isAccountArea = pathname.startsWith('/account')
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

  // Legge il profilo UNA sola volta per richiesta (prima veniva letto
  // separatamente in ognuno dei blocchi sotto) e lo inoltra sempre alla
  // pagina via header verificato, cosicché i guard a valle
  // (requireApprovedTeacher, admin/layout.tsx, getMyProfile) possano
  // evitare di rifare la stessa auth.getUser() + query su profiles.
  // Per le pagine "exempt" (pending/expired/join-class) manteniamo il
  // comportamento originale e non facciamo la query, dato che quelle
  // pagine fanno già il proprio controllo indipendente.
  const needsProfile =
    (isStudentArea && !isStudentExempt) ||
    (isTeacherArea && !isTeacherExempt) ||
    isAdminArea ||
    isAccountArea

  let profile: {
    role: string
    teacher_status: string | null
    student_status: string | null
    subscription_end_at: string | null
  } | null = null

  if (needsProfile) {
    const { data } = await supabase
      .from('profiles')
      .select('role, teacher_status, student_status, subscription_end_at')
      .eq('id', userData.user.id)
      .single()
    profile = data
  }

  if (isStudentArea && !isStudentExempt) {
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

  if (isAdminArea && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (needsProfile) {
    const payload: VerifiedAuth = {
      userId: userData.user.id,
      role: (profile?.role as VerifiedAuth['role']) ?? null,
      teacherStatus: profile?.teacher_status ?? null,
      studentStatus: profile?.student_status ?? null,
      subscriptionEndAt: profile?.subscription_end_at ?? null
    }
    requestHeaders.set(VERIFIED_HEADER, JSON.stringify(payload))
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  return response
}

export const config = {
  // Solo le aree che richiedono una sessione: le pagine pubbliche (home,
  // privacy, login, manifest, favicon…) non devono pagare una chiamata
  // auth.getUser() (round-trip verso Supabase) a ogni visita. /account è
  // incluso per il refresh del token di sessione e ora anche per inoltrare
  // il profilo già letto qui (il suo guard resta comunque server-side
  // nella pagina, con fallback pieno se l'header manca).
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/account/:path*']
}
