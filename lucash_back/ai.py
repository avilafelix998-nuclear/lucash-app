import json
from google import genai
from google.genai import types as genai_types
import config

client = genai.Client(api_key=config.GEMINI_API_KEY)
MODEL_ID = 'gemini-3.1-flash-lite'

SYSTEM_PROMPT = """
Eres Lucash, un asistente financiero experto y preciso.
Tu objetivo es analizar los mensajes (texto o audio) del usuario, extraer TODOS los movimientos financieros mencionados y estructurarlos.

Debes responder ÚNICAMENTE con un objeto JSON válido con las siguientes llaves:
- "transacciones": (lista/array) Si el usuario menciona gastos o ingresos, debes crear un objeto por cada movimiento dentro de esta lista. Si no menciona transacciones, pon una lista vacía [].
  Cada objeto de la lista debe contener:
    * "monto": (número) El valor numérico de la transacción.
    * "concepto": (texto) Breve descripción (ej: "pizza", "uber", "sueldo").
    * "categoria": (texto) Clasifica estrictamente en una de estas categorías exactas:
      "Vivienda", "Servicios", "Suscripciones", "Supermercado", "Salidas", "Transporte", "Entretenimiento", "Compras", "Salud", "Educación", "Otros" o "Ingresos" (para sueldos, cobros, transferencias recibidas).
    * "tipo": (texto) Debe ser "gasto" o "ingreso".
- "respuesta_usuario": (texto) Tu respuesta amigable en español latino para el usuario de Telegram.
  Si detectas gastos o ingresos, confírmale al usuario con un resumen claro y simpático de todo lo que anotaste con emojis.
  Si el usuario te saluda o habla de otra cosa, responde de forma natural.
"""

def analizar_texto(texto: str) -> dict:
    """Envía el texto del usuario a Gemini y devuelve el diccionario estructurado."""
    full_prompt = f"{SYSTEM_PROMPT}\nUsuario: {texto}"
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=genai_types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)

def analizar_audio(ruta_audio_local: str) -> dict:
    """Sube el audio local a Gemini, lo procesa y asegura su eliminación en la nube."""
    uploaded_file = None
    try:
        uploaded_file = client.files.upload(file=ruta_audio_local)
        prompt = f"{SYSTEM_PROMPT}\nUsuario envió un mensaje de voz. Analízalo y genera el JSON."
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[uploaded_file, prompt],
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    finally:
        # Garantizar que el archivo se borre de los servidores de Google siempre
        if uploaded_file:
            try:
                client.files.delete(name=uploaded_file.name)
                print("🧹 Archivo temporal borrado de la nube de Gemini.")
            except Exception as e:
                print(f"⚠️ Error limpiando archivo de la nube: {e}")