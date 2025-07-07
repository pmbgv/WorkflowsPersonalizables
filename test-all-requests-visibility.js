/**
 * Test para verificar que adminCuenta puede ver solicitudes en "Todas las solicitudes"
 * donde tiene rol en el flujo de aprobación, incluso si no es su turno actual
 */

const BASE_URL = "http://localhost:5000";

async function testAllRequestsVisibility() {
  console.log("🔍 TEST: Visibilidad en 'Todas las solicitudes' para adminCuenta");
  console.log("=".repeat(70));

  try {
    // 1. Verificar solicitudes pendientes (current behavior)
    console.log("\n1. Verificando 'Solicitudes pendientes' para adminCuenta...");
    
    const pendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    if (pendingResponse.ok) {
      const pendingRequests = await pendingResponse.json();
      const pendingTest3 = pendingRequests.filter(r => r.motivo === "Ley 20823");
      
      console.log(`🔧 Solicitudes pendientes para adminCuenta: ${pendingRequests.length}`);
      console.log(`   Con motivo "Ley 20823": ${pendingTest3.length}`);
      
      pendingTest3.forEach(req => {
        console.log(`      ID ${req.id}: ${req.usuarioSolicitado} - ${req.estado}`);
      });
    } else {
      console.log(`❌ Error obteniendo pendientes: ${pendingResponse.status}`);
    }

    // 2. Verificar "Todas las solicitudes" (new behavior)
    console.log("\n2. Verificando 'Todas las solicitudes' para adminCuenta...");
    
    const allRequestsResponse = await fetch(`${BASE_URL}/api/requests/all-requests/${encodeURIComponent('#adminCuenta#')}`);
    if (allRequestsResponse.ok) {
      const allRequests = await allRequestsResponse.json();
      const allTest3 = allRequests.filter(r => r.motivo === "Ley 20823");
      
      console.log(`📋 Todas las solicitudes para adminCuenta: ${allRequests.length}`);
      console.log(`   Con motivo "Ley 20823": ${allTest3.length}`);
      
      allTest3.slice(0, 10).forEach(req => {
        console.log(`      ID ${req.id}: ${req.usuarioSolicitado} - ${req.estado} - ${req.fechaSolicitada}`);
      });
      
      if (allTest3.length > 10) {
        console.log(`      ... y ${allTest3.length - 10} más`);
      }
    } else {
      console.log(`❌ Error obteniendo todas las solicitudes: ${allRequestsResponse.status}`);
      const errorText = await allRequestsResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    // 3. Comparar diferencias
    console.log("\n3. Comparando diferencias...");
    
    if (pendingResponse.ok && allRequestsResponse.ok) {
      const pendingRequests = await pendingResponse.json();
      const allRequests = await allRequestsResponse.json();
      
      const pendingIds = new Set(pendingRequests.map(r => r.id));
      const allIds = new Set(allRequests.map(r => r.id));
      
      const onlyInAll = allRequests.filter(r => !pendingIds.has(r.id));
      const onlyInPending = pendingRequests.filter(r => !allIds.has(r.id));
      
      console.log(`📊 Solo en "Todas las solicitudes": ${onlyInAll.length}`);
      onlyInAll.slice(0, 5).forEach(req => {
        console.log(`      ID ${req.id}: ${req.estado} - ${req.motivo || 'Sin motivo'}`);
      });
      
      console.log(`📊 Solo en "Solicitudes pendientes": ${onlyInPending.length}`);
      onlyInPending.forEach(req => {
        console.log(`      ID ${req.id}: ${req.estado} - ${req.motivo || 'Sin motivo'}`);
      });
    }

    // 4. Verificar una solicitud específica donde supervisor ya aprobó
    console.log("\n4. Verificando solicitudes donde supervisor ya aprobó...");
    
    const allRequestsResponse2 = await fetch(`${BASE_URL}/api/requests`);
    if (allRequestsResponse2.ok) {
      const allSystemRequests = await allRequestsResponse2.json();
      
      // Buscar solicitudes con motivo "Ley 20823" que están pendientes
      const pendingTest3Requests = allSystemRequests.filter(r => 
        r.motivo === "Ley 20823" && r.estado === "Pendiente"
      );
      
      console.log(`🔍 Solicitudes pendientes con "Ley 20823" en sistema: ${pendingTest3Requests.length}`);
      
      for (const request of pendingTest3Requests.slice(0, 3)) {
        try {
          const stepsResponse = await fetch(`${BASE_URL}/api/requests/${request.id}/approval-steps`);
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json();
            
            const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
            const adminStep = steps.find(s => s.approvalStep.perfil === '#adminCuenta#');
            
            if (supervisorStep && adminStep) {
              console.log(`   ID ${request.id}:`);
              console.log(`      Supervisor: ${supervisorStep.requestApprovalStep.estado}`);
              console.log(`      AdminCuenta: ${adminStep.requestApprovalStep.estado}`);
              
              // Si supervisor aprobó pero admin está pendiente, esta debería aparecer en "Todas las solicitudes"
              if (supervisorStep.requestApprovalStep.estado === 'Aprobado' && 
                  adminStep.requestApprovalStep.estado === 'Pendiente') {
                console.log(`      ✅ Esta debería aparecer en "Todas las solicitudes" para adminCuenta`);
              }
            }
          }
        } catch (error) {
          console.log(`      ❌ Error verificando pasos de solicitud ${request.id}`);
        }
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 CONCLUSIÓN");
    console.log("=".repeat(70));
    
    console.log("✅ AdminCuenta ahora debería ver en 'Todas las solicitudes':");
    console.log("   - Solicitudes donde está en cualquier paso del flujo");
    console.log("   - Incluso si no es su turno de aprobar");
    console.log("   - Permitiendo visibilidad completa del flujo de trabajo");

  } catch (error) {
    console.error("❌ Error en test de visibilidad:", error);
  }
}

// Ejecutar el test
testAllRequestsVisibility();