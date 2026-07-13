'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [transacciones, setTransacciones] = useState<any[]>([])
  
  // Input para el formulario de vinculación
  const [inputTelegramId, setInputTelegramId] = useState('')

  // Cargar usuario y transacciones al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      const tId = user.user_metadata?.telegram_id

      if (tId) {
        setTelegramId(tId)
        // CORREGIDO: Usamos .from() en vez de .table()
        const { data } = await supabase
          .from('transacciones')
          .select('*')
          .eq('user_id', tId)
          .order('created_at', { ascending: false })

        if (data) setTransacciones(data)
      }
      setLoading(false)
    }

    cargarDatos()
  }, [router])

  // Función para vincular el Telegram ID
  const handleVincular = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputTelegramId) return
    setLoading(true)

    const numericId = parseInt(inputTelegramId)
    if (isNaN(numericId)) {
      alert('Por favor ingresá un ID numérico válido.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      data: { telegram_id: numericId }
    })

    if (!error) {
      setTelegramId(numericId)
      // CORREGIDO: Usamos .from() en vez de .table()
      const { data } = await supabase
        .from('transacciones')
        .select('*')
        .eq('user_id', numericId)
        .order('created_at', { ascending: false })

      if (data) setTransacciones(data)
    } else {
      alert('Error al vincular: ' + error.message)
    }
    setLoading(false)
  }

  // Función para eliminar un gasto desde la web
  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que querés eliminar este registro?')) return

    // CORREGIDO: Usamos .from() en vez de .table()
    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id)

    if (!error) {
      setTransacciones(transacciones.filter((t) => t.id !== id))
    } else {
      alert('No se pudo eliminar el gasto.')
    }
  }

  // Función para cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Cálculos matemáticos de la base de datos
  const totalGastos = transacciones
    .filter((t) => t.tipo === 'gasto')
    .reduce((acc, curr) => acc + floatValue(curr.monto), 0)

  const totalIngresos = transacciones
    .filter((t) => t.tipo === 'ingreso')
    .reduce((acc, curr) => acc + floatValue(curr.monto), 0)

  const balance = totalIngresos - totalGastos

  // Agrupar gastos por categoría para el gráfico
  const gastosPorCategoria = transacciones
    .filter((t) => t.tipo === 'gasto')
    .reduce((acc: any, curr) => {
      const cat = curr.categoria || 'Otros'
      acc[cat] = (acc[cat] || 0) + floatValue(curr.monto)
      return acc
    }, {})

  function floatValue(val: any) {
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-lg font-semibold animate-pulse">Sincronizando con Supabase...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      {/* HEADER */}
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-yellow-400">Lucash Dashboard 📊</h1>
          <p className="text-zinc-400 text-sm mt-1">Conectado como {user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-sm font-semibold hover:bg-zinc-900 transition"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* SECCIÓN DE VINCULACIÓN SI NO TIENE TELEGRAM ID */}
      {!telegramId ? (
        <div className="mx-auto max-w-xl mt-16 space-y-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-8 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-yellow-400">Sincronizá tu cuenta 📱</h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Para ver tus gastos en este panel, necesitamos saber cuál es tu ID de Telegram. 
            Podés ver tu ID enviando cualquier mensaje a tu bot en Telegram; verás el número en la terminal donde corre tu código en Python (ej. 6714683558).
          </p>
          <form onSubmit={handleVincular} className="flex gap-3 justify-center max-w-md mx-auto">
            <input
              type="text"
              required
              placeholder="Ingresá tu ID de Telegram"
              value={inputTelegramId}
              onChange={(e) => setInputTelegramId(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-yellow-400 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-500 transition"
            >
              Vincular
            </button>
          </form>
        </div>
      ) : (
        /* CONTENIDO PRINCIPAL DEL DASHBOARD */
        <div className="mx-auto max-w-6xl mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TARJETAS DE MÉTRICAS */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ingresos del Mes</p>
              <p className="text-3xl font-black text-green-400 mt-2">${totalIngresos.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gastos del Mes</p>
              <p className="text-3xl font-black text-red-400 mt-2">${totalGastos.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Balance Neto</p>
              <p className={`text-3xl font-black mt-2 ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                ${balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* HISTORIAL DE TRANSACCIONES */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
            <h3 className="text-lg font-bold text-zinc-300">Historial de Movimientos</h3>
            
            {transacciones.length === 0 ? (
              <p className="text-zinc-500 text-sm py-8 text-center">No registraste ningún movimiento en Telegram todavía.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300 border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-xs">
                      <th className="py-3">Concepto</th>
                      <th className="py-3">Categoría</th>
                      <th className="py-3 text-right">Monto</th>
                      <th className="py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacciones.map((t) => (
                      <tr key={t.id} className="border-b border-zinc-900 hover:bg-zinc-900/10 transition">
                        <td className="py-4 capitalize font-medium">{t.concepto}</td>
                        <td className="py-4 text-xs">
                          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-400">{t.categoria}</span>
                        </td>
                        <td className={`py-4 text-right font-bold ${t.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.tipo === 'ingreso' ? '+' : '-'}${floatValue(t.monto).toLocaleString()}
                        </td>
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleEliminar(t.id)}
                            className="rounded p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DESGLOSE POR CATEGORÍAS (CORREGIDO: gastosPorCategoria) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-6">
            <h3 className="text-lg font-bold text-zinc-300">Gastos por Categoría</h3>

            {Object.keys(gastosPorCategoria).length === 0 ? (
              <p className="text-zinc-500 text-sm py-8 text-center">No hay gastos para clasificar.</p>
            ) : (
              <div className="space-y-5">
                {Object.entries(gastosPorCategoria).map(([cat, totalCat]: [string, any]) => {
                  const porcentaje = totalGastos > 0 ? (totalCat / totalGastos) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                        <span>{cat}</span>
                        <span>${totalCat.toLocaleString()} ({porcentaje.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}