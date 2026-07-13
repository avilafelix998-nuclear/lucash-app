from supabase import create_client, Client
from datetime import datetime
import config

# Inicializamos el cliente una sola vez
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)

def guardar_transaccion(user_id: int, monto: float, concepto: str, categoria: str, tipo: str) -> int:
    """Guarda un registro financiero y devuelve el ID único generado."""
    response = supabase.table("transacciones").insert({
        "user_id": user_id,
        "monto": monto,
        "concepto": concepto if concepto else "Varios",
        "categoria": categoria if categoria else "Otros",
        "tipo": tipo if tipo else "gasto"
    }).execute()
    
    if not response.data:
        raise ValueError("Error al insertar datos en la base de datos.")
    return response.data[0]['id']

def eliminar_transaccion(transaccion_id: int, user_id: int) -> bool:
    """Elimina una transacción asegurando que el usuario sea el propietario."""
    supabase.table("transacciones") \
        .delete() \
        .eq("id", transaccion_id) \
        .eq("user_id", user_id) \
        .execute()
    return True

def obtener_transacciones_mes(user_id: int) -> list:
    """Obtiene las transacciones del usuario del mes en curso."""
    now = datetime.now()
    inicio_mes = datetime(now.year, now.month, 1).isoformat()
    
    response = supabase.table("transacciones") \
        .select("*") \
        .eq("user_id", user_id) \
        .gte("created_at", inicio_mes) \
        .execute()
    return response.data