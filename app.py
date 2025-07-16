#!/usr/bin/env python3
"""
Script para obtener datos de usuarios reales desde la API de GeoVictoria.
Este script usa el token de autorización configurado y extrae solo los campos necesarios.
"""

import requests
import json
import sys
import os
import datetime
import logging
from typing import Dict, List, Optional

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Cache para usuarios
users_cache = {
    'data': None,
    'timestamp': None
}

def is_cache_valid(cache: Dict, max_age_minutes: int = 30) -> bool:
    """
    Verifica si el cache es válido basado en su edad.
    
    Args:
        cache: Diccionario de cache
        max_age_minutes: Edad máxima en minutos
        
    Returns:
        True si el cache es válido, False en caso contrario
    """
    if cache['data'] is None or cache['timestamp'] is None:
        return False
    
    age_seconds = datetime.datetime.now().timestamp() - cache['timestamp']
    max_age_seconds = max_age_minutes * 60
    
    return age_seconds < max_age_seconds

def fetch_users() -> List[Dict]:
    """
    Obtiene usuarios de la API con sistema de caché.
    
    Returns:
        Lista de usuarios procesados
    """
    # Verificar si el cache es válido
    if is_cache_valid(users_cache):
        logging.info("Usando datos de usuarios desde cache")
        return users_cache['data']

    logging.info("Obteniendo usuarios desde la API")
    url = "https://customerapi.geovictoria.com/api/v1/User/ListComplete"
    
    # Obtener el token desde las variables de entorno
    auth_header = os.environ.get("AUTHORIZATION_HEADER")
    if not auth_header:
        logging.error("AUTHORIZATION_HEADER no encontrado en variables de entorno")
        return []
    
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, headers=headers)
        response.raise_for_status()  # Lanza excepción para códigos de error
        data = response.json()

        # Extraer solo los campos necesarios
        users = []
        for user in data:
            if user.get("Enabled") == "1":  # Solo incluir usuarios activos
                users.append({
                    "id": user.get("Id", ""),
                    "employee_id": user.get("Identifier", ""),
                    "name": f"{user.get('Name', '')} {user.get('LastName', '')}".strip(),
                    "group_name": user.get("GroupDescription", ""),
                    "position_name": user.get("PositionDescription", "")
                })

        # Guardar en cache
        users_cache['data'] = users
        users_cache['timestamp'] = datetime.datetime.now().timestamp()

        logging.info(f"✓ Se obtuvieron {len(users)} usuarios activos")
        return users
        
    except Exception as e:
        logging.error(f"Error al obtener usuarios: {str(e)}")
        # Retornar datos de cache si están disponibles, aunque hayan expirado
        if users_cache['data'] is not None:
            logging.info("Retornando usuarios desde cache debido a error de API")
            return users_cache['data']
        # Retornar lista vacía como fallback
        return []

def save_users_to_file(users: List[Dict], filename: str = "usuarios.json") -> bool:
    """
    Guarda los datos de usuarios en un archivo JSON.
    
    Args:
        users: Lista de usuarios
        filename: Nombre del archivo donde guardar
        
    Returns:
        True si se guardó exitosamente, False en caso contrario
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(users, f, indent=2, ensure_ascii=False)
        print(f"✓ Datos guardados en {filename}")
        return True
    except Exception as e:
        print(f"✗ Error al guardar archivo: {e}")
        return False

def print_user_summary(users: List[Dict]) -> None:
    """
    Muestra un resumen de los usuarios obtenidos.
    
    Args:
        users: Lista de usuarios
    """
    print("\n" + "="*50)
    print("RESUMEN DE USUARIOS OBTENIDOS")
    print("="*50)
    
    if not users:
        print("No se encontraron usuarios")
        return
    
    print(f"Total de usuarios: {len(users)}")
    print("\nPrimeros 5 usuarios:")
    
    for i, user in enumerate(users[:5]):
        print(f"\n{i+1}. Usuario:")
        # Mostrar campos más relevantes si existen
        for key, value in user.items():
            if key.lower() in ['id', 'name', 'nombre', 'email', 'usuario', 'identificador']:
                print(f"   {key}: {value}")
    
    # Mostrar estructura de campos disponibles
    if users:
        print(f"\nCampos disponibles en cada usuario:")
        for key in users[0].keys():
            print(f"   - {key}")

def main():
    """Función principal del script."""
    print("Script para obtener usuarios de GeoVictoria API")
    print("="*50)
    
    # Obtener usuarios usando la función optimizada
    users = fetch_users()
    
    if not users:
        print("No se pudieron obtener usuarios")
        sys.exit(1)
    
    # Mostrar resumen
    print_user_summary(users)
    
    # Guardar en archivo
    if save_users_to_file(users):
        print(f"\n✓ Proceso completado exitosamente")
        print(f"Los datos están disponibles en 'usuarios.json'")
    else:
        print("\n✗ Error al guardar los datos")
        sys.exit(1)

if __name__ == "__main__":
    main()