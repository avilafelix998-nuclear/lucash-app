'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Importamos Link para la navegación interna de Next.js

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
    }
    setLoading(false)
  }

  return (
    // Agregamos "relative" al contenedor principal para posicionar el botón de volver
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
      
      {/* 🔙 BOTÓN VOLVER AL INICIO */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition duration-200"
        >
          ← Volver al inicio
        </Link>
      </div>

      {/* TARJETA DE LOGIN */}
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-yellow-400">Lucash 🧠</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Ingresá a tu panel financiero
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 sm:text-sm"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-sm text-red-400">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-green-950/50 border border-green-900 p-3 text-sm text-green-400">
              ✉️ {successMsg}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex w-full justify-center rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 focus:outline-none disabled:opacity-50"
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}