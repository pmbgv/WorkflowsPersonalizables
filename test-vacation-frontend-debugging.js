/**
 * Frontend debugging test to identify exact vacation balance display issue
 * Tests user selection and vacation balance calculation behavior
 */

const BASE_URL = "http://localhost:5000";

async function testVacationFrontendDebugging() {
  console.log("🔧 DEBUGGING: Vacation Frontend Balance Display Issues");
  console.log("=".repeat(70));

  try {
    // Test all users with vacation balances
    const testUsers = [
      { id: "39qFD70cpmr7PLP3BzE0FA", name: "Renato Rivera", expectedBalance: 30 },
      { id: "164640310", name: "Tito Rivera", expectedBalance: 25 },
      { id: "262698211", name: "Marilia Copia", expectedBalance: 20 },
      { id: "20836784", name: "Prueba GC", expectedBalance: 15 }
    ];

    console.log("\n1. 🔍 Verificando balances en backend...");
    for (const user of testUsers) {
      const balanceResponse = await fetch(`${BASE_URL}/api/vacation-balance/${user.id}`);
      if (balanceResponse.ok) {
        const balance = await balanceResponse.json();
        console.log(`✅ ${user.name} (${user.id}): ${balance.diasDisponibles} días disponibles`);
      } else {
        console.log(`❌ ${user.name} (${user.id}): Error ${balanceResponse.status}`);
      }
    }

    // Test scenario: Admin creates vacation request for Renato Rivera (the problematic case)
    console.log("\n2. 🧪 Simulando frontend workflow para Renato Rivera...");
    
    const admin = testUsers.find(u => u.id === "164640310"); // Tito Rivera (admin)
    const targetUser = testUsers.find(u => u.id === "39qFD70cpmr7PLP3BzE0FA"); // Renato Rivera
    
    console.log(`👤 Admin creando solicitud: ${admin.name} (${admin.id})`);
    console.log(`🎯 Para usuario: ${targetUser.name} (${targetUser.id})`);

    // Step 1: Check backend balance directly
    console.log("\n   📊 Paso 1: Verificar saldo en backend");
    const directBalanceCheck = await fetch(`${BASE_URL}/api/vacation-balance/${targetUser.id}`);
    if (directBalanceCheck.ok) {
      const directBalance = await directBalanceCheck.json();
      console.log(`   ✅ Backend directo: ${directBalance.diasDisponibles} días para ${targetUser.name}`);
    } else {
      console.log(`   ❌ Backend directo: Error ${directBalanceCheck.status}`);
      return;
    }

    // Step 2: Test the exact query structure the frontend should use
    console.log("\n   📋 Paso 2: Simulando estructura de query del frontend");
    
    // This mimics what the frontend form should do when:
    // - Admin (164640310) is the requester (identificador)
    // - Renato Rivera (39qFD70cpmr7PLP3BzE0FA) is the target (identificadorUsuario)
    const formDataSimulation = {
      identificador: admin.id,           // quien solicita (admin)
      identificadorUsuario: targetUser.id, // para quien es la solicitud (Renato)
      tipo: "Vacaciones"
    };

    console.log(`   📝 Datos del formulario simulado:`);
    console.log(`     - identificador (quien solicita): ${formDataSimulation.identificador}`);
    console.log(`     - identificadorUsuario (para quien): ${formDataSimulation.identificadorUsuario}`);
    console.log(`     - tipo: ${formDataSimulation.tipo}`);

    // Step 3: Test the vacation balance query with correct parameters
    console.log("\n   🔍 Paso 3: Query de saldo con parámetros del formulario");
    
    // The frontend should use: formData.identificadorUsuario || formData.identificador
    const queryUserId = formDataSimulation.identificadorUsuario || formDataSimulation.identificador;
    console.log(`   🎯 ID a usar para query: ${queryUserId} (should be ${targetUser.id})`);
    
    const vacationBalanceQuery = await fetch(`${BASE_URL}/api/vacation-balance/${queryUserId}`);
    if (vacationBalanceQuery.ok) {
      const balance = await vacationBalanceQuery.json();
      console.log(`   ✅ Query balance result: ${balance.diasDisponibles} días`);
      
      if (balance.diasDisponibles === targetUser.expectedBalance) {
        console.log(`   ✅ CORRECTO: El saldo coincide con lo esperado`);
      } else {
        console.log(`   ❌ ERROR: Esperado ${targetUser.expectedBalance}, obtenido ${balance.diasDisponibles}`);
      }
    } else {
      console.log(`   ❌ Query balance error: ${vacationBalanceQuery.status}`);
    }

    // Step 4: Test edge case - what if identificadorUsuario is empty?
    console.log("\n   🧪 Paso 4: Test caso límite - identificadorUsuario vacío");
    
    const edgeCaseForm = {
      identificador: admin.id,
      identificadorUsuario: "", // Empty - should fall back to identificador
      tipo: "Vacaciones"
    };
    
    const fallbackQueryId = edgeCaseForm.identificadorUsuario || edgeCaseForm.identificador;
    console.log(`   📋 Fallback ID: ${fallbackQueryId} (should be ${admin.id})`);
    
    const fallbackQuery = await fetch(`${BASE_URL}/api/vacation-balance/${fallbackQueryId}`);
    if (fallbackQuery.ok) {
      const fallbackBalance = await fallbackQuery.json();
      console.log(`   ✅ Fallback balance: ${fallbackBalance.diasDisponibles} días para admin`);
    } else {
      console.log(`   ❌ Fallback query error: ${fallbackQuery.status}`);
    }

    // Step 5: Test what happens when users are selected dynamically
    console.log("\n3. 🎮 Simulando cambios dinámicos de usuario...");
    
    for (const testUser of testUsers.slice(0, 2)) { // Test first 2 users
      console.log(`\n   👤 Cambiando a usuario: ${testUser.name} (${testUser.id})`);
      
      const dynamicFormData = {
        identificador: admin.id,
        identificadorUsuario: testUser.id,
        tipo: "Vacaciones"
      };
      
      const dynamicQueryId = dynamicFormData.identificadorUsuario || dynamicFormData.identificador;
      const dynamicBalance = await fetch(`${BASE_URL}/api/vacation-balance/${dynamicQueryId}`);
      
      if (dynamicBalance.ok) {
        const balance = await dynamicBalance.json();
        console.log(`   💰 Saldo dinámico: ${balance.diasDisponibles} días`);
        console.log(`   🎯 Query ID usado: ${dynamicQueryId}`);
        console.log(`   ✅ Match esperado: ${balance.diasDisponibles === testUser.expectedBalance ? 'SI' : 'NO'}`);
      } else {
        console.log(`   ❌ Error en query dinámico: ${dynamicBalance.status}`);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎯 ANÁLISIS DE RESULTADOS");
    console.log("=".repeat(70));
    
    console.log("📋 FRONTEND DEBE HACER:");
    console.log("   1. Al seleccionar 'Vacaciones' como tipo");
    console.log("   2. Al cambiar el usuario objetivo (identificadorUsuario)");
    console.log("   3. Usar: identificadorUsuario || identificador para query balance");
    console.log("   4. Mostrar balance.diasDisponibles en campo 'Días disponibles'");
    console.log("   5. Invalidar cache y refetch cuando cambia identificadorUsuario");
    
    console.log("\n🔧 POSIBLES CAUSAS DEL PROBLEMA:");
    console.log("   - Query key no se actualiza correctamente cuando cambia identificadorUsuario");
    console.log("   - useEffect dependencies no incluyen todas las variables necesarias");
    console.log("   - vacationCalculation.diasDisponibles no se actualiza con el balance");
    console.log("   - Cache de React Query no se invalida al cambiar usuario");

    console.log("\n💡 SOLUCIONES A VERIFICAR:");
    console.log("   1. Logs de console en frontend al cambiar usuario");
    console.log("   2. React Query DevTools para ver cache invalidation");
    console.log("   3. Verificar que query se ejecuta con ID correcto");
    console.log("   4. Confirmar que vacationCalculation se actualiza");

  } catch (error) {
    console.error("❌ Error en debugging:", error);
  }
}

// Ejecutar el test
testVacationFrontendDebugging();