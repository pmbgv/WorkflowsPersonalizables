/**
 * Test de integridad para asegurar que el flujo secuencial funciona correctamente
 * Este test valida que no se rompa la funcionalidad existente
 */

const BASE_URL = 'http://localhost:5000';

async function testSequentialIntegrity() {
  console.log('🔍 SEQUENTIAL INTEGRITY TEST\n');
  
  try {
    console.log('=== STEP 1: Creating new test request ===');
    
    const testRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-09-15",
      fechaFin: "2025-09-15",
      asunto: "Sequential Integrity Test",
      descripcion: "Testing that new requests follow sequential flow",
      solicitadoPor: "Prueba GC",
      identificador: "20836784",
      usuarioSolicitado: "Prueba GC",
      identificadorUsuario: "20836784",
      motivo: "Ley 20823", // test3 schema: supervisor → adminCuenta
      archivosAdjuntos: []
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create request: ${createResponse.status}`);
    }
    
    const newRequest = await createResponse.json();
    console.log(`✅ Created request ID: ${newRequest.id}`);
    console.log(`   State: ${newRequest.estado}`);
    
    // Wait for approval steps creation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n=== STEP 2: Verifying initial approval step visibility ===');
    
    // Check supervisor can see the new request
    const supervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
    const supervisorRequests = await supervisorResponse.json();
    const supervisorCanSee = supervisorRequests.some(r => r.id === newRequest.id);
    console.log(`   Supervisor sees new request: ${supervisorCanSee ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Check admin cannot see the new request initially
    const adminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
    const adminRequests = await adminResponse.json();
    const adminCanSee = adminRequests.some(r => r.id === newRequest.id);
    console.log(`   Admin sees new request: ${adminCanSee ? '❌ WRONG (should not see initially)' : '✅ CORRECT'}`);
    
    console.log('\n=== STEP 3: Verifying "Todas las solicitudes" visibility ===');
    
    // Both supervisor and admin should see it in "all requests" because they are configured in approval steps
    const allRequestsResponse = await fetch(`${BASE_URL}/api/requests`);
    const allRequests = await allRequestsResponse.json();
    const requestInAllRequests = allRequests.some(r => r.id === newRequest.id);
    console.log(`   Request appears in all requests: ${requestInAllRequests ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n=== STEP 4: Testing supervisor approval ===');
    
    if (!supervisorCanSee) {
      console.log('❌ Cannot test supervisor approval - supervisor cannot see request');
      return false;
    }
    
    // Get approval steps
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    const steps = await stepsResponse.json();
    console.log(`   Found ${steps.length} approval steps`);
    
    // Find supervisor step (should be the first one in order)
    const supervisorStep = steps.find(s => s.approvalStepId === 58); // ID 58 is supervisor
    
    if (!supervisorStep) {
      console.log('❌ Cannot find supervisor step');
      return false;
    }
    
    console.log(`   Supervisor step ID: ${supervisorStep.id}`);
    
    // Supervisor approves
    const approvalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${supervisorStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "Aprobado",
        userProfile: "#supervisor#",
        comentario: "Approved by supervisor in integrity test"
      })
    });
    
    if (!approvalResponse.ok) {
      const errorText = await approvalResponse.text();
      console.log(`❌ Supervisor approval failed: ${approvalResponse.status} - ${errorText}`);
      return false;
    }
    
    const approvalResult = await approvalResponse.json();
    console.log(`   Approval result: ${approvalResult.requestStatus}`);
    console.log(`   Should stay "Pendiente": ${approvalResult.requestStatus === "Pendiente" ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n=== STEP 5: Verifying post-approval visibility ===');
    
    // Now supervisor should NOT see it
    const postSupervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
    const postSupervisorRequests = await postSupervisorResponse.json();
    const supervisorCanSeeAfter = postSupervisorRequests.some(r => r.id === newRequest.id);
    console.log(`   Supervisor sees request after approval: ${supervisorCanSeeAfter ? '❌ WRONG (should not see)' : '✅ CORRECT'}`);
    
    // Now admin SHOULD see it
    const postAdminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
    const postAdminRequests = await postAdminResponse.json();
    const adminCanSeeAfter = postAdminRequests.some(r => r.id === newRequest.id);
    console.log(`   Admin sees request after step 1: ${adminCanSeeAfter ? '✅ CORRECT (should see now)' : '❌ WRONG'}`);
    
    console.log('\n=== STEP 6: Testing final admin approval ===');
    
    if (!adminCanSeeAfter) {
      console.log('❌ Cannot test admin approval - admin cannot see request');
      return false;
    }
    
    // Find admin step
    const adminStep = steps.find(s => s.approvalStepId === 92); // ID 92 is adminCuenta
    
    if (!adminStep) {
      console.log('❌ Cannot find admin step');
      return false;
    }
    
    // Admin approves final step
    const finalApprovalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${adminStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "Aprobado",
        userProfile: "#adminCuenta#",
        comentario: "Final approval by admin in integrity test"
      })
    });
    
    if (!finalApprovalResponse.ok) {
      const errorText = await finalApprovalResponse.text();
      console.log(`❌ Admin approval failed: ${finalApprovalResponse.status} - ${errorText}`);
      return false;
    }
    
    const finalResult = await finalApprovalResponse.json();
    console.log(`   Final approval result: ${finalResult.requestStatus}`);
    console.log(`   Should be "Aprobado": ${finalResult.requestStatus === "Aprobado" ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Wait for final processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n=== STEP 7: Verifying final state ===');
    
    // Check final request state
    const finalRequestResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    const finalRequest = await finalRequestResponse.json();
    console.log(`   Final request state: ${finalRequest.estado}`);
    console.log(`   Should be "Aprobado": ${finalRequest.estado === "Aprobado" ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Neither supervisor nor admin should see it in pending requests
    const finalSupervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
    const finalSupervisorRequests = await finalSupervisorResponse.json();
    const supervisorSeesInFinal = finalSupervisorRequests.some(r => r.id === newRequest.id);
    console.log(`   Supervisor sees in pending (should not): ${supervisorSeesInFinal ? '❌ WRONG' : '✅ CORRECT'}`);
    
    const finalAdminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
    const finalAdminRequests = await finalAdminResponse.json();
    const adminSeesInFinal = finalAdminRequests.some(r => r.id === newRequest.id);
    console.log(`   Admin sees in pending (should not): ${adminSeesInFinal ? '❌ WRONG' : '✅ CORRECT'}`);
    
    console.log('\n🎉 SEQUENTIAL INTEGRITY TEST RESULTS:');
    const passed = supervisorCanSee && !adminCanSee && !supervisorCanSeeAfter && 
                   adminCanSeeAfter && finalResult.requestStatus === "Aprobado" && 
                   finalRequest.estado === "Aprobado" && !supervisorSeesInFinal && 
                   !adminSeesInFinal;
    
    console.log(`   Overall result: ${passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return passed;
    
  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    return false;
  }
}

testSequentialIntegrity().then(success => {
  console.log(`\nSequential integrity test: ${success ? "✅ SUCCESS" : "❌ FAILED"}`);
  process.exit(success ? 0 : 1);
});