#!/usr/bin/env python3
"""
Script para obtener datos de usuarios reales desde la API de GeoVictoria.
Este script se autentica y descarga la lista completa de usuarios.
"""

import requests
import json
import sys
from typing import Dict, List, Optional

class GeoVictoriaAPI:
    def __init__(self):
        self.base_url = "https://customerapi.geovictoria.com/api/v1"
        self.token = None
        self.session = requests.Session()
        
    def authenticate(self, user: str = "e82657", password: str = "46ce142d") -> bool:
        """
        Autentica con la API de GeoVictoria.
        
        Args:
            user: Usuario para autenticación
            password: Contraseña para autenticación
            
        Returns:
            True si la autenticación fue exitosa, False en caso contrario
        """
        login_url = f"{self.base_url}/login"
        login_data = {
            "User": user,
            "Password": password
        }
        
        try:
            print("Autenticando con la API de GeoVictoria...")
            response = self.session.post(login_url, json=login_data)
            response.raise_for_status()
            
            auth_response = response.json()
            self.token = auth_response.get("token")
            
            if self.token:
                print("✓ Autenticación exitosa")
                # Configurar el header de autorización para futuras requests
                self.session.headers.update({
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": "application/json"
                })
                return True
            else:
                print("✗ Error: No se recibió token de autenticación")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Error de autenticación: {e}")
            return False
        except json.JSONDecodeError as e:
            print(f"✗ Error al procesar respuesta de autenticación: {e}")
            return False
    
    def get_users(self) -> Optional[List[Dict]]:
        """
        Obtiene la lista completa de usuarios.
        
        Returns:
            Lista de usuarios o None si hay error
        """
        if not self.token:
            print("✗ Error: No hay token de autenticación")
            return None
            
        users_url = f"{self.base_url}/User/ListComplete"
        
        try:
            print("Obteniendo lista de usuarios...")
            response = self.session.get(users_url)
            response.raise_for_status()
            
            users_data = response.json()
            print(f"✓ Se obtuvieron {len(users_data)} usuarios")
            return users_data
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Error al obtener usuarios: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"✗ Error al procesar respuesta de usuarios: {e}")
            return None

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
    
    # Crear instancia de la API
    api = GeoVictoriaAPI()
    
    # Autenticar
    if not api.authenticate():
        print("Saliendo debido a error de autenticación")
        sys.exit(1)
    
    # Obtener usuarios
    users = api.get_users()
    if not users:
        print("Saliendo debido a error al obtener usuarios")
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