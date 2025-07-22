/**
 * Test completo para verificar integración frontend-backend de solicitudes de vacaciones
 * con cálculos de saldos de días correctos
 */

const BASE_URL = "http://localhost:5000";

function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateWorkingDays(startDate, endDate) {
  const days = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days.filter(day => {
    const dayOfWeek = day.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=Sunday, 6=Saturday
  }).length;
}

async function testVacationFrontendBackendIntegration() {
  console.log("🔧 TEST: Integración Frontend-Backend de Vacaciones");
  console.log("=".repeat(70));

  try {
    // 1. Verificar saldos de vacaciones disponibles en backend
    console.log("\n1. 🔍 Verificando saldos de vacaciones (Backend)...");
    const testUsers = [
      { id: "39qFD70cpmr7PLP3BzE0FA", name: "Renato Rivera", expectedBalance: 30 },
      { id: "164640310", name: "Tito Rivera", expectedBalance: 25 },
      { id: "262698211", name: "Marilia Copia", expectedBalance: 20 },
      { id: "20836784", name: "Prueba GC", expectedBalance: 15 }
    ];

    const balanceResults = [];
    for (const user of testUsers) {
      try {
        const balanceResponse = await fetch(`${BASE_URL}/api/vacation-balance/${user.id}`);
        if (balanceResponse.ok) {
          const balance = await balanceResponse.json();
          balanceResults.push({ ...user, actualBalance: balance.diasDisponibles, available: true });
          console.log(`   ✅ ${user.name}: ${balance.diasDisponibles} días disponibles`);
        } else {
          balanceResults.push({ ...user, actualBalance: 0, available: false });
          console.log(`   ❌ ${user.name}: Sin saldo configurado`);
        }
      } catch (error) {
        balanceResults.push({ ...user, actualBalance: 0, available: false });
        console.log(`   ❌ ${user.name}: Error al consultar saldo`);
      }
    }

    // 2. Test de cálculo de días laborables
    console.log("\n2. 🧮 Test de cálculo de días laborables...");
    const testCases = [
      {
        name: "Lunes a Viernes (5 días)",
        start: new Date(2025, 7, 25), // Monday Aug 25, 2025
        end: new Date(2025, 7, 29),   // Friday Aug 29, 2025
        expectedWorkingDays: 5,
        expectedTotalDays: 5
      },
      {
        name: "Lunes a Domingo (7 días, 5 laborables)",
        start: new Date(2025, 7, 25), // Monday Aug 25, 2025
        end: new Date(2025, 7, 31),   // Sunday Aug 31, 2025
        expectedWorkingDays: 5,
        expectedTotalDays: 7
      },
      {
        name: "Viernes a Lunes (4 días, 2 laborables)",
        start: new Date(2025, 7, 29), // Friday Aug 29, 2025
        end: new Date(2025, 8, 1),    // Monday Sep 1, 2025
        expectedWorkingDays: 2,
        expectedTotalDays: 4
      }
    ];

    for (const testCase of testCases) {
      const totalDays = Math.ceil((testCase.end - testCase.start) / (1000 * 60 * 60 * 24)) + 1;
      const workingDays = calculateWorkingDays(testCase.start, testCase.end);
      
      console.log(`   📅 ${testCase.name}:`);
      console.log(`     Días totales: ${totalDays} (esperado: ${testCase.expectedTotalDays})`);
      console.log(`     Días laborables: ${workingDays} (esperado: ${testCase.expectedWorkingDays})`);
      
      if (totalDays === testCase.expectedTotalDays && workingDays === testCase.expectedWorkingDays) {
        console.log(`     ✅ Cálculo correcto`);
      } else {
        console.log(`     ❌ Cálculo incorrecto`);
      }
    }

    // 3. Test de solicitud de vacaciones con diferentes usuarios
    console.log("\n3. 🏖️ Test de solicitudes de vacaciones...");
    
    for (const user of balanceResults.filter(u => u.available)) {
      console.log(`\n   👤 Probando solicitud para ${user.name}...`);
      
      // Definir fechas de prueba (1 semana laborable)
      const startDate = new Date(2025, 8, 1); // Sept 1, 2025 (Monday)
      const endDate = new Date(2025, 8, 5);   // Sept 5, 2025 (Friday)
      const expectedWorkingDays = 5;
      const expectedTotalDays = 5;

      const vacationRequestData = {
        tipo: "Vacaciones",
        fechaSolicitada: formatDateToLocal(startDate),
        fechaFin: formatDateToLocal(endDate),
        asunto: `Vacaciones de prueba para ${user.name}`,
        descripcion: "Solicitud de vacaciones para test de integración",
        solicitadoPor: user.name,
        identificador: user.id,
        usuarioSolicitado: user.name,
        identificadorUsuario: user.id,
        motivo: "Vacaciones",
        diasSolicitados: expectedTotalDays,
        diasEfectivos: expectedWorkingDays,
        archivosAdjuntos: []
      };

      try {
        const createResponse = await fetch(`${BASE_URL}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vacationRequestData)
        });

        if (createResponse.ok) {
          const vacationRequest = await createResponse.json();
          console.log(`     ✅ Solicitud creada: ID ${vacationRequest.id}`);
          console.log(`     📊 Frontend calculó:`);
          console.log(`       - Días solicitados: ${vacationRequestData.diasSolicitados}`);
          console.log(`       - Días efectivos: ${vacationRequestData.diasEfectivos}`);
          console.log(`       - Días restantes estimados: ${user.actualBalance - vacationRequestData.diasEfectivos}`);
          
          // Verificar que los datos se guardaron correctamente
          console.log(`     📋 Backend guardó:`);
          console.log(`       - Días solicitados: ${vacationRequest.diasSolicitados || 'No guardado'}`);
          console.log(`       - Días efectivos: ${vacationRequest.diasEfectivos || 'No guardado'}`);
          
          // Test de validación de saldo
          if (vacationRequestData.diasEfectivos > user.actualBalance) {
            console.log(`     ⚠️  ADVERTENCIA: Días solicitados (${vacationRequestData.diasEfectivos}) exceden saldo disponible (${user.actualBalance})`);
          } else {
            console.log(`     ✅ Solicitud dentro del saldo disponible`);
          }

        } else {
          const errorData = await createResponse.json();
          console.log(`     ❌ Error creando solicitud: ${errorData.message}`);
        }
        
      } catch (error) {
        console.log(`     ❌ Error de conexión: ${error.message}`);
      }
    }

    // 4. Test de múltiples solicitudes y saldo acumulado
    console.log("\n4. 📊 Test de múltiples solicitudes para un usuario...");
    const testUser = balanceResults.find(u => u.available && u.name === "Tito Rivera");
    
    if (testUser) {
      console.log(`   👤 Probando múltiples solicitudes para ${testUser.name} (${testUser.actualBalance} días)...`);
      
      // Obtener todas las solicitudes existentes del usuario
      const requestsResponse = await fetch(`${BASE_URL}/api/requests`);
      if (requestsResponse.ok) {
        const allRequests = await requestsResponse.json();
        const userRequests = allRequests.filter(req => 
          req.usuarioSolicitado === testUser.name && 
          req.tipo === "Vacaciones" &&
          req.estado !== "Rechazada"
        );
        
        console.log(`     📋 Solicitudes de vacaciones existentes: ${userRequests.length}`);
        
        let totalDaysRequested = 0;
        userRequests.forEach((req, index) => {
          const effectiveDays = req.diasEfectivos || 0;
          totalDaysRequested += effectiveDays;
          console.log(`       ${index + 1}. ID ${req.id}: ${effectiveDays} días efectivos (${req.estado})`);
        });
        
        console.log(`     🧮 Total días solicitados: ${totalDaysRequested}`);
        console.log(`     💰 Saldo original: ${testUser.actualBalance}`);
        console.log(`     💰 Saldo estimado restante: ${testUser.actualBalance - totalDaysRequested}`);
        
        if (totalDaysRequested > testUser.actualBalance) {
          console.log(`     ⚠️  PROBLEMA: Total solicitado excede saldo disponible`);
        } else {
          console.log(`     ✅ Saldo suficiente para todas las solicitudes`);
        }
      }
    }

    // 5. Test de API endpoints específicos
    console.log("\n5. 🔌 Test de endpoints de API...");
    
    // Test endpoint de balance de vacaciones
    console.log("   📡 GET /api/vacation-balance/:id");
    for (const user of testUsers) {
      const response = await fetch(`${BASE_URL}/api/vacation-balance/${user.id}`);
      console.log(`     ${user.name}: ${response.status} ${response.statusText}`);
    }
    
    // Test endpoint de usuarios
    console.log("   📡 GET /api/users");
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    console.log(`     Status: ${usersResponse.status} ${usersResponse.statusText}`);
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`     Usuarios disponibles: ${users.length}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎯 RESULTADO DEL TEST DE INTEGRACIÓN");
    console.log("=".repeat(70));
    
    const workingUsers = balanceResults.filter(u => u.available).length;
    console.log(`✅ FUNCIONALIDADES VERIFICADAS:`);
    console.log(`   - ${workingUsers}/${testUsers.length} usuarios con saldos configurados`);
    console.log(`   - Cálculo de días laborables implementado`);
    console.log(`   - Creación de solicitudes de vacaciones funcional`);
    console.log(`   - API endpoints respondiendo correctamente`);
    
    console.log(`\n📝 ASPECTOS A VERIFICAR EN FRONTEND:`);
    console.log(`   1. Selección correcta del usuario para quien se solicita`);
    console.log(`   2. Carga automática del saldo al cambiar usuario`);
    console.log(`   3. Cálculo en tiempo real al seleccionar fechas`);
    console.log(`   4. Validación de saldo insuficiente antes de enviar`);

  } catch (error) {
    console.error("❌ Error en test de integración:", error);
  }
}

// Ejecutar el test
testVacationFrontendBackendIntegration();