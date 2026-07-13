import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function LandingPage() {
  // Verificamos si el usuario ya tiene una sesión activa desde el servidor
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-yellow-400 selection:text-black">
      
      {/* 1. NAVEGACIÓN (HEADER) */}
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-yellow-400">Lucash 🧠</span>
        </div>
        <nav className="flex items-center gap-6">
          {user ? (
            <Link 
              href="/dashboard" 
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-500 transition duration-200"
            >
              Ir a mi Dashboard 📊
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="text-sm font-semibold text-zinc-300 hover:text-white transition duration-200"
            >
              Iniciar Sesión
            </Link>
          )}
        </nav>
      </header>

      {/* 2. HERO SECTION */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-4 py-1.5 text-xs font-semibold text-yellow-400 animate-pulse">
          ⚡ Disponible gratis en Telegram ahora
        </div>
        
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
          Tu plata, <br className="md:hidden" />
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">ordenada.</span>
        </h1>
        
        <p className="mx-auto max-w-2xl text-lg text-zinc-400 leading-relaxed">
          Mandá un mensaje, un audio o una foto. Lucash entiende, registra y te muestra todo claro — sin instalar apps financieras complejas, directo desde tu chat.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a 
            href="https://t.me/soylucash_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-center rounded-xl bg-yellow-400 px-8 py-4 text-base font-black text-black hover:bg-yellow-500 transition duration-200 transform hover:scale-[1.02]"
          >
            Chatear con Lucash 💬
          </a>
          
          <Link 
            href={user ? "/dashboard" : "/login"} 
            className="w-full sm:w-auto text-center rounded-xl border border-zinc-800 bg-zinc-900/40 px-8 py-4 text-base font-semibold text-zinc-200 hover:bg-zinc-900 hover:text-white transition duration-200"
          >
            {user ? "Ver mi Dashboard 📊" : "Crear mi Cuenta 🚀"}
          </Link>
        </div>
        
        <p className="text-xs text-zinc-500">
          Uso gratuito · Sincronización segura de base de datos · Sin tarjetas de crédito
        </p>
      </section>

      {/* 3. SECCIÓN DE CARACTERÍSTICAS (FEATURES) */}
      <section className="border-t border-zinc-900 bg-zinc-900/10 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesitás. Nada de lo que no.</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm">
              Diseñado bajo el principio de simplicidad absoluta. Olvidate de rellenar pesados formularios cada vez que gastás un billete.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tarjeta 1 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 space-y-4">
              <div className="text-3xl">🎙️</div>
              <h3 className="text-xl font-bold text-yellow-400">Audio, texto o fotos</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Mandá un audio rápido mientras manejás o escribí en texto libre. Nuestro motor de IA (Gemini) extrae el monto, concepto y categoría de inmediato.
              </p>
            </div>

            {/* Tarjeta 2 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 space-y-4">
              <div className="text-3xl">🗂️</div>
              <h3 className="text-xl font-bold text-yellow-400">Categorización Automática</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Comida, transporte, salud o entretenimiento. Lucash asigna la categoría correcta de forma inteligente para que no tengas que clasificar nada a mano.
              </p>
            </div>

            {/* Tarjeta 3 */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 space-y-4">
              <div className="text-3xl">📊</div>
              <h3 className="text-xl font-bold text-yellow-400">Dashboard en Tiempo Real</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Accedé a tu panel web seguro desde cualquier dispositivo para ver gráficos dinámicos de gastos mensuales, balances y tablas detalladas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN CÓMO FUNCIONA (HOW IT WORKS) */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Tres pasos. Eso es todo.</h2>
            <p className="text-zinc-400 text-sm">
              Sin tutoriales ni configuraciones complejas. Funciona desde el primer mensaje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            
            {/* Paso 1 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-yellow-400 font-black border border-zinc-800">
                1
              </div>
              <h4 className="text-lg font-bold">Mandá un mensaje</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Escribile a Lucash en Telegram como si le escribieras a un amigo: *"Gasté 12000 en el veterinario"*.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-yellow-400 font-black border border-zinc-800">
                2
              </div>
              <h4 className="text-lg font-bold">La IA lo procesa</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                La IA analiza el texto o audio, estructura los datos y los guarda de forma segura en tu base de datos en milisegundos.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-yellow-400 font-black border border-zinc-800">
                3
              </div>
              <h4 className="text-lg font-bold">Consultá el Dashboard</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Iniciá sesión en la web, vinculá tu ID y visualizá todos tus movimientos históricos ordenados por categoría.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Lucash App. Todos los derechos reservados.</p>
        <p className="mt-2 text-zinc-600">Construido como asistente financiero inteligente para Telegram.</p>
      </footer>

    </div>
  )
}