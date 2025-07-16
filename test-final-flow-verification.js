/**
 * Test final para verificar que el flujo funciona con la nueva solicitud 182
 */

const BASE_URL = "http://localhost:5000";

async function testFinalFlowVerification() {
  console.log("🔬 VERIFICACIÓN FINAL: Estado de solicitud 182");
  console.log("=".repeat(60));

  try {
    // Verificar solicitud 182 que acabamos de crear
    const requestId = 182;
    
    console.log("\n1. 📋 Verificando estado actual en BD...");
    const requestResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`);
    if (requestResponse.ok) {
      const request = await requestResponse.json();
      console.log(`   Estado: ${request.estado}`);
      console.log(`   Motivo: ${request.motivo}`);
      console.log(`   Usuario: ${request.usuarioSolicitado}`);
    }

    console.log("\n2. 🔍 Verificando pasos de aprobación actuales...");
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps`);
    if (stepsResponse.ok) {
      const steps = await stepsResponse.json();
      console.log(`   Total pasos: ${steps.length}`);
      
      steps.forEach((stepData, index) => {
        const step = stepData.requestApprovalStep;
        const config = stepData.approvalStep;
        console.log(`   Paso ${index + 1}: ${config.perfil} - ${step.estado} (${config.obligatorio})`);
      });
    }

    console.log("\n3. 🔍 Verificando visibilidad para adminCuenta...");
    
    // Solicitudes pendientes (solo las que puede aprobar ahora)
    const pendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    if (pendingResponse.ok) {
      const pendingRequests = await pendingResponse.json();
      const foundInPending = pendingRequests.find(r => r.id === requestId);
      console.log(`   En "Solicitudes pendientes": ${foundInPending ? `SÍ (${foundInPending.estado})` : 'NO'}`);
    }

    // Todas las solicitudes (todas donde tiene rol en flujo)
    const allResponse = await fetch(`${BASE_URL}/api/requests/all-requests/${encodeURIComponent('#adminCuenta#')}`);
    if (allResponse.ok) {
      const allRequests = await allResponse.json();
      const foundInAll = allRequests.find(r => r.id === requestId);
      console.log(`   En "Todas las solicitudes": ${foundInAll ? `SÍ (${foundInAll.estado})` : 'NO'}`);
    }

    console.log("\n4. 🔍 Verificando otras solicitudes con estado 'Aprobado'...");
    
    // Buscar solicitudes aprobadas para ver si son casos diferentes
    if (allResponse.ok) {
      const allRequests = await allResponse.json();
      const approvedRequests = allRequests.filter(r => r.estado === "Aprobado" && r.motivo === "Ley 20823");
      
      console.log(`   Solicitudes "Aprobado" con motivo "Ley 20823": ${approvedRequests.length}`);
      
      for (const req of approvedRequests.slice(0, 3)) {
        console.log(`\n   📋 Analizando solicitud ${req.id}:`);
        
        const stepsCheck = await fetch(`${BASE_URL}/api/requests/${req.id}/approval-steps`);
        if (stepsCheck.ok) {
          const stepsData = await stepsCheck.json();
          
          const supervisorStep = stepsData.find(s => s.approvalStep.perfil === '#supervisor#');
          const adminStep = stepsData.find(s => s.approvalStep.perfil === '#adminCuenta#');
          
          if (supervisorStep && adminStep) {
            console.log(`      Supervisor: ${supervisorStep.requestApprovalStep.estado}`);
            console.log(`      AdminCuenta: ${adminStep.requestApprovalStep.estado}`);
            
            // Verificar si realmente ambos están aprobados
            if (supervisorStep.requestApprovalStep.estado === 'Aprobado' && 
                adminStep.requestApprovalStep.estado === 'Aprobado') {
              console.log(`      ✅ Correctamente aprobada (ambos pasos completados)`);
            } else if (supervisorStep.requestApprovalStep.estado === 'Aprobado' && 
                       adminStep.requestApprovalStep.estado === 'Pendiente') {
              console.log(`      ⚠️  PROBLEMA: Estado "Aprobado" pero adminCuenta pendiente`);
            }
          }
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 DIAGNÓSTICO");
    console.log("=".repeat(60));
    console.log("Si ves solicitudes con estado 'Aprobado' donde adminCuenta");
    console.log("está pendiente, esas son las problemáticas.");
    console.log("");
    console.log("Si todas las 'Aprobado' tienen ambos pasos completados,");
    console.log("entonces el sistema está funcionando correctamente.");

  } catch (error) {
    console.error("❌ Error en verificación final:", error);
  }
}

// Ejecutar el test
testFinalFlowVerification();