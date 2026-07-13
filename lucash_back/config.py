import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Validación estricta al iniciar
missing_keys = []
if not TELEGRAM_TOKEN: missing_keys.append("TELEGRAM_TOKEN")
if not GEMINI_API_KEY: missing_keys.append("GEMINI_API_KEY")
if not SUPABASE_URL: missing_keys.append("SUPABASE_URL")
if not SUPABASE_KEY: missing_keys.append("SUPABASE_KEY")

if missing_keys:
    raise ValueError(f"❌ ERROR DE CONFIGURACIÓN: Faltan las siguientes llaves en el archivo .env: {', '.join(missing_keys)}")

# ==========================================
# ⚙️ LISTA DE COMANDOS CENTRALIZADA
# ==========================================
COMANDOS_INFO = {
    "start": "Iniciar conversación y saludo de Lucash",
    "help": "Ver la lista de comandos disponibles",
    "resumen": "Ver balance y desglose de gastos de este mes",
    "mi_id": "Obtener tu ID de Telegram para vincular la web"
}