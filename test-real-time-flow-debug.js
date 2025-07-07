/**
 * Test en tiempo real para debuggear exactamente qué está pasando con la nueva solicitud
 */

const BASE_URL = "http://localhost:5000";

function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function testRealTimeFlowDebug() {
  console.log("🔍 DEBUG: Flujo en tiempo real paso a paso");
  console.log("=".repeat(60));

  try {
    // 1. Crear nueva solicitud
    console.log("\n1. 🆕 Creando nueva solicitud...");
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 10);
    const requestDate = formatDateToLocal(tomorrow);
    
    const newRequestData = {
      tipo: "Permiso",
      fechaSolicitada: requestDate,
      fechaFin: requestDate,
      asunto: "Debug tiempo real - flujo secuencial",
      descripcion: "Verificación estado por pasos",
      solicitadoPor: "Prueba GC",
      identificador: "20836784",
      usuarioSolicitado: "Prueba GC",
      identificadorUsuario: "20836784",
      motivo: "Ley 20823",
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
    console.log(`✅ Solicitud creada: ID ${newRequest.id}, Estado inicial: ${newRequest.estado}`);

    // 2. Verificar estado en BD inmediatamente
    console.log("\n2. 📋 Verificando estado inicial en BD...");
    const checkInitial = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    if (checkInitial.ok) {
      const initialRequest = await checkInitial.json();
      console.log(`📊 Estado en BD: ${initialRequest.estado}`);
    }

    // 3. Verificar pasos de aprobación
    console.log("\n3. 🔍 Verificando pasos de aprobación...");
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

    // 4. Verificar que supervisor puede aprobar
    console.log("\n4. 👔 Verificando si supervisor puede aprobar...");
    const canApproveSupervisor = await testUserCanApprove(newRequest.id, "#supervisor#");
    console.log(`   Supervisor puede aprobar: ${canApproveSupervisor ? "SÍ" : "NO"}`);
    
    // 5. Verificar que adminCuenta NO puede aprobar todavía
    console.log("\n5. 💼 Verificando si adminCuenta puede aprobar...");
    const canApproveAdmin = await testUserCanApprove(newRequest.id, "#adminCuenta#");
    console.log(`   AdminCuenta puede aprobar: ${canApproveAdmin ? "SÍ" : "NO"}`);

    if (canApproveSupervisor) {
      // 6. Supervisor aprueba paso 1
      console.log("\n6. ✅ Supervisor aprobando paso 1...");
      
      const stepsForApproval = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
      if (stepsForApproval.ok) {
        const stepsData = await stepsForApproval.json();
        const supervisorStep = stepsData.find(s => s.approvalStep.perfil === '#supervisor#');
        
        if (supervisorStep) {
          const approvalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'Aprobado',
              userProfile: '#supervisor#',
              comentario: 'Paso 1 aprobado - debug tiempo real'
            })
          });

          const approvalResult = await approvalResponse.json();
          console.log(`   🔄 Resultado aprobación: ${approvalResult.success ? 'ÉXITO' : 'ERROR'}`);
          console.log(`   📊 Estado resultante: ${approvalResult.requestStatus}`);
          console.log(`   💬 Mensaje: ${approvalResult.message}`);

          // 7. Verificar estado después de paso 1
          console.log("\n7. 📋 Verificando estado después del paso 1...");
          
          await new Promise(resolve => setTimeout(resolve, 500)); // Esperar un poco
          
          const checkAfterStep1 = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
          if (checkAfterStep1.ok) {
            const requestAfterStep1 = await checkAfterStep1.json();
            console.log(`   📊 Estado en BD después paso 1: ${requestAfterStep1.estado}`);
          }

          // 8. Verificar pasos después de aprobación paso 1
          console.log("\n8. 🔍 Verificando pasos después de paso 1...");
          const stepsAfter = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
          if (stepsAfter.ok) {
            const stepsAfterData = await stepsAfter.json();
            stepsAfterData.forEach((stepData, index) => {
              const step = stepData.requestApprovalStep;
              const config = stepData.approvalStep;
              console.log(`     Paso ${index + 1}: ${config.perfil} - ${step.estado} (${config.obligatorio})`);
            });
          }

          // 9. Verificar que adminCuenta ahora puede aprobar
          console.log("\n9. 💼 Verificando si adminCuenta puede aprobar después paso 1...");
          const canApproveAdminAfter = await testUserCanApprove(newRequest.id, "#adminCuenta#");
          console.log(`   AdminCuenta puede aprobar: ${canApproveAdminAfter ? "SÍ" : "NO"}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 ANÁLISIS DEL PROBLEMA");
    console.log("=".repeat(60));
    console.log("✅ COMPORTAMIENTO ESPERADO:");
    console.log("   - Supervisor aprueba paso 1");
    console.log("   - Solicitud SIGUE en estado 'Pendiente'");
    console.log("   - AdminCuenta puede aprobar paso 2");
    console.log("   - Solo cuando adminCuenta aprueba → estado 'Aprobado'");

  } catch (error) {
    console.error("❌ Error en debug tiempo real:", error);
  }
}

async function testUserCanApprove(requestId, userProfile) {
  try {
    // Simular la lógica de checkUserCanApprove
    const response = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps`);
    if (!response.ok) return false;
    
    const steps = await response.json();
    
    // Buscar el siguiente paso pendiente
    const nextPendingStep = steps.find(stepData => {
      const step = stepData.requestApprovalStep;
      const config = stepData.approvalStep;
      return step.estado === 'Pendiente' && config.obligatorio === 'Si';
    });
    
    if (!nextPendingStep) return false;
    
    // Verificar si el perfil coincide
    return nextPendingStep.approvalStep.perfil === userProfile || 
           nextPendingStep.approvalStep.perfil === "Todos los perfiles";
           
  } catch (error) {
    console.error("Error verificando si puede aprobar:", error);
    return false;
  }
}

// Ejecutar el test
testRealTimeFlowDebug();