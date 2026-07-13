import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Si hay una ruta de destino alternativa definida en "next", la usamos, sino redirigimos a /dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient() // Esperamos al cliente asíncrono del servidor
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // Origen real detrás de balanceadores (ej. Vercel)
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Redirigir a una página de error si falla la validación
  return NextResponse.redirect(`${origin}/login?error=No se pudo validar el inicio de sesión`)
}