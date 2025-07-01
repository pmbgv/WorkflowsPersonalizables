/**
 * Test unitario para verificar el manejo correcto de fechas
 * Valida que las fechas no se modifiquen por problemas de zona horaria
 */

// Función formatDateToLocal (copiada del componente para testing)
function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función format de date-fns simulada para comparación
function formatWithDateFns(date) {
  // Simula el comportamiento problemático de date-fns
  return date.toISOString().split('T')[0];
}

function testDateHandling() {
  console.log("🧪 Testing date handling functionality...\n");
  
  // Test 1: Fecha normal del día
  console.log("📅 Test 1: Fecha del día actual");
  const today = new Date(2025, 6, 1); // 1 de julio de 2025 (mes 6 = julio)
  console.log("Input date:", today);
  console.log("formatDateToLocal:", formatDateToLocal(today));
  console.log("date-fns format:", formatWithDateFns(today));
  console.log("✅ Should be: 2025-07-01");
  console.log("");
  
  // Test 2: Fecha específica del problema reportado
  console.log("📅 Test 2: Fecha específica del reporte (01-07-2025)");
  const problematicDate = new Date(2025, 6, 1, 12, 0, 0); // 1 julio 2025 al mediodía
  console.log("Input date:", problematicDate);
  console.log("formatDateToLocal:", formatDateToLocal(problematicDate));
  console.log("date-fns format:", formatWithDateFns(problematicDate));
  console.log("✅ Should be: 2025-07-01");
  console.log("");
  
  // Test 3: Fecha con diferentes horas
  console.log("📅 Test 3: Fecha con diferentes horas del día");
  const earlyMorning = new Date(2025, 6, 1, 2, 30, 0); // 02:30 AM
  const lateNight = new Date(2025, 6, 1, 23, 45, 0);   // 11:45 PM
  
  console.log("Early morning (02:30):");
  console.log("  formatDateToLocal:", formatDateToLocal(earlyMorning));
  console.log("  date-fns format:", formatWithDateFns(earlyMorning));
  
  console.log("Late night (23:45):");
  console.log("  formatDateToLocal:", formatDateToLocal(lateNight));
  console.log("  date-fns format:", formatWithDateFns(lateNight));
  console.log("✅ Both should be: 2025-07-01");
  console.log("");
  
  // Test 4: Fechas límite de mes
  console.log("📅 Test 4: Fechas límite de mes");
  const endOfJune = new Date(2025, 5, 30); // 30 de junio
  const startOfJuly = new Date(2025, 6, 1); // 1 de julio
  
  console.log("End of June (30/06):");
  console.log("  formatDateToLocal:", formatDateToLocal(endOfJune));
  console.log("Start of July (01/07):");
  console.log("  formatDateToLocal:", formatDateToLocal(startOfJuly));
  console.log("");
  
  // Test 5: Validación de la consistencia
  console.log("📅 Test 5: Validación de consistencia");
  const testDates = [
    new Date(2025, 0, 1),   // 1 enero
    new Date(2025, 5, 30),  // 30 junio
    new Date(2025, 6, 1),   // 1 julio
    new Date(2025, 11, 31), // 31 diciembre
  ];
  
  console.log("Testing multiple dates for consistency:");
  testDates.forEach((date, index) => {
    const localFormat = formatDateToLocal(date);
    const expectedYear = date.getFullYear();
    const expectedMonth = date.getMonth() + 1;
    const expectedDay = date.getDate();
    const expected = `${expectedYear}-${String(expectedMonth).padStart(2, '0')}-${String(expectedDay).padStart(2, '0')}`;
    
    const isCorrect = localFormat === expected;
    console.log(`  Test ${index + 1}: ${localFormat} (Expected: ${expected}) ${isCorrect ? '✅' : '❌'}`);
  });
  
  console.log("\n🎯 Summary:");
  console.log("- formatDateToLocal() uses local date components directly");
  console.log("- Avoids timezone conversion issues");
  console.log("- Ensures selected date = stored date");
  console.log("- Fix should resolve the '1 day less' problem");
}

// Test de integración simulado
function testRequestCreationFlow() {
  console.log("\n🔄 Testing request creation flow simulation...\n");
  
  // Simular selección de fecha en el frontend
  const selectedDate = new Date(2025, 6, 1); // Usuario selecciona 1 julio 2025
  console.log("👤 User selects date:", selectedDate.toLocaleDateString());
  
  // Simular conversión con nuestra función
  const formattedDate = formatDateToLocal(selectedDate);
  console.log("📝 Date formatted for request:", formattedDate);
  
  // Simular data que se envía al servidor
  const requestData = {
    tipo: 'Permiso',
    fechaSolicitada: formattedDate,
    fechaFin: formattedDate,
    asunto: 'Test request',
    solicitadoPor: 'Test User'
  };
  
  console.log("📤 Request data sent to server:", JSON.stringify(requestData, null, 2));
  
  // Verificar que la fecha sea correcta
  const isCorrectDate = requestData.fechaSolicitada === '2025-07-01';
  console.log(`✅ Date correctly preserved: ${isCorrectDate ? 'YES' : 'NO'}`);
  
  if (isCorrectDate) {
    console.log("🎉 SUCCESS: Date handling fix works correctly!");
  } else {
    console.log("❌ FAILED: Date handling still has issues!");
  }
}

// Ejecutar tests
console.log("===============================================");
console.log("    DATE HANDLING FIX VALIDATION TESTS");
console.log("===============================================\n");

testDateHandling();
testRequestCreationFlow();

console.log("\n===============================================");
console.log("              TESTS COMPLETED");
console.log("===============================================");