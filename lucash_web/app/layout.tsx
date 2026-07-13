import './globals.css' // Importa los estilos que acabamos de crear

export const metadata = {
  title: 'Lucash - Tu plata, ordenada',
  description: 'Asistente financiero personal conectado con Telegram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  )
}