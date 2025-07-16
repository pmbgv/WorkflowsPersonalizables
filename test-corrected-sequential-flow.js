/**
 * Test para verificar la corrección del flujo secuencial de aprobación
 * Después de remover la llamada problemática a onStatusChange
 */

const BASE_URL = "http://localhost:5000";

function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function testCorrectedSequentialFlow() {
  console.log("🔧 TEST: Flujo secuencial corregido");
  console.log("=".repeat(60));

  try {
    // 1. Crear nueva solicitud para testing
    console.log("\n1. 🆕 Creando nueva solicitud...");
    
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 15);
    const requestDate = formatDateToLocal(testDate);
    
    const newRequestData = {
      tipo: "Permiso",
      fechaSolicitada: requestDate,
      fechaFin: requestDate,
      asunto: "Test flujo secuencial corregido",
      descripcion: "Verificando corrección del endpoint manual",
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

    if (!createResponse.ok) {
      console.log(`❌ Error creando solicitud: ${createResponse.status}`);
      return;
    }

    const newRequest = await createResponse.json();
    console.log(`✅ Solicitud creada: ID ${newRequest.id}, Estado: ${newRequest.estado}`);

    // 2. Verificar pasos de aprobación iniciales
    console.log("\n2. 🔍 Verificando pasos de aprobación...");
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    if (stepsResponse.ok) {
      const steps = await stepsResponse.json();
      console.log(`📋 Total pasos: ${steps.length}`);
      
      steps.forEach((stepData, index) => {
        const step = stepData.requestApprovalStep;
        const config = stepData.approvalStep;
        console.log(`   Paso ${index + 1}: ${config.perfil} - ${step.estado} (${config.obligatorio})`);
      });
    }

    // 3. Supervisor aprueba usando el endpoint CORRECTO
    console.log("\n3. ✅ Supervisor aprobando con endpoint correcto...");
    
    const stepsForApproval = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    if (stepsForApproval.ok) {
      const stepsData = await stepsForApproval.json();
      const supervisorStep = stepsData.find(s => s.approvalStep.perfil === '#supervisor#');
      
      if (supervisorStep) {
        // USAR ENDPOINT CORRECTO DE APROBACIÓN POR PASOS
        const approvalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'Aprobado',
            userProfile: '#supervisor#',
            comentario: 'Aprobado con endpoint correcto'
          })
        });

        if (approvalResponse.ok) {
          const approvalResult = await approvalResponse.json();
          console.log(`   🔄 Resultado: ${approvalResult.success ? 'ÉXITO' : 'ERROR'}`);
          console.log(`   📊 Estado resultante: ${approvalResult.requestStatus}`);
          console.log(`   💬 Mensaje: ${approvalResult.message}`);
        } else {
          console.log(`   ❌ Error en aprobación: ${approvalResponse.status}`);
        }
      }
    }

    // 4. Verificar estado después del paso 1
    console.log("\n4. 📋 Verificando estado después de aprobación supervisor...");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const checkAfterStep1 = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    if (checkAfterStep1.ok) {
      const requestAfterStep1 = await checkAfterStep1.json();
      console.log(`   📊 Estado en BD: ${requestAfterStep1.estado}`);
      
      if (requestAfterStep1.estado === "Pendiente") {
        console.log(`   ✅ CORRECTO: Solicitud sigue 'Pendiente' después del paso 1`);
      } else {
        console.log(`   ❌ PROBLEMA: Solicitud cambió a '${requestAfterStep1.estado}' prematuramente`);
      }
    }

    // 5. AdminCuenta aprueba paso 2 usando endpoint correcto
    console.log("\n5. ✅ AdminCuenta aprobando paso 2...");
    
    const stepsAfter = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    if (stepsAfter.ok) {
      const stepsData = await stepsAfter.json();
      const adminStep = stepsData.find(s => s.approvalStep.perfil === '#adminCuenta#');
      
      if (adminStep && adminStep.requestApprovalStep.estado === 'Pendiente') {
        // USAR ENDPOINT CORRECTO DE APROBACIÓN POR PASOS
        const finalApprovalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${adminStep.requestApprovalStep.id}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'Aprobado',
            userProfile: '#adminCuenta#',
            comentario: 'Aprobación final con endpoint correcto'
          })
        });

        if (finalApprovalResponse.ok) {
          const finalResult = await finalApprovalResponse.json();
          console.log(`   🔄 Resultado final: ${finalResult.success ? 'ÉXITO' : 'ERROR'}`);
          console.log(`   📊 Estado final: ${finalResult.requestStatus}`);
          console.log(`   💬 Mensaje: ${finalResult.message}`);
        }
      }
    }

    // 6. Verificar estado final
    console.log("\n6. 🏁 Verificando estado final...");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalCheck = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    if (finalCheck.ok) {
      const finalRequest = await finalCheck.json();
      console.log(`   📊 Estado final en BD: ${finalRequest.estado}`);
      
      if (finalRequest.estado === "Aprobado") {
        console.log(`   ✅ PERFECTO: Solicitud completamente aprobada después de ambos pasos`);
      } else {
        console.log(`   ❌ PROBLEMA: Estado final inesperado: ${finalRequest.estado}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 RESULTADO DEL TEST");
    console.log("=".repeat(60));
    console.log("✅ CORRECCIÓN IMPLEMENTADA:");
    console.log("   - Removido onStatusChange del modal");
    console.log("   - Removidos botones de aprobación masiva");
    console.log("   - Solo se usa endpoint de aprobación por pasos");
    console.log("");
    console.log("📋 FLUJO CORRECTO:");
    console.log("   1. Supervisor aprueba → Estado 'Pendiente'");
    console.log("   2. AdminCuenta aprueba → Estado 'Aprobado'");

  } catch (error) {
    console.error("❌ Error en test:", error);
  }
}

// Ejecutar el test
testCorrectedSequentialFlow();