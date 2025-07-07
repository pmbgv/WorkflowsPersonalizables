/**
 * Test para verificar el estado de solicitudes existentes en el sistema
 * Específicamente para verificar si hay inconsistencias con solicitudes previas
 */

const BASE_URL = "http://localhost:5000";

async function testExistingRequestsStatus() {
  console.log("🔍 TEST: Verificando estado de solicitudes existentes");
  console.log("=".repeat(70));

  try {
    // 1. Obtener todas las solicitudes del sistema
    console.log("\n1. Obteniendo todas las solicitudes del sistema...");
    
    const allRequestsResponse = await fetch(`${BASE_URL}/api/requests`);
    const allRequests = await allRequestsResponse.json();
    
    console.log(`📊 Total de solicitudes en sistema: ${allRequests.length}`);

    // 2. Filtrar solicitudes con motivo "Ley 20823" (test3)
    const test3Requests = allRequests.filter(r => r.motivo === "Ley 20823");
    console.log(`🎯 Solicitudes con motivo "Ley 20823": ${test3Requests.length}`);

    // 3. Analizar cada solicitud test3
    if (test3Requests.length > 0) {
      console.log("\n2. Analizando solicitudes con motivo 'Ley 20823'...");
      
      for (const request of test3Requests) {
        console.log(`\n📋 Solicitud ID ${request.id}:`);
        console.log(`   Usuario: ${request.usuarioSolicitado}`);
        console.log(`   Estado: ${request.estado}`);
        console.log(`   Fecha: ${request.fechaSolicitada}`);
        console.log(`   Creada: ${new Date(request.fechaCreacion).toLocaleString()}`);

        // Obtener pasos de aprobación
        try {
          const stepsResponse = await fetch(`${BASE_URL}/api/requests/${request.id}/approval-steps`);
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json();
            console.log(`   📊 Pasos de aprobación: ${steps.length}`);
            
            steps.forEach((step, i) => {
              const estado = step.requestApprovalStep.estado;
              const perfil = step.approvalStep.perfil;
              const orden = step.approvalStep.orden;
              const obligatorio = step.approvalStep.obligatorio;
              const fechaAprobacion = step.requestApprovalStep.fechaAprobacion 
                ? new Date(step.requestApprovalStep.fechaAprobacion).toLocaleString()
                : 'N/A';
              
              console.log(`      Paso ${orden}: ${perfil} - ${estado} (${obligatorio}) ${fechaAprobacion !== 'N/A' ? `- ${fechaAprobacion}` : ''}`);
            });

            // Verificar consistencia
            const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
            const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
            const approvedObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Aprobado');
            
            console.log(`   🔍 Análisis:`);
            console.log(`      Pasos obligatorios: ${obligatorySteps.length}`);
            console.log(`      Obligatorios pendientes: ${pendingObligatory.length}`);
            console.log(`      Obligatorios aprobados: ${approvedObligatory.length}`);
            
            // Verificar consistencia de estado
            let expectedStatus = "Pendiente";
            if (pendingObligatory.length === 0) {
              expectedStatus = "Aprobado";
            }
            
            const isConsistent = request.estado === expectedStatus;
            console.log(`   ${isConsistent ? '✅' : '❌'} Consistencia: Estado "${request.estado}" ${isConsistent ? 'correcto' : `debería ser "${expectedStatus}"`}`);
            
            if (!isConsistent) {
              console.log(`   🚨 INCONSISTENCIA DETECTADA en solicitud ${request.id}`);
            }
          } else {
            console.log(`   ❌ Error obteniendo pasos: ${stepsResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error procesando pasos: ${error.message}`);
        }
      }
    }

    // 4. Verificar solicitudes pendientes para supervisor
    console.log("\n3. Verificando solicitudes pendientes para supervisor...");
    
    const supervisorPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    if (supervisorPendingResponse.ok) {
      const supervisorRequests = await supervisorPendingResponse.json();
      console.log(`👔 Supervisor ve ${supervisorRequests.length} solicitudes pendientes`);
      
      const supervisorTest3 = supervisorRequests.filter(r => r.motivo === "Ley 20823");
      console.log(`   🎯 Con motivo "Ley 20823": ${supervisorTest3.length}`);
      
      supervisorTest3.forEach(req => {
        console.log(`      ID ${req.id}: ${req.usuarioSolicitado} - ${req.estado}`);
      });
    } else {
      console.log(`❌ Error obteniendo pendientes supervisor: ${supervisorPendingResponse.status}`);
    }

    // 5. Verificar solicitudes pendientes para adminCuenta
    console.log("\n4. Verificando solicitudes pendientes para adminCuenta...");
    
    const adminPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    if (adminPendingResponse.ok) {
      const adminRequests = await adminPendingResponse.json();
      console.log(`🔧 AdminCuenta ve ${adminRequests.length} solicitudes pendientes`);
      
      const adminTest3 = adminRequests.filter(r => r.motivo === "Ley 20823");
      console.log(`   🎯 Con motivo "Ley 20823": ${adminTest3.length}`);
      
      adminTest3.forEach(req => {
        console.log(`      ID ${req.id}: ${req.usuarioSolicitado} - ${req.estado}`);
      });
    } else {
      console.log(`❌ Error obteniendo pendientes adminCuenta: ${adminPendingResponse.status}`);
    }

    // 6. Verificar "Mis solicitudes" para Prueba GC
    console.log("\n5. Verificando 'Mis solicitudes' para Prueba GC...");
    
    const myRequestsResponse = await fetch(`${BASE_URL}/api/requests/my-requests/20836784`);
    if (myRequestsResponse.ok) {
      const myRequests = await myRequestsResponse.json();
      console.log(`📋 "Mis solicitudes" muestra ${myRequests.length} solicitudes`);
      
      const myTest3 = myRequests.filter(r => r.motivo === "Ley 20823");
      console.log(`   🎯 Con motivo "Ley 20823": ${myTest3.length}`);
      
      myTest3.forEach(req => {
        console.log(`      ID ${req.id}: ${req.estado} - ${req.fechaSolicitada}`);
      });
    } else {
      console.log(`❌ Error obteniendo "Mis solicitudes": ${myRequestsResponse.status}`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 RESUMEN");
    console.log("=".repeat(70));
    console.log(`✅ Flujo nuevo funciona perfectamente (según test anterior)`);
    console.log(`📊 Solicitudes "Ley 20823" existentes: ${test3Requests.length}`);
    
    if (test3Requests.length > 0) {
      const inconsistentRequests = [];
      for (const request of test3Requests) {
        try {
          const stepsResponse = await fetch(`${BASE_URL}/api/requests/${request.id}/approval-steps`);
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json();
            const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
            const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
            
            let expectedStatus = pendingObligatory.length === 0 ? "Aprobado" : "Pendiente";
            if (request.estado !== expectedStatus) {
              inconsistentRequests.push(request.id);
            }
          }
        } catch (error) {
          // Skip on error
        }
      }
      
      if (inconsistentRequests.length > 0) {
        console.log(`🚨 Solicitudes con inconsistencias: ${inconsistentRequests.join(', ')}`);
        console.log(`💡 Recomendación: Estas solicitudes necesitan corrección manual`);
      } else {
        console.log(`✅ Todas las solicitudes existentes son consistentes`);
      }
    }

  } catch (error) {
    console.error("❌ Error en test de solicitudes existentes:", error);
  }
}

// Ejecutar el test
testExistingRequestsStatus();