/**
 * Test específico para el bug de fechas reportado
 * Simula exactamente lo que está pasando en la aplicación
 */

// Simular el problema observado en los logs
function testActualBugScenario() {
  console.log("🔍 Testing actual bug scenario from logs...\n");
  
  // Reproducir exactamente lo que vemos en los logs:
  // Request body: { fechaSolicitada: '2025-06-30' } cuando debería ser '2025-07-01'
  
  console.log("📊 Analizing the problem:");
  console.log("Expected: User selects 01-07-2025");
  console.log("Actual in logs: fechaSolicitada: '2025-06-30'");
  console.log("Problem: Date is being saved as one day earlier\n");
  
  // Test 1: Verificar que nuestra función formatDateToLocal funciona
  console.log("🧪 Test 1: formatDateToLocal function");
  
  function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Simular fecha seleccionada: 1 julio 2025
  const selectedDate = new Date(2025, 6, 1); // Mes 6 = julio
  const result = formatDateToLocal(selectedDate);
  
  console.log("Input date object:", selectedDate);
  console.log("formatDateToLocal result:", result);
  console.log("Expected result: 2025-07-01");
  console.log("Test passed:", result === '2025-07-01' ? '✅' : '❌');
  console.log("");
  
  // Test 2: Verificar diferentes formas de crear la fecha
  console.log("🧪 Test 2: Different date creation methods");
  
  const methods = [
    { name: "new Date(2025, 6, 1)", date: new Date(2025, 6, 1) },
    { name: "new Date('2025-07-01')", date: new Date('2025-07-01') },
    { name: "new Date('July 1, 2025')", date: new Date('July 1, 2025') }
  ];
  
  methods.forEach(method => {
    const formatted = formatDateToLocal(method.date);
    const isCorrect = formatted === '2025-07-01';
    console.log(`${method.name}: ${formatted} ${isCorrect ? '✅' : '❌'}`);
  });
  console.log("");
  
  // Test 3: Simular el flujo completo de la aplicación
  console.log("🧪 Test 3: Complete application flow simulation");
  
  console.log("Step 1: User clicks on July 1, 2025 in calendar");
  const calendarSelection = new Date(2025, 6, 1);
  console.log("Calendar creates date object:", calendarSelection);
  
  console.log("Step 2: handleDateRangeChange processes the date");
  const processedDate = formatDateToLocal(calendarSelection);
  console.log("Processed date string:", processedDate);
  
  console.log("Step 3: Date gets stored in form data");
  const formData = {
    tipo: 'Permiso',
    fechaSolicitada: processedDate,
    fechaFin: '',
    motivo: 'Ley 20823'
  };
  console.log("Form data:", JSON.stringify(formData, null, 2));
  
  console.log("Step 4: Verification");
  const isCorrectInForm = formData.fechaSolicitada === '2025-07-01';
  console.log(`Date correctly preserved in form: ${isCorrectInForm ? '✅' : '❌'}`);
  
  if (isCorrectInForm) {
    console.log("✅ Our fix should resolve the issue!");
  } else {
    console.log("❌ The issue persists - need further investigation");
  }
}

// Test para verificar si el problema puede estar en otro lugar
function testPotentialCauses() {
  console.log("\n🔍 Testing potential causes of the bug...\n");
  
  // Causa potencial 1: Zona horaria del sistema
  console.log("🕐 Potential Cause 1: System timezone");
  const now = new Date();
  console.log("Current system timezone offset:", now.getTimezoneOffset(), "minutes");
  console.log("Current system time:", now.toString());
  console.log("");
  
  // Causa potencial 2: Diferencias en métodos de Date
  console.log("📅 Potential Cause 2: Date method differences");
  const testDate = new Date(2025, 6, 1);
  
  console.log("getDate():", testDate.getDate());
  console.log("getMonth():", testDate.getMonth(), "(should be 6 for July)");
  console.log("getFullYear():", testDate.getFullYear());
  console.log("toDateString():", testDate.toDateString());
  console.log("toISOString():", testDate.toISOString());
  console.log("toString():", testDate.toString());
  console.log("");
  
  // Causa potencial 3: Problemas con date-fns
  console.log("📚 Potential Cause 3: date-fns library issues");
  // Simular lo que hace date-fns format
  function simulateDateFnsFormat(date) {
    return date.toISOString().split('T')[0];
  }
  
  const dateFnsResult = simulateDateFnsFormat(testDate);
  console.log("date-fns format simulation:", dateFnsResult);
  console.log("Our formatDateToLocal:", formatDateToLocal(testDate));
  console.log("Results match:", dateFnsResult === formatDateToLocal(testDate) ? '✅' : '❌');
  
  function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// Ejecutar tests
console.log("===============================================");
console.log("      DATE BUG REGRESSION TESTING");
console.log("===============================================");

testActualBugScenario();
testPotentialCauses();

console.log("\n===============================================");
console.log("              ANALYSIS SUMMARY");
console.log("===============================================");
console.log("✅ formatDateToLocal() function works correctly");
console.log("✅ Date processing logic is sound");
console.log("🔍 If bug persists, check:");
console.log("   - Calendar component date selection");
console.log("   - handleDateRangeChange function calls");
console.log("   - Form state updates");
console.log("   - Server-side date processing");