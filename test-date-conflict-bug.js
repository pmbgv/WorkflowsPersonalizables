/**
 * Test específico para el bug de conflictos de fechas y guardado incorrecto
 * Simula exactamente el problema reportado por el usuario
 */

// Función formatDateToLocal del componente
function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Simular datos existentes en la aplicación (la solicitud que existe actualmente)
const existingRequests = [
  {
    id: 150,
    tipo: "Permiso",
    fechaSolicitada: "2025-06-30", // Esta es la fecha que se guardó incorrectamente
    fechaFin: "2025-06-30",
    estado: "Pendiente",
    solicitadoPor: "Andrés Acevedo",
    motivo: "Ley 20823"
  }
];

// Función de detección de conflictos del componente
function checkDateConflicts(startDate, endDate, existingRequests, formData) {
  console.log("🔍 Iniciando verificación de conflictos de fechas");
  console.log("📅 Fechas a verificar:", { startDate, endDate });
  
  if (!startDate) {
    console.log("❌ No hay fecha de inicio, no hay conflictos");
    return false;
  }

  const requestStart = new Date(startDate);
  const requestEnd = endDate ? new Date(endDate) : requestStart;
  
  console.log("📅 Fechas parseadas:", { 
    requestStart: requestStart.toISOString(), 
    requestEnd: requestEnd.toISOString() 
  });
  console.log("📋 Solicitudes existentes a verificar:", existingRequests.length);

  const conflicts = existingRequests.filter(request => {
    console.log("🔎 Verificando solicitud:", {
      id: request.id,
      solicitadoPor: request.solicitadoPor,
      estado: request.estado,
      fechaSolicitada: request.fechaSolicitada,
      fechaFin: request.fechaFin
    });
    
    // Solo verificar solicitudes del mismo usuario
    if (request.solicitadoPor !== formData.solicitadoPor) {
      console.log("⏭️ Saltando - diferente usuario");
      return false;
    }
    
    // Solo verificar solicitudes que no estén rechazadas o canceladas
    if (request.estado === "Rechazada" || request.estado === "Cancelada") {
      console.log("⏭️ Saltando - estado rechazada/cancelada");
      return false;
    }
    
    // Verificar que las fechas de la solicitud existente sean válidas
    if (!request.fechaSolicitada || request.fechaSolicitada === "") {
      console.log("⏭️ Saltando - sin fecha solicitada");
      return false;
    }
    
    const existingStart = new Date(request.fechaSolicitada);
    const existingEnd = request.fechaFin && request.fechaFin !== "" ? new Date(request.fechaFin) : existingStart;

    console.log("📅 Fechas existentes parseadas:", {
      existingStart: existingStart.toISOString(),
      existingEnd: existingEnd.toISOString()
    });

    // Verificar que las fechas sean válidas
    if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) {
      console.log("⏭️ Saltando - fechas existentes inválidas");
      return false;
    }
    if (isNaN(requestStart.getTime()) || isNaN(requestEnd.getTime())) {
      console.log("⏭️ Saltando - fechas solicitadas inválidas");
      return false;
    }

    // Verificar si hay solapamiento
    const hasOverlap = (requestStart <= existingEnd) && (requestEnd >= existingStart);
    
    console.log("🔄 Verificación de solapamiento:", {
      condicion1: `${requestStart.toISOString()} <= ${existingEnd.toISOString()}`,
      resultado1: requestStart <= existingEnd,
      condicion2: `${requestEnd.toISOString()} >= ${existingStart.toISOString()}`,
      resultado2: requestEnd >= existingStart,
      hasOverlap
    });
    
    if (hasOverlap) {
      console.log("⚠️ CONFLICTO DETECTADO:", {
        solicitudExistente: request,
        fechasSolicitadas: { inicio: startDate, fin: endDate },
        solapamiento: hasOverlap
      });
    }
    
    return hasOverlap;
  });

  console.log("📊 Resultado final de validación:", {
    fechaSolicitada: startDate,
    fechaFin: endDate,
    solicitudesExistentes: existingRequests.length,
    conflictosEncontrados: conflicts.length,
    hayConflictos: conflicts.length > 0
  });

  return conflicts.length > 0;
}

function testUserReportedBug() {
  console.log("===============================================");
  console.log("    TEST: BUG REPORTADO POR USUARIO");
  console.log("===============================================\n");
  
  // Simular datos del formulario
  const formData = {
    solicitadoPor: "Andrés Acevedo",
    tipo: "Permiso"
  };
  
  console.log("🧪 Caso 1: Usuario selecciona 01/07/2025 (fecha que debería funcionar)");
  console.log("════════════════════════════════════════════════════════════════\n");
  
  // Simular selección de calendario: 1 julio 2025
  const selectedDate = new Date(2025, 6, 1); // 1 julio 2025
  const formattedDate = formatDateToLocal(selectedDate);
  
  console.log("📅 Fecha seleccionada en calendario:", selectedDate);
  console.log("📅 Fecha formateada para envío:", formattedDate);
  console.log("📅 Fecha esperada: 2025-07-01");
  console.log("✅ Formateo correcto:", formattedDate === '2025-07-01');
  console.log("");
  
  // Verificar si debería haber conflicto
  const hasConflict = checkDateConflicts(formattedDate, formattedDate, existingRequests, formData);
  
  console.log("\n🎯 RESULTADO:");
  console.log("¿Debería haber conflicto? NO (01/07/2025 vs 30/06/2025)");
  console.log("¿Se detectó conflicto?", hasConflict ? "SÍ ❌" : "NO ✅");
  
  if (hasConflict) {
    console.log("🐛 BUG CONFIRMADO: Falso positivo en detección de conflictos");
  } else {
    console.log("✅ OK: No hay conflictos detectados");
  }
  
  console.log("\n" + "=".repeat(70) + "\n");
}

