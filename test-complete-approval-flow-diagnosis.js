/**
 * Test completo para diagnosticar el flujo de aprobación de dos pasos
 * Supervisor → AdminCuenta 
 * Motivo: Ley 20823
 * Esquema: test3
 */

const BASE_URL = "http://localhost:5000";

// Función para formatear fechas localmente
function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function testCompleteApprovalFlowDiagnosis() {
  console.log("🔍 TEST: Diagnóstico completo del flujo de aprobación de dos pasos");
  console.log("=".repeat(80));

  try {
    // 1. Crear una nueva solicitud de prueba con test3 / Ley 20823
    console.log("\n1. Creando solicitud de prueba...");
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const requestDate = formatDateToLocal(tomorrow);
    
    const newRequestData = {
      tipo: "Permiso",
      fechaSolicitada: requestDate,
      fechaFin: requestDate,
      asunto: "Test flujo dos pasos supervisor→adminCuenta",
      descripcion: "Prueba de diagnóstico completo",
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
      throw new Error(`Error creando solicitud: ${createResponse.status}`);
    }

    const newRequest = await createResponse.json();
    console.log(`✅ Solicitud creada: ID ${newRequest.id}, Estado: ${newRequest.estado}`);

    // 2. Verificar configuración inicial de pasos de aprobación
    console.log("\n2. Verificando configuración de pasos de aprobación...");
    
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    const steps = await stepsResponse.json();
    
    console.log(`📊 Pasos configurados: ${steps.length}`);
    steps.forEach((step, i) => {
      console.log(`   Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden}) - ${step.requestApprovalStep.estado} - ${step.approvalStep.obligatorio === 'Si' ? 'OBLIGATORIO' : 'OPCIONAL'}`);
    });

    // Verificar que tenemos exactamente 2 pasos obligatorios
    const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
    if (obligatorySteps.length !== 2) {
      throw new Error(`Error: Expected 2 obligatory steps, found ${obligatorySteps.length}`);
    }

    const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
    const adminCuentaStep = steps.find(s => s.approvalStep.perfil === '#adminCuenta#');

    if (!supervisorStep || !adminCuentaStep) {
      throw new Error("Error: No se encontraron los pasos de supervisor y adminCuenta");
    }

    console.log(`✅ Configuración correcta: supervisor (orden ${supervisorStep.approvalStep.orden}) → adminCuenta (orden ${adminCuentaStep.approvalStep.orden})`);

    // 3. Verificar estado inicial en "Mis solicitudes"
    console.log("\n3. Verificando visibilidad inicial en 'Mis solicitudes'...");
    
    const myRequestsResponse = await fetch(`${BASE_URL}/api/requests/my-requests/20836784`);
    const myRequests = await myRequestsResponse.json();
    const foundInMy = myRequests.find(r => r.id === newRequest.id);
    
    console.log(`📋 "Mis solicitudes": ${foundInMy ? `VISIBLE - Estado: ${foundInMy.estado}` : 'NO VISIBLE'}`);

    // 4. Verificar visibilidad inicial para supervisor
    console.log("\n4. Verificando visibilidad inicial para supervisor...");
    
    const supervisorPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    const supervisorRequests = await supervisorPendingResponse.json();
    const foundInSupervisor = supervisorRequests.find(r => r.id === newRequest.id);
    
    console.log(`👔 Supervisor "Solicitudes pendientes": ${foundInSupervisor ? `VISIBLE - Estado: ${foundInSupervisor.estado}` : 'NO VISIBLE'}`);

    // 5. Verificar visibilidad inicial para adminCuenta
    console.log("\n5. Verificando visibilidad inicial para adminCuenta...");
    
    const adminPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    const adminRequests = await adminPendingResponse.json();
    const foundInAdmin = adminRequests.find(r => r.id === newRequest.id);
    
    console.log(`🔧 AdminCuenta "Solicitudes pendientes": ${foundInAdmin ? `VISIBLE - Estado: ${foundInAdmin.estado}` : 'NO VISIBLE'}`);

    // 6. SUPERVISOR APRUEBA PASO 1
    console.log("\n6. SUPERVISOR APRUEBA PASO 1...");
    console.log("-".repeat(50));
    
    const supervisorApprovalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Aprobado',
        userProfile: '#supervisor#',
        comentario: 'Aprobado por supervisor - test diagnóstico'
      })
    });

    const supervisorResult = await supervisorApprovalResponse.json();
    console.log(`🔄 Resultado aprobación supervisor: ${supervisorResult.success ? 'ÉXITO' : 'ERROR'}`);
    console.log(`📊 Estado devuelto: ${supervisorResult.requestStatus}`);
    console.log(`💬 Mensaje: ${supervisorResult.message}`);

    // 7. Verificar estado en BD después del paso 1
    console.log("\n7. Verificando estado en BD después del paso 1...");
    
    const afterStep1Response = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    const afterStep1 = await afterStep1Response.json();
    console.log(`📋 Estado en BD: ${afterStep1.estado}`);

    // Verificar pasos actualizados
    const updatedStepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    const updatedSteps = await updatedStepsResponse.json();
    
    console.log(`📊 Estados de pasos actualizados:`);
    updatedSteps.forEach((step, i) => {
      console.log(`   Paso ${i+1}: ${step.approvalStep.perfil} - ${step.requestApprovalStep.estado} ${step.requestApprovalStep.fechaAprobacion ? `(${new Date(step.requestApprovalStep.fechaAprobacion).toLocaleString()})` : ''}`);
    });

    // 8. Verificar "Mis solicitudes" después del paso 1
    console.log("\n8. Verificando 'Mis solicitudes' después del paso 1...");
    
    const myRequestsAfterStep1Response = await fetch(`${BASE_URL}/api/requests/my-requests/20836784`);
    const myRequestsAfterStep1 = await myRequestsAfterStep1Response.json();
    const foundInMyAfterStep1 = myRequestsAfterStep1.find(r => r.id === newRequest.id);
    
    console.log(`📋 "Mis solicitudes": ${foundInMyAfterStep1 ? `VISIBLE - Estado: ${foundInMyAfterStep1.estado}` : 'NO VISIBLE'}`);

    // 9. Verificar supervisor después del paso 1 (no debería ver la solicitud)
    console.log("\n9. Verificando supervisor después del paso 1...");
    
    const supervisorAfterStep1Response = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    const supervisorAfterStep1 = await supervisorAfterStep1Response.json();
    const foundInSupervisorAfterStep1 = supervisorAfterStep1.find(r => r.id === newRequest.id);
    
    console.log(`👔 Supervisor "Solicitudes pendientes": ${foundInSupervisorAfterStep1 ? `VISIBLE - Estado: ${foundInSupervisorAfterStep1.estado}` : 'NO VISIBLE'}`);

    // 10. Verificar adminCuenta después del paso 1 (DEBERÍA ver la solicitud)
    console.log("\n10. Verificando adminCuenta después del paso 1...");
    
    const adminAfterStep1Response = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    const adminAfterStep1 = await adminAfterStep1Response.json();
    const foundInAdminAfterStep1 = adminAfterStep1.find(r => r.id === newRequest.id);
    
    console.log(`🔧 AdminCuenta "Solicitudes pendientes": ${foundInAdminAfterStep1 ? `VISIBLE - Estado: ${foundInAdminAfterStep1.estado}` : 'NO VISIBLE'}`);

    // 11. ADMINCUENTA APRUEBA PASO 2
    console.log("\n11. ADMINCUENTA APRUEBA PASO 2...");
    console.log("-".repeat(50));
    
    const adminApprovalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${adminCuentaStep.requestApprovalStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Aprobado',
        userProfile: '#adminCuenta#',
        comentario: 'Aprobado por adminCuenta - test diagnóstico'
      })
    });

    const adminResult = await adminApprovalResponse.json();
    console.log(`🔄 Resultado aprobación adminCuenta: ${adminResult.success ? 'ÉXITO' : 'ERROR'}`);
    console.log(`📊 Estado devuelto: ${adminResult.requestStatus}`);
    console.log(`💬 Mensaje: ${adminResult.message}`);

    // 12. Verificar estado final
    console.log("\n12. Verificando estado final...");
    
    const finalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    const finalRequest = await finalResponse.json();
    console.log(`📋 Estado final en BD: ${finalRequest.estado}`);

    const finalStepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    const finalSteps = await finalStepsResponse.json();
    
    console.log(`📊 Estados finales de pasos:`);
    finalSteps.forEach((step, i) => {
      console.log(`   Paso ${i+1}: ${step.approvalStep.perfil} - ${step.requestApprovalStep.estado} ${step.requestApprovalStep.fechaAprobacion ? `(${new Date(step.requestApprovalStep.fechaAprobacion).toLocaleString()})` : ''}`);
    });

    // 13. Verificar "Mis solicitudes" final
    console.log("\n13. Verificando 'Mis solicitudes' final...");
    
    const myRequestsFinalResponse = await fetch(`${BASE_URL}/api/requests/my-requests/20836784`);
    const myRequestsFinal = await myRequestsFinalResponse.json();
    const foundInMyFinal = myRequestsFinal.find(r => r.id === newRequest.id);
    
    console.log(`📋 "Mis solicitudes": ${foundInMyFinal ? `VISIBLE - Estado: ${foundInMyFinal.estado}` : 'NO VISIBLE'}`);

    // 14. Resumen del diagnóstico
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL DIAGNÓSTICO");
    console.log("=".repeat(80));
    
    const expectedResults = [
      { step: "Solicitud creada", expected: "Estado Pendiente", actual: newRequest.estado, passed: newRequest.estado === "Pendiente" },
      { step: "Pasos configurados", expected: "2 pasos obligatorios", actual: `${obligatorySteps.length} pasos`, passed: obligatorySteps.length === 2 },
      { step: "Inicial - Mis solicitudes", expected: "Visible", actual: foundInMy ? "Visible" : "No visible", passed: !!foundInMy },
      { step: "Inicial - Supervisor pendientes", expected: "Visible", actual: foundInSupervisor ? "Visible" : "No visible", passed: !!foundInSupervisor },
      { step: "Inicial - AdminCuenta pendientes", expected: "No visible", actual: foundInAdmin ? "Visible" : "No visible", passed: !foundInAdmin },
      { step: "Aprobación supervisor", expected: "Éxito", actual: supervisorResult.success ? "Éxito" : "Error", passed: supervisorResult.success },
      { step: "Estado después paso 1", expected: "Pendiente", actual: afterStep1.estado, passed: afterStep1.estado === "Pendiente" },
      { step: "Paso 1 - Mis solicitudes", expected: "Visible", actual: foundInMyAfterStep1 ? "Visible" : "No visible", passed: !!foundInMyAfterStep1 },
      { step: "Paso 1 - Supervisor pendientes", expected: "No visible", actual: foundInSupervisorAfterStep1 ? "Visible" : "No visible", passed: !foundInSupervisorAfterStep1 },
      { step: "Paso 1 - AdminCuenta pendientes", expected: "Visible", actual: foundInAdminAfterStep1 ? "Visible" : "No visible", passed: !!foundInAdminAfterStep1 },
      { step: "Aprobación adminCuenta", expected: "Éxito", actual: adminResult.success ? "Éxito" : "Error", passed: adminResult.success },
      { step: "Estado final", expected: "Aprobado", actual: finalRequest.estado, passed: finalRequest.estado === "Aprobado" },
      { step: "Final - Mis solicitudes", expected: "Visible", actual: foundInMyFinal ? "Visible" : "No visible", passed: !!foundInMyFinal }
    ];

    console.log("\nResultados:");
    expectedResults.forEach((result, i) => {
      const icon = result.passed ? "✅" : "❌";
      console.log(`${icon} ${String(i + 1).padStart(2, '0')}. ${result.step}: ${result.actual} ${result.passed ? '' : `(esperado: ${result.expected})`}`);
    });

    const passedTests = expectedResults.filter(r => r.passed).length;
    const totalTests = expectedResults.length;
    
    console.log(`\n📊 RESULTADO: ${passedTests}/${totalTests} pruebas pasaron`);
    
    if (passedTests === totalTests) {
      console.log("🎉 ¡FLUJO FUNCIONANDO CORRECTAMENTE!");
    } else {
      console.log("🚨 HAY PROBLEMAS EN EL FLUJO");
      const failedTests = expectedResults.filter(r => !r.passed);
      console.log("\nPruebas fallidas:");
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.step}: obtuvo "${test.actual}", esperaba "${test.expected}"`);
      });
    }

  } catch (error) {
    console.error("❌ Error en el test de diagnóstico:", error);
  }
}

// Ejecutar el test
testCompleteApprovalFlowDiagnosis();