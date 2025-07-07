/**
 * Test en tiempo real para debuggear exactamente qué está pasando con la nueva solicitud
 */

const BASE_URL = "http://localhost:5000";

async function testRealTimeFlowDebug() {
  console.log("🔍 DEBUGGING EN TIEMPO REAL - Nueva solicitud creada");
  console.log("=".repeat(70));

  try {
    // 1. Buscar la solicitud más reciente con motivo "Ley 20823"
    console.log("\n1. Buscando la solicitud más reciente...");
    
    const allRequestsResponse = await fetch(`${BASE_URL}/api/requests`);
    const allRequests = await allRequestsResponse.json();
    
    const test3Requests = allRequests
      .filter(r => r.motivo === "Ley 20823")
      .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
    
    if (test3Requests.length === 0) {
      console.log("❌ No se encontraron solicitudes con motivo 'Ley 20823'");
      return;
    }

    const latestRequest = test3Requests[0];
    console.log(`📋 Solicitud más reciente: ID ${latestRequest.id}`);
    console.log(`   Usuario: ${latestRequest.usuarioSolicitado}`);
    console.log(`   Estado: ${latestRequest.estado}`);
    console.log(`   Fecha solicitada: ${latestRequest.fechaSolicitada}`);
    console.log(`   Creada: ${new Date(latestRequest.fechaCreacion).toLocaleString()}`);

    // 2. Verificar pasos de aprobación de la solicitud más reciente
    console.log("\n2. Verificando pasos de aprobación...");
    
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${latestRequest.id}/approval-steps`);
    if (!stepsResponse.ok) {
      console.log(`❌ Error obteniendo pasos: ${stepsResponse.status}`);
      return;
    }

    const steps = await stepsResponse.json();
    console.log(`📊 Pasos configurados: ${steps.length}`);
    
    steps.forEach((step, i) => {
      const estado = step.requestApprovalStep.estado;
      const perfil = step.approvalStep.perfil;
      const orden = step.approvalStep.orden;
      const obligatorio = step.approvalStep.obligatorio;
      
      console.log(`   Paso ${orden}: ${perfil} - ${estado} (${obligatorio})`);
    });

    // 3. Verificar "Mis solicitudes" para Prueba GC
    console.log("\n3. Verificando 'Mis solicitudes' para Prueba GC...");
    
    const myRequestsResponse = await fetch(`${BASE_URL}/api/requests/my-requests/20836784`);
    if (myRequestsResponse.ok) {
      const myRequests = await myRequestsResponse.json();
      const foundInMy = myRequests.find(r => r.id === latestRequest.id);
      
      console.log(`📋 "Mis solicitudes": ${foundInMy ? `VISIBLE (Estado: ${foundInMy.estado})` : 'NO VISIBLE'}`);
      
      if (foundInMy) {
        console.log(`   Solicitud ${foundInMy.id}: ${foundInMy.estado} - ${foundInMy.fechaSolicitada}`);
      }
    } else {
      console.log(`❌ Error obteniendo "Mis solicitudes": ${myRequestsResponse.status}`);
    }

    // 4. Verificar supervisor pendientes
    console.log("\n4. Verificando 'Solicitudes pendientes' para supervisor...");
    
    const supervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    if (supervisorResponse.ok) {
      const supervisorRequests = await supervisorResponse.json();
      const foundInSupervisor = supervisorRequests.find(r => r.id === latestRequest.id);
      
      console.log(`👔 Supervisor "Solicitudes pendientes": ${foundInSupervisor ? `VISIBLE (Estado: ${foundInSupervisor.estado})` : 'NO VISIBLE'}`);
      
      if (foundInSupervisor) {
        console.log(`   Solicitud ${foundInSupervisor.id}: ${foundInSupervisor.estado} - ${foundInSupervisor.fechaSolicitada}`);
      }
      
      console.log(`   Total solicitudes pendientes para supervisor: ${supervisorRequests.length}`);
    } else {
      console.log(`❌ Error obteniendo pendientes supervisor: ${supervisorResponse.status}`);
    }

    // 5. Verificar adminCuenta pendientes
    console.log("\n5. Verificando 'Solicitudes pendientes' para adminCuenta...");
    
    const adminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    if (adminResponse.ok) {
      const adminRequests = await adminResponse.json();
      const foundInAdmin = adminRequests.find(r => r.id === latestRequest.id);
      
      console.log(`🔧 AdminCuenta "Solicitudes pendientes": ${foundInAdmin ? `VISIBLE (Estado: ${foundInAdmin.estado})` : 'NO VISIBLE'}`);
      
      if (foundInAdmin) {
        console.log(`   Solicitud ${foundInAdmin.id}: ${foundInAdmin.estado} - ${foundInAdmin.fechaSolicitada}`);
      }
      
      console.log(`   Total solicitudes pendientes para adminCuenta: ${adminRequests.length}`);
    } else {
      console.log(`❌ Error obteniendo pendientes adminCuenta: ${adminResponse.status}`);
    }

    // 6. Verificar manualmente el algoritmo de filtrado
    console.log("\n6. Verificando algoritmo de filtrado manualmente...");
    
    // Simular checkUserCanApprove para supervisor
    console.log("🔍 Simulando checkUserCanApprove para supervisor...");
    
    const supervisorCanApprove = await testUserCanApprove(latestRequest.id, '#supervisor#');
    console.log(`   ✅ Supervisor puede aprobar: ${supervisorCanApprove}`);
    
    // Simular checkUserCanApprove para adminCuenta
    console.log("🔍 Simulando checkUserCanApprove para adminCuenta...");
    
    const adminCanApprove = await testUserCanApprove(latestRequest.id, '#adminCuenta#');
    console.log(`   ✅ AdminCuenta puede aprobar: ${adminCanApprove}`);

    // 7. Diagnóstico del problema
    console.log("\n7. DIAGNÓSTICO DEL PROBLEMA:");
    console.log("-".repeat(40));
    
    const shouldBeInMy = latestRequest.usuarioSolicitado === "Prueba GC" || latestRequest.solicitadoPor === "Prueba GC";
    const shouldBeInSupervisor = latestRequest.estado === "Pendiente" && supervisorCanApprove;
    const shouldBeInAdmin = latestRequest.estado === "Pendiente" && adminCanApprove;
    
    console.log(`📋 Debería estar en "Mis solicitudes": ${shouldBeInMy ? 'SÍ' : 'NO'} | Está: ${foundInMy ? 'SÍ' : 'NO'}`);
    console.log(`👔 Debería estar en supervisor pendientes: ${shouldBeInSupervisor ? 'SÍ' : 'NO'} | Está: ${foundInSupervisor ? 'SÍ' : 'NO'}`);
    console.log(`🔧 Debería estar en admin pendientes: ${shouldBeInAdmin ? 'SÍ' : 'NO'} | Está: ${foundInAdmin ? 'SÍ' : 'NO'}`);

    // Identificar discrepancias
    const discrepancies = [];
    if (shouldBeInMy !== !!foundInMy) {
      discrepancies.push('"Mis solicitudes"');
    }
    if (shouldBeInSupervisor !== !!foundInSupervisor) {
      discrepancies.push('Supervisor pendientes');
    }
    if (shouldBeInAdmin !== !!foundInAdmin) {
      discrepancies.push('Admin pendientes');
    }

    if (discrepancies.length > 0) {
      console.log(`🚨 DISCREPANCIAS ENCONTRADAS EN: ${discrepancies.join(', ')}`);
    } else {
      console.log(`✅ TODO ESTÁ FUNCIONANDO COMO DEBERÍA`);
    }

  } catch (error) {
    console.error("❌ Error en debugging en tiempo real:", error);
  }
}

async function testUserCanApprove(requestId, userProfile) {
  try {
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps`);
    if (!stepsResponse.ok) return false;
    
    const steps = await stepsResponse.json();
    
    // Encontrar el primer paso pendiente
    for (const stepData of steps) {
      const step = stepData.requestApprovalStep;
      const stepConfig = stepData.approvalStep;
      
      if (step.estado === "Pendiente") {
        if (stepConfig.obligatorio === "Si") {
          // Verificar pasos obligatorios anteriores
          const previousObligatorySteps = steps.filter(s => 
            s.approvalStep.obligatorio === "Si" && 
            s.approvalStep.orden < stepConfig.orden
          );
          
          const allPreviousCompleted = previousObligatorySteps.every(s => 
            s.requestApprovalStep.estado === "Aprobado"
          );
          
          if (!allPreviousCompleted) {
            continue;
          }
        }
        
        // Verificar si el perfil coincide
        return stepConfig.perfil === userProfile || stepConfig.perfil === "Todos los perfiles";
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Ejecutar el debugging
testRealTimeFlowDebug();