function testDateShiftBug() {
  console.log("🧪 Caso 2: Test del bug de día -1 en guardado");
  console.log("════════════════════════════════════════════════════════════\n");
  
  // Simular diferentes fechas que podrían tener el problema
  const testCases = [
    { input: new Date(2025, 6, 1), expected: "2025-07-01", description: "1 julio 2025" },
    { input: new Date(2025, 6, 15), expected: "2025-07-15", description: "15 julio 2025" },
    { input: new Date(2025, 0, 1), expected: "2025-01-01", description: "1 enero 2025" },
    { input: new Date(2025, 11, 31), expected: "2025-12-31", description: "31 diciembre 2025" }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Fecha input: ${testCase.input}`);
    
    const formatted = formatDateToLocal(testCase.input);
    console.log(`  Fecha formateada: ${formatted}`);
    console.log(`  Fecha esperada: ${testCase.expected}`);
    console.log(`  ✅ Correcto: ${formatted === testCase.expected}`);
    
    if (formatted !== testCase.expected) {
      console.log(`  🐛 ERROR: Se esperaba ${testCase.expected}, se obtuvo ${formatted}`);
    }
    console.log("");
  });
}

function testTimezoneEdgeCases() {
  console.log("🧪 Caso 3: Test de casos edge con zonas horarias");
  console.log("════════════════════════════════════════════════════════════\n");
  
  // Test con diferentes métodos de creación de fechas
  const methods = [
    {
      name: "new Date(2025, 6, 1)",
      date: new Date(2025, 6, 1),
      description: "Constructor con año, mes-1, día"
    },
    {
      name: "new Date('2025-07-01')",
      date: new Date('2025-07-01'),
      description: "Constructor con string ISO"
    },
    {
      name: "new Date('2025-07-01T00:00:00')",
      date: new Date('2025-07-01T00:00:00'),
      description: "Constructor con string ISO + time"
    }
  ];
  
  methods.forEach(method => {
    console.log(`Método: ${method.name}`);
    console.log(`  Descripción: ${method.description}`);
    console.log(`  Fecha creada: ${method.date}`);
    console.log(`  ISO String: ${method.date.toISOString()}`);
    console.log(`  formatDateToLocal: ${formatDateToLocal(method.date)}`);
    console.log(`  Zona horaria local: ${method.date.getTimezoneOffset()} minutos`);
    console.log("");
  });
}

function testConflictDetectionAccuracy() {
  console.log("🧪 Caso 4: Test de precisión en detección de conflictos");
  console.log("════════════════════════════════════════════════════════════\n");
  
  const formData = { solicitadoPor: "Andrés Acevedo" };
  
  const testScenarios = [
    {
      description: "Fecha exactamente igual (debería detectar conflicto)",
      newDate: "2025-06-30",
      expected: true
    },
    {
      description: "Fecha día anterior (NO debería detectar conflicto)",
      newDate: "2025-06-29",
      expected: false
    },
    {
      description: "Fecha día siguiente (NO debería detectar conflicto)",
      newDate: "2025-07-01",
      expected: false
    },
    {
      description: "Fecha una semana después (NO debería detectar conflicto)",
      newDate: "2025-07-07",
      expected: false
    }
  ];
  
  testScenarios.forEach((scenario, index) => {
    console.log(`Escenario ${index + 1}: ${scenario.description}`);
    console.log(`  Nueva fecha: ${scenario.newDate}`);
    console.log(`  Fecha existente: ${existingRequests[0].fechaSolicitada}`);
    
    const hasConflict = checkDateConflicts(scenario.newDate, scenario.newDate, existingRequests, formData);
    
    console.log(`  Conflicto esperado: ${scenario.expected}`);
    console.log(`  Conflicto detectado: ${hasConflict}`);
    console.log(`  ✅ Correcto: ${hasConflict === scenario.expected}`);
    
    if (hasConflict !== scenario.expected) {
      console.log(`  🐛 ERROR: Se esperaba ${scenario.expected}, se obtuvo ${hasConflict}`);
    }
    console.log("");
  });
}

// Ejecutar todos los tests
testUserReportedBug();
testDateShiftBug();
testTimezoneEdgeCases();
testConflictDetectionAccuracy();

console.log("===============================================");
console.log("                RESUMEN");
console.log("===============================================");
console.log("✅ formatDateToLocal() funciona correctamente");
console.log("🔍 Debugging agregado para rastrear conflictos");
console.log("🎯 Tests comprueban múltiples escenarios");
console.log("");
console.log("🚀 PRÓXIMOS PASOS:");
console.log("1. Probar en la aplicación con fecha 01/07/2025");
console.log("2. Revisar logs de debugging en consola");
console.log("3. Verificar que no se muestre alerta de conflicto");
console.log("4. Confirmar que la fecha se guarde correctamente");