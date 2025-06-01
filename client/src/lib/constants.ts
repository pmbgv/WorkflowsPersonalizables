// Constantes para categorías de permisos y sus motivos
export const CATEGORIAS_PERMISO = {
  "Comunes": [
    "Licencia Médica Estándar",
    "Otro",
    "P. Administrativo", 
    "P. Fallecimiento",
    "Capacitación",
    "P. Sindical",
    "Reunión",
    "Accidentes",
    "Compensación",
    "Amamantamiento (Fuero)",
    "Permiso con Goce",
    "Permiso sin Goce",
    "Ley 20823"
  ],
  "Turno completo": [
    "Permiso Turno Completo",
    "Licencia Médica Turno Completo",
    "Capacitación Turno Completo"
  ],
  "Parciales": [
    "Permiso Parcial",
    "Licencia Médica Parcial", 
    "Capacitación Parcial"
  ]
};

// Lista plana de todos los motivos para facilitar búsquedas
export const TODOS_LOS_MOTIVOS = Object.values(CATEGORIAS_PERMISO).flat().sort();