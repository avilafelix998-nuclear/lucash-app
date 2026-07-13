import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Usamos export default para evitar problemas con Turbopack
export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas de la app excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (optimización de imágenes)
     * - favicon.ico y archivos multimedia (svg, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}