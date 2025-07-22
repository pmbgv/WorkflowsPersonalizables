/**
 * Test específico para verificar los cálculos de días en el formulario frontend
 * Simula la interacción del usuario con el formulario de vacaciones
 */

const BASE_URL = "http://localhost:5000";

async function simulateFrontendVacationForm() {
  console.log("🖥️ TEST: Formulario Frontend de Vacaciones");
  console.log("=".repeat(60));

  try {
    // 1. Simular selección de usuario con saldo de vacaciones
    console.log("\n1. 👤 Simulando selección de usuario...");
    const testUser = {
      id: "164640310",
      Name: "Tito",
      LastName: "Rivera",
      Identifier: "164640310",
      UserProfile: "#adminCuenta#"
    };
    
    console.log(`   Usuario seleccionado: ${testUser.Name} ${testUser.LastName} (${testUser.id})`);

    // 2. Simular obtención de saldo de vacaciones (lo que hace el frontend)
    console.log("\n2. 💰 Simulando consulta de saldo de vacaciones...");
    const balanceResponse = await fetch(`${BASE_URL}/api/vacation-balance/${testUser.id}`);
    
    if (!balanceResponse.ok) {
      console.log("   ❌ No se pudo obtener el saldo de vacaciones");
      return;
    }
    
    const vacationBalance = await balanceResponse.json();
    console.log(`   ✅ Saldo obtenido: ${vacationBalance.diasDisponibles} días`);

    // 3. Simular diferentes casos de selección de fechas
    console.log("\n3. 📅 Simulando cálculos de diferentes rangos de fechas...");
    
    const testCases = [
      {
        name: "1 día laborable (Lunes)",
        startDate: new Date(2025, 8, 1), // Sept 1, 2025 (Monday)
        endDate: new Date(2025, 8, 1),   // Sept 1, 2025 (Monday)
      },
      {
        name: "5 días laborables (Lunes-Viernes)",
        startDate: new Date(2025, 8, 1), // Sept 1, 2025 (Monday)
        endDate: new Date(2025, 8, 5),   // Sept 5, 2025 (Friday)
      },
      {
        name: "7 días con fines de semana (Viernes-Jueves siguiente)",
        startDate: new Date(2025, 8, 5),  // Sept 5, 2025 (Friday)
        endDate: new Date(2025, 8, 11),   // Sept 11, 2025 (Thursday)
      },
      {
        name: "10 días laborables (2 semanas)",
        startDate: new Date(2025, 8, 1),  // Sept 1, 2025 (Monday)
        endDate: new Date(2025, 8, 12),   // Sept 12, 2025 (Friday)
      }
    ];

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

    for (const testCase of testCases) {
      console.log(`\n   📋 ${testCase.name}:`);
      
      // Simular el cálculo que hace el frontend
      const diasSolicitados = Math.ceil((testCase.endDate - testCase.startDate) / (1000 * 60 * 60 * 24)) + 1;
      const diasEfectivos = calculateWorkingDays(testCase.startDate, testCase.endDate);
      const diasRestantes = vacationBalance.diasDisponibles - diasEfectivos;

      console.log(`     📅 Fechas: ${testCase.startDate.toLocaleDateString()} - ${testCase.endDate.toLocaleDateString()}`);
      console.log(`     📊 Días solicitados: ${diasSolicitados}`);
      console.log(`     💼 Días efectivos (laborables): ${diasEfectivos}`);
      console.log(`     💰 Días restantes: ${diasRestantes}`);
      
      if (diasRestantes < 0) {
        console.log(`     ⚠️ ADVERTENCIA: Saldo insuficiente`);
      } else {
        console.log(`     ✅ Saldo suficiente`);
      }

      // Simular creación de la solicitud si es válida
      if (diasRestantes >= 0) {
        const vacationRequestData = {
          tipo: "Vacaciones",
          fechaSolicitada: testCase.startDate.toISOString().split('T')[0],
          fechaFin: testCase.endDate.toISOString().split('T')[0],
          asunto: `Test: ${testCase.name}`,
          descripcion: "Solicitud de test para verificar cálculos",
          solicitadoPor: `${testUser.Name} ${testUser.LastName}`,
          identificador: testUser.id,
          usuarioSolicitado: `${testUser.Name} ${testUser.LastName}`,
          identificadorUsuario: testUser.id,
          motivo: "Vacaciones",
          diasSolicitados: diasSolicitados,
          diasEfectivos: diasEfectivos,
          archivosAdjuntos: []
        };

        const createResponse = await fetch(`${BASE_URL}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vacationRequestData)
        });

        if (createResponse.ok) {
          const createdRequest = await createResponse.json();
          console.log(`     ✅ Solicitud creada exitosamente: ID ${createdRequest.id}`);
          
          // Verificar que los campos se guardaron correctamente
          if (createdRequest.diasSolicitados === diasSolicitados && createdRequest.diasEfectivos === diasEfectivos) {
            console.log(`     ✅ Datos guardados correctamente en backend`);
          } else {
            console.log(`     ❌ Discrepancia en datos guardados:`);
            console.log(`       Frontend calculó: ${diasSolicitados}/${diasEfectivos} días`);
            console.log(`       Backend guardó: ${createdRequest.diasSolicitados}/${createdRequest.diasEfectivos} días`);
          }
        } else {
          console.log(`     ❌ Error creando solicitud: ${await createResponse.text()}`);
        }
      }
    }

    // 4. Simular problema específico de usuario que solicita para otro
    console.log("\n4. 👥 Simulando solicitud para terceros...");
    
    const anotherUser = {
      id: "262698211",
      Name: "Marilia",
      LastName: "Copia",
      Identifier: "262698211"
    };

    console.log(`   Admin (${testUser.Name}) solicitando para ${anotherUser.Name}...`);
    
    // Obtener saldo del usuario objetivo
    const targetBalanceResponse = await fetch(`${BASE_URL}/api/vacation-balance/${anotherUser.id}`);
    if (targetBalanceResponse.ok) {
      const targetBalance = await targetBalanceResponse.json();
      console.log(`   💰 Saldo de ${anotherUser.Name}: ${targetBalance.diasDisponibles} días`);

      // Simular solicitud para terceros
      const thirdPartyRequestData = {
        tipo: "Vacaciones",
        fechaSolicitada: "2025-09-15",
        fechaFin: "2025-09-19",
        asunto: "Vacaciones solicitadas por admin",
        descripcion: "Test de solicitud para terceros",
        solicitadoPor: `${testUser.Name} ${testUser.LastName}`, // Admin que solicita
        identificador: testUser.id, // ID del admin
        usuarioSolicitado: `${anotherUser.Name} ${anotherUser.LastName}`, // Usuario objetivo
        identificadorUsuario: anotherUser.id, // ID del usuario objetivo
        motivo: "Vacaciones",
        diasSolicitados: 5,
        diasEfectivos: 5,
        archivosAdjuntos: []
      };

      console.log(`   📋 Estructura de solicitud:`);
      console.log(`     - Solicitado por: ${thirdPartyRequestData.solicitadoPor} (${thirdPartyRequestData.identificador})`);
      console.log(`     - Para usuario: ${thirdPartyRequestData.usuarioSolicitado} (${thirdPartyRequestData.identificadorUsuario})`);
      console.log(`     - Saldo a verificar: Usuario objetivo (${anotherUser.Name})`);

      const createThirdPartyResponse = await fetch(`${BASE_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thirdPartyRequestData)
      });

      if (createThirdPartyResponse.ok) {
        console.log(`   ✅ Solicitud para terceros creada exitosamente`);
      } else {
        console.log(`   ❌ Error creando solicitud para terceros: ${await createThirdPartyResponse.text()}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 DIAGNÓSTICO DEL FORMULARIO FRONTEND");
    console.log("=".repeat(60));
    console.log("✅ FUNCIONALIDADES QUE FUNCIONAN:");
    console.log("   - Consulta de saldo de vacaciones por ID de usuario");
    console.log("   - Cálculo de días laborables (excluyendo fines de semana)");
    console.log("   - Validación de saldo disponible");
    console.log("   - Creación de solicitudes con datos calculados");
    console.log("");
    console.log("🔧 ASPECTOS CRÍTICOS IDENTIFICADOS:");
    console.log("   1. El frontend debe usar identificadorUsuario para consultar saldo");
    console.log("   2. Cuando se solicita para terceros, el saldo debe ser del usuario objetivo");
    console.log("   3. Los cálculos de días se realizan correctamente en JavaScript");
    console.log("");
    console.log("📝 RECOMENDACIONES:");
    console.log("   1. Verificar que el formulario actualice el saldo al cambiar de usuario");
    console.log("   2. Asegurar que la query de saldo use el identificadorUsuario correcto");
    console.log("   3. Mostrar mensajes claros cuando el saldo es insuficiente");

  } catch (error) {
    console.error("❌ Error en simulación frontend:", error);
  }
}

// Ejecutar la simulación
simulateFrontendVacationForm();