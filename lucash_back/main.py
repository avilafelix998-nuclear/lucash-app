import os
import telebot
from telebot import types
import config
import db
import ai

bot = telebot.TeleBot(config.TELEGRAM_TOKEN)

# Registro automático de comandos
def registrar_menu_comandos():
    # Ahora lee de forma segura desde config.py porque ya está declarada allí
    comandos = [types.BotCommand(cmd, desc) for cmd, desc in config.COMANDOS_INFO.items()]
    bot.set_my_commands(comandos)
    print("📋 Menú de comandos actualizado en Telegram.")

# handlers de Telegram
@bot.message_handler(commands=['start', 'help'])
def send_help(message):
    nombre = message.from_user.first_name
    user_id = message.from_user.id
    
    mensaje = f"👋 ¡Hola {nombre}! Soy Lucash, tu asistente de bolsillo.\n\n"
    mensaje += f"🔑 Tu ID de Telegram es: <code>{user_id}</code> (usaló para vincular la web).\n\n"
    mensaje += "Aquí tienes las herramientas disponibles en mi menú:\n\n"
    for cmd, desc in config.COMANDOS_INFO.items():
        mensaje += f"🔹 /{cmd} - {desc}\n"
    mensaje += "\n💡 Escríbeme o <b>mándame una nota de voz</b> con lo que gastas."
    bot.reply_to(message, mensaje, parse_mode='HTML')

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


@bot.message_handler(commands=['mi_id'])
def enviar_id_usuario(message):
    user_id = message.from_user.id
    
    mensaje = f"🔑 <b>Tu ID de Sincronización</b>\n\n"
    mensaje += f"Tu ID es: <code>{user_id}</code>\n\n"
    mensaje += "Copia este número (con solo tocarlo se copia) y pegalo en el Dashboard de la web para ver tus gastos."
    
    bot.reply_to(message, mensaje, parse_mode='HTML')

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
        
        # Leemos la lista de transacciones y la respuesta
        lista_transacciones = datos_json.get("transacciones", [])
        respuesta_usuario = datos_json.get("respuesta_usuario", "¡Entendido!")

        # Si hay transacciones extraídas, las guardamos una por una en Supabase
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
            print(f"💾 Guardadas {len(lista_transacciones)} transacciones desde audio exitosamente.")
        
        # Respondemos al usuario con la confirmación de la IA
        bot.reply_to(message, respuesta_usuario)
            
    except Exception as e:
        print(f"❌ Error al procesar audio: {e}")
        bot.reply_to(message, "Perdón, no pude escuchar o entender bien tu audio. ¿Me lo podés escribir por texto?")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            print("🧹 Archivo temporal local eliminado.")


# MODIFICACIÓN EN MANEJADOR DE TEXTO GENERAL
@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    user_id = message.from_user.id
    username = message.from_user.first_name
    
    try:
        bot.send_chat_action(message.chat.id, 'typing')
        datos_json = ai.analizar_texto(message.text)
        
        # Leemos la lista de transacciones y la respuesta
        lista_transacciones = datos_json.get("transacciones", [])
        respuesta_usuario = datos_json.get("respuesta_usuario", "¡Entendido!")

        # Si hay transacciones extraídas, las guardamos una por una en Supabase
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
            print(f"💾 Guardadas {len(lista_transacciones)} transacciones desde texto exitosamente.")
        
        bot.reply_to(message, respuesta_usuario)
        
    except Exception as e:
        print(f"❌ Error al procesar: {e}")
        bot.reply_to(message, "Perdón, tuve un problema al anotar eso. ¿Me lo repetís?")

if __name__ == "__main__":
    registrar_menu_comandos()
    print("✅ Lucash está en línea con arquitectura modular.")
    bot.polling(non_stop=True)