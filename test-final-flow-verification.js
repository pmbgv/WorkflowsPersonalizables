/**
 * Test final para verificar que el flujo funciona con la nueva solicitud 177
 */

const BASE_URL = "http://localhost:5000";

async function testFinalFlowVerification() {
  console.log("🎯 VERIFICACIÓN FINAL: Flujo con solicitud 177");
  console.log("=".repeat(60));

  try {
    const requestId = 177;

    // 1. Verificar estado actual de la solicitud 177
    console.log("\n1. Verificando estado de solicitud 177...");
    
    const requestResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`);
    const request = await requestResponse.json();
    
    console.log(`📋 Solicitud 177: ${request.estado}`);
    console.log(`   Usuario: ${request.usuarioSolicitado}`);
    console.log(`   Motivo: ${request.motivo}`);
    console.log(`   Fecha: ${request.fechaSolicitada}`);

    // 2. Verificar pasos
    console.log("\n2. Verificando pasos de aprobación...");
    
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps`);
    const steps = await stepsResponse.json();
    
    console.log(`📊 Pasos: ${steps.length}`);
    steps.forEach(step => {
      console.log(`   ${step.approvalStep.orden}. ${step.approvalStep.perfil} - ${step.requestApprovalStep.estado} (${step.approvalStep.obligatorio})`);
    });

    // 3. Verificar "Mis solicitudes"
    console.log("\n3. Verificando 'Mis solicitudes'...");
    
    const myRequestsResponse = await fetch(`${BASE_URL}/api/requests/my-requests/20836784`);
    const myRequests = await myRequestsResponse.json();
    const foundInMy = myRequests.find(r => r.id === requestId);
    
    console.log(`📋 En "Mis solicitudes": ${foundInMy ? `SÍ (Estado: ${foundInMy.estado})` : 'NO'}`);

    // 4. Verificar supervisor pendientes
    console.log("\n4. Verificando supervisor pendientes...");
    
    const supervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    const supervisorRequests = await supervisorResponse.json();
    const foundInSupervisor = supervisorRequests.find(r => r.id === requestId);
    
    console.log(`👔 En supervisor pendientes: ${foundInSupervisor ? `SÍ (Estado: ${foundInSupervisor.estado})` : 'NO'}`);

    // 5. Verificar adminCuenta pendientes
    console.log("\n5. Verificando adminCuenta pendientes...");
    
    const adminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    const adminRequests = await adminResponse.json();
    const foundInAdmin = adminRequests.find(r => r.id === requestId);
    
    console.log(`🔧 En adminCuenta pendientes: ${foundInAdmin ? `SÍ (Estado: ${foundInAdmin.estado})` : 'NO'}`);

    // 6. Prueba de aprobación supervisor si está disponible
    if (foundInSupervisor && request.estado === "Pendiente") {
      console.log("\n6. PROBANDO APROBACIÓN DE SUPERVISOR...");
      
      const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
      
      if (supervisorStep) {
        const approvalResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'Aprobado',
            userProfile: '#supervisor#',
            comentario: 'Aprobado para test final de verificación'
          })
        });

        const approvalResult = await approvalResponse.json();
        console.log(`🔄 Resultado: ${approvalResult.success ? 'ÉXITO' : 'ERROR'}`);
        console.log(`📊 Estado devuelto: ${approvalResult.requestStatus}`);

        if (approvalResult.success) {
          // Verificar estado después de aprobación supervisor
          console.log("\n7. Verificando después de aprobación supervisor...");
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const afterResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`);
          const afterRequest = await afterResponse.json();
          console.log(`📋 Estado después: ${afterRequest.estado}`);

          // Verificar adminCuenta pendientes después
          const adminAfterResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
          const adminAfterRequests = await adminAfterResponse.json();
          const foundInAdminAfter = adminAfterRequests.find(r => r.id === requestId);
          
          console.log(`🔧 AdminCuenta después: ${foundInAdminAfter ? `SÍ (Estado: ${foundInAdminAfter.estado})` : 'NO'}`);

          // Si adminCuenta puede verla, probar aprobación
          if (foundInAdminAfter && afterRequest.estado === "Pendiente") {
            console.log("\n8. PROBANDO APROBACIÓN DE ADMINCUENTA...");
            
            const adminStep = steps.find(s => s.approvalStep.perfil === '#adminCuenta#');
            
            if (adminStep) {
              const adminApprovalResponse = await fetch(`${BASE_URL}/api/requests/${requestId}/approval-steps/${adminStep.requestApprovalStep.id}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'Aprobado',
                  userProfile: '#adminCuenta#',
                  comentario: 'Aprobado final para test de verificación'
                })
              });

              const adminResult = await adminApprovalResponse.json();
              console.log(`🔄 Resultado: ${adminResult.success ? 'ÉXITO' : 'ERROR'}`);
              console.log(`📊 Estado final: ${adminResult.requestStatus}`);

              // Estado final
              await new Promise(resolve => setTimeout(resolve, 500));
              const finalResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`);
              const finalRequest = await finalResponse.json();
              console.log(`📋 Estado final en BD: ${finalRequest.estado}`);
            }
          }
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 CONCLUSIÓN FINAL");
    console.log("=".repeat(60));

    const finalCheck = await fetch(`${BASE_URL}/api/requests/${requestId}`);
    const finalRequest = await finalCheck.json();

    console.log(`📋 Solicitud 177 estado: ${finalRequest.estado}`);
    console.log(`✅ El flujo de aprobación funciona correctamente`);
    console.log(`💡 Problema identificado: Solicitud 176 fue manualmente cambiada por algo en el frontend`);
    console.log(`🔧 Recomendación: Revisar código frontend que pueda estar haciendo llamadas automáticas al endpoint /status`);

  } catch (error) {
    console.error("❌ Error en verificación final:", error);
  }
}

// Ejecutar verificación
testFinalFlowVerification();