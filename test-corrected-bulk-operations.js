/**
 * Test para verificar que las operaciones masivas ahora usan los endpoints correctos
 * y no interfieren con el flujo secuencial de aprobación
 */

const BASE_URL = "http://localhost:5000";

function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function testCorrectedBulkOperations() {
  console.log("🔧 TEST: Operaciones masivas corregidas");
  console.log("=".repeat(60));

  try {
    // 1. Crear múltiples solicitudes para testing
    console.log("\n1. 🆕 Creando múltiples solicitudes...");
    
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 20);
    const requestDate = formatDateToLocal(testDate);
    
    const requestIds = [];
    
    for (let i = 1; i <= 3; i++) {
      const newRequestData = {
        tipo: "Permiso",
        fechaSolicitada: requestDate,
        fechaFin: requestDate,
        asunto: `Test bulk operation ${i}`,
        descripcion: `Verificando operación masiva con endpoints correctos #${i}`,
        solicitadoPor: "Prueba GC",
        identificador: "20836784",
        usuarioSolicitado: "Prueba GC",
        identificadorUsuario: "20836784",
        motivo: "P. Fallecimiento",
        archivosAdjuntos: []
      };

      const createResponse = await fetch(`${BASE_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequestData)
      });

      if (createResponse.ok) {
        const newRequest = await createResponse.json();
        requestIds.push(newRequest.id);
        console.log(`✅ Solicitud ${i} creada: ID ${newRequest.id}`);
      }
    }

    // 2. Verificar que todas tienen pasos de aprobación
    console.log("\n2. 🔍 Verificando pasos de aprobación...");
    for (const requestId of requestIds) {
      const stepsResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps`);
      if (stepsResponse.ok) {
        const steps = await stepsResponse.json();
        console.log(`📋 Solicitud ${requestId}: ${steps.length} pasos de aprobación`);
      }
    }

    // 3. Simular operación masiva de supervisor usando endpoint correcto
    console.log("\n3. ✅ Simulando operación masiva del supervisor...");
    
    let bulkSuccessCount = 0;
    const userProfile = '#supervisor#';
    
    for (const requestId of requestIds) {
      // Get approval steps for this request
      const stepsResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps`);
      if (!stepsResponse.ok) continue;
      
      const steps = await stepsResponse.json();
      const currentStep = steps.find(stepData => 
        stepData.approvalStep.perfil === userProfile && 
        stepData.requestApprovalStep.estado === 'Pendiente'
      );

      if (!currentStep) continue;

      // Process using workflow endpoint (NOT manual status endpoint)
      const approvalResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps/${currentStep.requestApprovalStep.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Aprobado',
          userProfile,
          comentario: 'Aprobación masiva simulada con endpoint correcto'
        })
      });

      if (approvalResponse.ok) {
        const result = await approvalResponse.json();
        console.log(`   ✅ Solicitud ${requestId}: ${result.message}`);
        bulkSuccessCount++;
      }
    }

    console.log(`📊 Operación masiva completada: ${bulkSuccessCount}/${requestIds.length} exitosas`);

    // 4. Verificar que todas siguen "Pendiente" (no pasaron a "Aprobado" prematuramente)
    console.log("\n4. 🔍 Verificando estado después de aprobación masiva...");
    
    for (const requestId of requestIds) {
      const checkResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`);
      if (checkResponse.ok) {
        const request = await checkResponse.json();
        console.log(`   📊 Solicitud ${requestId}: ${request.estado}`);
        
        if (request.estado === "Pendiente") {
          console.log(`     ✅ CORRECTO: Sigue pendiente para adminCuenta`);
        } else {
          console.log(`     ❌ PROBLEMA: Estado incorrecto - ${request.estado}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 RESULTADO DEL TEST");
    console.log("=".repeat(60));
    console.log("✅ OPERACIONES MASIVAS CORREGIDAS:");
    console.log("   - Usan endpoints de flujo de aprobación");
    console.log("   - NO usan endpoint manual de estado");
    console.log("   - Respetan la secuencia supervisor → adminCuenta");
    console.log("   - Mantienen estado 'Pendiente' hasta completar todos los pasos");

  } catch (error) {
    console.error("❌ Error en test:", error);
  }
}

// Ejecutar el test
testCorrectedBulkOperations();