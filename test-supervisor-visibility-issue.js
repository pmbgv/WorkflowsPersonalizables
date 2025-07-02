/**
 * Test específico para diagnosticar por qué el supervisor no ve la solicitud pendiente
 * en el frontend, aunque el backend funciona correctamente
 */

const BASE_URL = "http://localhost:5000";

async function testSupervisorVisibilityIssue() {
  console.log("🔍 Diagnóstico del problema de visibilidad del supervisor");
  console.log("=" .repeat(60));

  try {
    // 1. Verificar que la solicitud 156 existe y está pendiente
    console.log("\n1. Verificando solicitud 156...");
    const requestResponse = await fetch(`${BASE_URL}/api/requests/156`);
    if (!requestResponse.ok) {
      throw new Error(`Error al obtener solicitud 156: ${requestResponse.status}`);
    }
    
    const request = await requestResponse.json();
    console.log(`   ✅ Solicitud 156 encontrada:`);
    console.log(`      - Motivo: ${request.motivo}`);
    console.log(`      - Estado: ${request.estado}`);
    console.log(`      - Solicitado por: ${request.solicitadoPor}`);
    console.log(`      - Identificador: ${request.identificador}`);

    // 2. Verificar pasos de aprobación
    console.log("\n2. Verificando pasos de aprobación...");
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/156/approval-steps`);
    if (!stepsResponse.ok) {
      throw new Error(`Error al obtener pasos de aprobación: ${stepsResponse.status}`);
    }
    
    const steps = await stepsResponse.json();
    console.log(`   ✅ ${steps.length} pasos de aprobación encontrados:`);
    steps.forEach((step, index) => {
      console.log(`      Paso ${index + 1}:`);
      console.log(`        - Perfil: ${step.perfil}`);
      console.log(`        - Orden: ${step.orden}`);
      console.log(`        - Obligatorio: ${step.obligatorio}`);
      console.log(`        - Estado: ${step.estado}`);
    });

    // 3. Test específico: ¿Puede el supervisor ver la solicitud via API?
    console.log("\n3. Probando visibilidad del supervisor via API...");
    
    // Usar diferentes IDs de usuario supervisor para probar
    const supervisorUserIds = ["123", "183955671", "20836784"];
    
    for (const userId of supervisorUserIds) {
      console.log(`\n   Probando con userId ${userId}:`);
      const pendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/${userId}?userProfile=${encodeURIComponent("#supervisor#")}`);
      
      if (!pendingResponse.ok) {
        console.log(`      ❌ Error ${pendingResponse.status}: ${pendingResponse.statusText}`);
        continue;
      }
      
      const pendingRequests = await pendingResponse.json();
      console.log(`      📊 ${pendingRequests.length} solicitudes pendientes encontradas`);
      
      const found156 = pendingRequests.find(r => r.id === 156);
      if (found156) {
        console.log(`      ✅ Solicitud 156 VISIBLE para supervisor con userId ${userId}`);
      } else {
        console.log(`      ❌ Solicitud 156 NO VISIBLE para supervisor con userId ${userId}`);
      }
    }

    // 4. Test: ¿Qué usuarios están disponibles en el sistema?
    console.log("\n4. Verificando usuarios disponibles en el sistema...");
    const usersResponse = await fetch(`${BASE_URL}/api/users-complete`);
    if (!usersResponse.ok) {
      throw new Error(`Error al obtener usuarios: ${usersResponse.status}`);
    }
    
    const users = await usersResponse.json();
    console.log(`   ✅ ${users.length} usuarios encontrados en el sistema`);
    
    const supervisors = users.filter(u => u.UserProfile === "#supervisor#");
    console.log(`   👥 ${supervisors.length} usuarios con perfil #supervisor#:`);
    
    supervisors.forEach((supervisor, index) => {
      console.log(`      ${index + 1}. ${supervisor.TradeName || supervisor.Name} (ID: ${supervisor.Identifier || supervisor.Id})`);
    });

    // 5. Test frontend: verificar que canApprove funciona
    console.log("\n5. Verificando endpoint canApprove...");
    
    if (supervisors.length > 0) {
      const testSupervisor = supervisors[0];
      const userProfile = testSupervisor.UserProfile;
      
      const canApproveResponse = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(userProfile)}/can-approve`);
      if (!canApproveResponse.ok) {
        console.log(`      ❌ Error al verificar canApprove: ${canApproveResponse.status}`);
      } else {
        const canApproveData = await canApproveResponse.json();
        console.log(`      📋 CanApprove para ${userProfile}: ${canApproveData.canApprove}`);
      }
    }

    // 6. Verificar esquemas de aprobación
    console.log("\n6. Verificando esquemas de aprobación para test3...");
    const schemasResponse = await fetch(`${BASE_URL}/api/approval-schemas`);
    if (!schemasResponse.ok) {
      throw new Error(`Error al obtener esquemas: ${schemasResponse.status}`);
    }
    
    const schemas = await schemasResponse.json();
    const test3Schema = schemas.find(s => s.nombre === "test3");
    
    if (test3Schema) {
      console.log(`   ✅ Esquema test3 encontrado (ID: ${test3Schema.id})`);
      console.log(`      - Motivos: ${test3Schema.motivos.join(", ")}`);
      console.log(`      - Tipo: ${test3Schema.tipoSolicitud}`);
      
      // Obtener pasos del esquema
      const schemaStepsResponse = await fetch(`${BASE_URL}/api/approval-schemas/${test3Schema.id}/steps`);
      if (schemaStepsResponse.ok) {
        const schemaSteps = await schemaStepsResponse.json();
        console.log(`      - ${schemaSteps.length} pasos configurados:`);
        schemaSteps.forEach((step, index) => {
          console.log(`         Paso ${index + 1}: ${step.perfil} (orden ${step.orden}, ${step.obligatorio})`);
        });
      }
    } else {
      console.log(`   ❌ Esquema test3 NO encontrado`);
    }

    // 7. Diagnóstico final
    console.log("\n7. 🎯 DIAGNÓSTICO FINAL:");
    console.log("   " + "=".repeat(45));
    
    if (request.estado === "Pendiente" && steps.length > 0 && steps[0].perfil === "#supervisor#") {
      console.log("   ✅ Backend: Configuración correcta");
      console.log("      - Solicitud pendiente existe");
      console.log("      - Primer paso requiere #supervisor#");
      console.log("      - API devuelve solicitud para supervisor");
      
      console.log("\n   🔍 POSIBLES PROBLEMAS EN FRONTEND:");
      console.log("      1. Perfil de usuario no se detecta correctamente");
      console.log("      2. Query de React Query no se ejecuta");
      console.log("      3. Filtros de fecha/estado interfieren");
      console.log("      4. Usuario seleccionado no tiene perfil #supervisor#");
      console.log("      5. Componente PendingRequestsTable no renderiza");
      
      console.log("\n   📋 PRÓXIMOS PASOS:");
      console.log("      1. Verificar selectedUser en dashboard");
      console.log("      2. Revisar query de pendingRequests");
      console.log("      3. Verificar condición de renderizado de tab");
      console.log("      4. Agregar logs en frontend components");
    } else {
      console.log("   ❌ Problema en backend detectado");
    }

  } catch (error) {
    console.error("❌ Error durante diagnóstico:", error.message);
  }
}

// Ejecutar test
testSupervisorVisibilityIssue();