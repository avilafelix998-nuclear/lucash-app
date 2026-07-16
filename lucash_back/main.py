import os
import json
import telebot
import threading # NUEVO: Para correr procesos en paralelo
import time 
from flask import Flask # NUEVO: Para crear el servidor web ligero
from telebot import types
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from supabase import create_client, Client

# 1. Cargar Variables de Entorno
load_dotenv()
TOKEN = os.getenv("TELEGRAM_TOKEN")
G_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([TOKEN, G_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ ERROR: Faltan llaves en tu archivo .env")
    exit()

# 2. Inicializar Clientes
client = genai.Client(api_key=G_KEY)
MODEL_ID = 'gemini-3.1-flash-lite'
bot = telebot.TeleBot(TOKEN)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 🔌 SERVIDOR WEB KEEPALIVE (FLASK)
# ==========================================
# Creamos una mini página web que responde con un mensaje de "vivo".
server = Flask('')

@server.route('/')
def home():
    return "🔋 Lucash Bot está en línea y funcionando 24/7!"

def run_server():
    # Render asigna automáticamente un puerto dinámico en la variable de entorno 'PORT'
    port = int(os.environ.get("PORT", 8080))
    server.run(host='0.0.0.0', port=port)

def keep_alive():
    """Inicia el servidor web en un hilo secundario en segundo plano"""
    t = threading.Thread(target=run_server)
    t.start()
# ==========================================

COMANDOS_INFO = {
    "start": "Iniciar conversación y saludo de Lucash",
    "help": "Ver la lista de comandos disponibles",
    "resumen": "Ver balance y desglose de gastos de este mes",
    "mi_id": "Obtener tu ID de Telegram para vincular la web"
}

def registrar_menu_comandos():
    comandos = [types.BotCommand(cmd, desc) for cmd, desc in COMANDOS_INFO.items()]
    bot.set_my_commands(comandos)
    print("📋 Menú de comandos actualizado en Telegram.")

# COMANDOS: Bienvenida y Ayuda
@bot.message_handler(commands=['start', 'help'])
def send_help(message):
    nombre = message.from_user.first_name
    user_id = message.from_user.id
    
    mensaje = f"👋 ¡Hola {nombre}! Soy Lucash, tu asistente de bolsillo.\n\n"
    mensaje += f"🔑 Tu ID de Telegram es: <code>{user_id}</code> (usaló para vincular la web).\n\n"
    mensaje += "Aquí tienes las herramientas disponibles en mi menú:\n\n"
    for cmd, desc in COMANDOS_INFO.items():
        mensaje += f"🔹 /{cmd} - {desc}\n"
    mensaje += "\n💡 Escríbeme o *mándame una nota de voz* con lo que gastas."
    bot.reply_to(message, mensaje, parse_mode='HTML')

# COMANDO: Resumen mensual
@bot.message_handler(commands=['resumen'])
def enviar_resumen(message):
    user_id = message.from_user.id
    username = message.from_user.first_name
    
    try:
        transacciones = db.obtener_transacciones_mes(user_id)
        if not transacciones:
            bot.reply_to(message, "Aún no registraste ningún gasto este mes. 😉")
            return
            
        total_gastos = 0
        total_ingresos = 0
        gastos_por_categoria = {}
        
        for t in transacciones:
            monto = float(t["monto"])
            tipo = t.get("tipo", "gasto")
            categoria = t.get("categoria", "Otros")
            
            if tipo == "gasto":
                total_gastos += monto
                gastos_por_categoria[categoria] = gastos_por_categoria.get(categoria, 0) + monto
            elif tipo == "ingreso":
                total_ingresos += monto

        mensaje = f"📊 *Resumen de {username} para este mes*\n\n"
        mensaje += f"🔴 *Gastos Totales:* ${total_gastos:,.2f}\n"
        if total_ingresos > 0:
            mensaje += f"🟢 *Ingresos Totales:* ${total_ingresos:,.2f}\n"
            mensaje += f"⚖️ *Balance:* ${(total_ingresos - total_gastos):,.2f}\n"
            
        mensaje += "\n🗂️ *Desglose de gastos por categoría:*\n"
        for cat, subtotal in gastos_por_categoria.items():
            mensaje += f"• *{cat}:* ${subtotal:,.2f}\n"
            
        bot.send_message(message.chat.id, mensaje, parse_mode='Markdown')
    except Exception as e:
        print(f"❌ Error al generar reporte: {e}")
        bot.reply_to(message, "Perdón, tuve un problema al sumar tus números.")

# COMANDO: Obtener ID para vinculación web
@bot.message_handler(commands=['mi_id'])
def enviar_id_usuario(message):
    user_id = message.from_user.id
    mensaje = f"🔑 <b>Tu ID de Sincronización</b>\n\n"
    mensaje += f"Tu ID es: <code>{user_id}</code>\n\n"
    mensaje += "Copia este número (con solo tocarlo se copia) y pegalo en el Dashboard de la web para ver tus gastos."
    bot.reply_to(message, mensaje, parse_mode='HTML')

# MANEJADOR: Eliminar gasto (Botón interactivo)
@bot.callback_query_handler(func=lambda call: call.data.startswith('del_'))
def callback_eliminar_gasto(call):
    transaccion_id = int(call.data.split('_')[1])
    user_id = call.from_user.id
    try:
        db.eliminar_transaccion(transaccion_id, user_id)
        bot.edit_message_text(
            chat_id=call.message.chat.id,
            message_id=call.message.message_id,
            text="🗑️ *Registro eliminado correctamente de tus gastos.*",
            parse_mode='Markdown'
        )
    except Exception as e:
        print(f"❌ Error al eliminar registro: {e}")
        bot.answer_callback_query(call.id, "No se pudo eliminar el gasto.")

# MANEJADOR: Notas de voz (Audio)
@bot.message_handler(content_types=['voice'])
def handle_voice_message(message):
    user_id = message.from_user.id
    username = message.from_user.first_name
    temp_filename = f"voice_{user_id}.ogg"
    
    try:
        bot.send_chat_action(message.chat.id, 'record_audio')
        file_info = bot.get_file(message.voice.file_id)
        downloaded_file = bot.download_file(file_info.file_path)
        
        with open(temp_filename, 'wb') as f:
            f.write(downloaded_file)
            
        bot.send_chat_action(message.chat.id, 'typing')
        datos_json = ai.analizar_audio(temp_filename)
        
        lista_transacciones = datos_json.get("transacciones", [])
        respuesta_usuario = datos_json.get("respuesta_usuario", "¡Entendido!")

        if lista_transacciones:
            for t in lista_transacciones:
                monto = t.get("monto")
                if monto is not None:
                    db.guardar_transaccion(
                        user_id=user_id,
                        monto=monto,
                        concepto=t.get("concepto"),
                        categoria=t.get("categoria"),
                        tipo=t.get("tipo", "gasto")
                    )
            print(f"💾 Guardadas {len(lista_transacciones)} transacciones desde audio.")
        
        bot.reply_to(message, respuesta_usuario)
            
    except Exception as e:
        print(f"❌ Error al procesar audio: {e}")
        bot.reply_to(message, "Perdón, no pude escuchar o entender bien tu audio. ¿Me lo podés escribir por texto?")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            print("🧹 Archivo temporal local eliminado.")

# MANEJADOR: Texto general
@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    user_id = message.from_user.id
    username = message.from_user.first_name
    
    try:
        bot.send_chat_action(message.chat.id, 'typing')
        datos_json = ai.analizar_texto(message.text)
        
        lista_transacciones = datos_json.get("transacciones", [])
        respuesta_usuario = datos_json.get("respuesta_usuario", "¡Entendido!")

        if lista_transacciones:
            for t in lista_transacciones:
                monto = t.get("monto")
                if monto is not None:
                    db.guardar_transaccion(
                        user_id=user_id,
                        monto=monto,
                        concepto=t.get("concepto"),
                        categoria=t.get("categoria"),
                        tipo=t.get("tipo", "gasto")
                    )
            print(f"💾 Guardadas {len(lista_transacciones)} transacciones desde texto.")
        
        bot.reply_to(message, respuesta_usuario)
        
    except Exception as e:
        print(f"❌ Error al procesar: {e}")
        bot.reply_to(message, "Perdón, tuve un problema al anotar eso. ¿Me lo repetís?")

import db
import ai

if __name__ == "__main__":
    # 1. Iniciamos el servidor de Flask en segundo plano
    keep_alive()
    
    # 2. Registramos los comandos del menú
    registrar_menu_comandos()
    
    print("✅ Lucash está en línea con keep-alive activo.")
    
    # 3. Bucle infinito de reconexión automática en caso de caída de Telegram o Internet
    while True:
        try:
            print("🔌 Conectando con los servidores de Telegram...")
            # Iniciamos el polling con un timeout controlado
            bot.polling(non_stop=True, interval=0, timeout=20)
        except Exception as e:
            # Si Telegram da un error 502, 504 o se cae tu internet, el programa no se detiene.
            # Imprime el error, espera 5 segundos y vuelve a intentar conectarse automáticamente.
            print(f"⚠️ Conexión perdida con Telegram: {e}")
            print("🔄 Reintentando conexión automática en 5 segundos...")
            time.sleep(5)