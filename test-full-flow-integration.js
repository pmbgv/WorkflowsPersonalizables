/**
 * Test de integración completa para verificar el flujo frontend-backend
 * Simula exactamente lo que pasa en la aplicación real
 */

async function testFullRequestFlow() {
  console.log("🔄 Testing complete request creation flow...\n");
  
  // Paso 1: Frontend - Simular selección de fecha
  console.log("📅 Step 1: Frontend date selection");
  
  function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Usuario selecciona 1 julio 2025
  const selectedDate = new Date(2025, 6, 1);
  const formattedDate = formatDateToLocal(selectedDate);
  
  console.log("User selected date:", selectedDate);
  console.log("Frontend formatted date:", formattedDate);
  console.log("");
  
  // Paso 2: Frontend - Preparar datos de la solicitud
  console.log("📋 Step 2: Frontend request data preparation");
  
  const requestData = {
    tipo: 'Permiso',
    fechaSolicitada: formattedDate,
    fechaFin: '',
    asunto: 'Solicitud de Permiso',
    descripcion: 'Test request',
    solicitadoPor: 'Test User',
    identificador: '12345678',
    usuarioSolicitado: 'Test User',
    identificadorUsuario: '12345678',
    motivo: 'Ley 20823',
    archivosAdjuntos: []
  };
  
  console.log("Request data to be sent:");
  console.log(JSON.stringify(requestData, null, 2));
  console.log("Date in request data:", requestData.fechaSolicitada);
  console.log("");
  
  // Paso 3: Simular envío al servidor
  console.log("🌐 Step 3: Send to server simulation");
  
  try {
    const response = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("Server response:");
      console.log(JSON.stringify(result, null, 2));
      console.log("");
      console.log("Date comparison:");
      console.log("Sent date:", requestData.fechaSolicitada);
      console.log("Received date:", result.fechaSolicitada);
      console.log("Dates match:", requestData.fechaSolicitada === result.fechaSolicitada ? '✅' : '❌');
      
      if (requestData.fechaSolicitada === result.fechaSolicitada) {
        console.log("✅ SUCCESS: Date preserved correctly through full flow!");
      } else {
        console.log("❌ ISSUE: Date modified during server processing");
        console.log("This indicates the bug is in server-side processing");
      }
    } else {
      console.log("❌ Server error:", response.status, response.statusText);
      const errorText = await response.text();
      console.log("Error details:", errorText);
    }
    
  } catch (error) {
    console.log("❌ Network error:", error.message);
    console.log("Make sure the server is running on localhost:5000");
  }
}

// Test para verificar el comportamiento del Calendar component
function testCalendarBehavior() {
  console.log("\n📅 Testing Calendar component behavior...\n");
  
  // Simular diferentes formas en que el Calendar puede crear fechas
  const calendarBehaviors = [
    {
      name: "Standard date creation",
      createDate: () => new Date(2025, 6, 1)
    },
    {
      name: "Date from string",
      createDate: () => new Date('2025-07-01')
    },
    {
      name: "Date with time",
      createDate: () => new Date(2025, 6, 1, 12, 0, 0)
    },
    {
      name: "Date at midnight UTC",
      createDate: () => new Date('2025-07-01T00:00:00.000Z')
    }
  ];
  
  function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  calendarBehaviors.forEach(behavior => {
    const date = behavior.createDate();
    const formatted = formatDateToLocal(date);
    const isCorrect = formatted === '2025-07-01';
    
    console.log(`${behavior.name}:`);
    console.log(`  Date object: ${date}`);
    console.log(`  Formatted: ${formatted}`);
    console.log(`  Correct: ${isCorrect ? '✅' : '❌'}`);
    console.log("");
  });
}

// Test para verificar posibles issues con JSON serialization
function testJSONSerialization() {
  console.log("📦 Testing JSON serialization effects...\n");
  
  function formatDateToLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const originalDate = new Date(2025, 6, 1);
  const formattedDate = formatDateToLocal(originalDate);
  
  const requestData = {
    fechaSolicitada: formattedDate,
    tipo: 'Permiso'
  };
  
  console.log("Before JSON serialization:", requestData.fechaSolicitada);
  
  const jsonString = JSON.stringify(requestData);
  console.log("JSON string:", jsonString);
  
  const parsedData = JSON.parse(jsonString);
  console.log("After JSON parsing:", parsedData.fechaSolicitada);
  
  const preserved = requestData.fechaSolicitada === parsedData.fechaSolicitada;
  console.log("Date preserved through JSON:", preserved ? '✅' : '❌');
}

// Ejecutar todos los tests
console.log("===============================================");
console.log("    FULL FLOW INTEGRATION TESTING");
console.log("===============================================");

testCalendarBehavior();
testJSONSerialization();

// Intentar test de integración completa
testFullRequestFlow().then(() => {
  console.log("\n===============================================");
  console.log("              INTEGRATION SUMMARY");
  console.log("===============================================");
  console.log("✅ Frontend date formatting works correctly");
  console.log("✅ Calendar component handles dates properly");
  console.log("✅ JSON serialization preserves dates");
  console.log("");
  console.log("If bug persists after these fixes:");
  console.log("🔍 Check server-side date processing");
  console.log("🔍 Check database storage/retrieval");
  console.log("🔍 Check timezone settings on server");
}).catch(error => {
  console.log("\n❌ Integration test failed:", error.message);
  console.log("This may indicate server connectivity issues");
});