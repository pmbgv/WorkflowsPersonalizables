/**
 * Test específico para debuggear el flujo secuencial con test3 + Ley 20823
 */

const BASE_URL = 'http://localhost:5000';

async function testSequentialDebug() {
  console.log('🔍 DEBUGGING SEQUENTIAL APPROVAL FLOW\n');
  
  try {
    // 1. Crear solicitud de prueba
    console.log('1. Creating test request with test3 schema and Ley 20823...');
    
    const testRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-08-20",
      fechaFin: "2025-08-20",
      asunto: "Debug Sequential Flow",
      descripcion: "Testing sequential approval with Ley 20823",
      solicitadoPor: "Prueba GC",
      identificador: "20836784",
      usuarioSolicitado: "Prueba GC",
      identificadorUsuario: "20836784",
      motivo: "Ley 20823",
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
    
    // Wait a moment for approval steps to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Verificar que supervisor puede aprobar inicialmente
    console.log('\n2. Testing initial supervisor approval permissions...');
    
    const initialSupervisorTest = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
    if (initialSupervisorTest.ok) {
      const supervisorRequests = await initialSupervisorTest.json();
      const hasNewRequest = supervisorRequests.some(r => r.id === newRequest.id);
      console.log(`Supervisor sees new request: ${hasNewRequest ? '✅ YES' : '❌ NO'}`);
    }
    
    // 3. Verificar que admin NO puede aprobar inicialmente
    console.log('\n3. Testing initial admin approval permissions...');
    
    const initialAdminTest = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
    if (initialAdminTest.ok) {
      const adminRequests = await initialAdminTest.json();
      const hasNewRequest = adminRequests.some(r => r.id === newRequest.id);
      console.log(`Admin sees new request: ${hasNewRequest ? '❌ WRONG' : '✅ CORRECT (should not see)'}`);
    }
    
    // 4. Obtener los pasos de aprobación
    console.log('\n4. Getting approval steps...');
    
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    if (!stepsResponse.ok) {
      throw new Error('Failed to get approval steps');
    }
    
    const steps = await stepsResponse.json();
    console.log(`Approval steps: ${steps.length}`);
    
    let supervisorStepId = null;
    let adminStepId = null;
    
    steps.forEach(step => {
      console.log(`  Step ${step.orden}: ${step.estado} (${step.esObligatorio ? 'Obligatory' : 'Optional'}) - Profiles: ${step.perfiles?.join(', ')}`);
      
      if (step.orden === 1 && step.perfiles?.includes('#supervisor#')) {
        supervisorStepId = step.id;
      }
      if (step.orden === 2 && step.perfiles?.includes('#adminCuenta#')) {
        adminStepId = step.id;
      }
    });
    
    if (!supervisorStepId) {
      throw new Error('Supervisor step not found');
    }
    
    // 5. Supervisor aprueba paso 1
    console.log('\n5. Supervisor approving step 1...');
    
    const approveStep1Response = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${supervisorStepId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "Aprobado",
        userProfile: "#supervisor#",
        comentario: "Approved by supervisor in debug test"
      })
    });
    
    if (!approveStep1Response.ok) {
      throw new Error('Failed to approve step 1');
    }
    
    const step1Result = await approveStep1Response.json();
    console.log(`Step 1 approval result: ${step1Result.requestStatus}`);
    console.log(`Should be "Pendiente": ${step1Result.requestStatus === "Pendiente" ? '✅ CORRECT' : '❌ WRONG'}`);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Verificar que supervisor ya NO puede aprobar
    console.log('\n6. Testing supervisor permissions after step 1...');
    
    const afterStep1SupervisorTest = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
    if (afterStep1SupervisorTest.ok) {
      const supervisorRequests = await afterStep1SupervisorTest.json();
      const hasNewRequest = supervisorRequests.some(r => r.id === newRequest.id);
      console.log(`Supervisor still sees request: ${hasNewRequest ? '❌ WRONG (should not see)' : '✅ CORRECT'}`);
    }
    
    // 7. Verificar que admin AHORA puede aprobar
    console.log('\n7. Testing admin permissions after step 1...');
    
    const afterStep1AdminTest = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
    if (afterStep1AdminTest.ok) {
      const adminRequests = await afterStep1AdminTest.json();
      const hasNewRequest = adminRequests.some(r => r.id === newRequest.id);
      console.log(`Admin now sees request: ${hasNewRequest ? '✅ CORRECT' : '❌ WRONG (should see)'}`);
    }
    
    // 8. Admin aprueba paso 2
    if (adminStepId) {
      console.log('\n8. Admin approving step 2...');
      
      const approveStep2Response = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${adminStepId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "Aprobado",
          userProfile: "#adminCuenta#",
          comentario: "Final approval by admin in debug test"
        })
      });
      
      if (approveStep2Response.ok) {
        const step2Result = await approveStep2Response.json();
        console.log(`Step 2 approval result: ${step2Result.requestStatus}`);
        console.log(`Should be "Aprobado": ${step2Result.requestStatus === "Aprobado" ? '✅ CORRECT' : '❌ WRONG'}`);
      }
    }
    
    console.log('\n📊 SEQUENTIAL FLOW DEBUG COMPLETE');
    return true;
    
  } catch (error) {
    console.error(`Error en debug: ${error.message}`);
    return false;
  }
}

testSequentialDebug().then(success => {
  console.log(`\nDebug de flujo secuencial: ${success ? "COMPLETADO" : "FALLIDO"}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});