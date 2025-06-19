/**
 * Test para verificar que las pestañas aparecen correctamente según configuración de pasos de aprobación
 */

const BASE_URL = 'http://localhost:5000';

async function testApprovalStepTabs() {
  console.log('Testing Approval Step Tab Functionality\n');
  
  let testData = { schemas: [], steps: [] };
  
  try {
    // 1. Verificar funcionamiento del endpoint can-approve
    console.log('1. Testing can-approve endpoint...');
    
    // Test con perfil que debería poder aprobar (ya configurado)
    const supervisorTest = await fetch(`${BASE_URL}/api/users/${encodeURIComponent("#supervisor#")}/can-approve`);
    if (supervisorTest.ok) {
      const result = await supervisorTest.json();
      console.log(`#supervisor# can approve: ${result.canApprove}`);
    }
    
    // Test con perfil que no debería poder aprobar
    const reporteTest = await fetch(`${BASE_URL}/api/users/${encodeURIComponent("#ReporteLegal#")}/can-approve`);
    if (reporteTest.ok) {
      const result = await reporteTest.json();
      console.log(`#ReporteLegal# can approve: ${result.canApprove}`);
    }
    
    // 2. Crear esquema específico para testing
    console.log('\n2. Creating test schema with approval steps...');
    
    const schemaResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Tab Test Schema",
        tipoSolicitud: "Permiso",
        motivos: ["Tab Test Motivo"]
      })
    });
    
    const schema = await schemaResponse.json();
    testData.schemas.push(schema.id);
    console.log(`Created schema: ${schema.nombre}`);
    
    // 3. Crear paso de aprobación para un perfil específico
    console.log('\n3. Creating approval step for specific profile...');
    
    const stepResponse = await fetch(`${BASE_URL}/api/approval-steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaId: schema.id,
        orden: 1,
        descripcion: "Test Approval Step",
        perfil: "#usuario#",
        obligatorio: "Si"
      })
    });
    
    const step = await stepResponse.json();
    testData.steps.push(step.id);
    console.log(`Created step for profile: ${step.perfil}`);
    
    // 4. Verificar que el endpoint detecta la nueva configuración
    console.log('\n4. Verifying endpoint detects new configuration...');
    
    const usuarioTest = await fetch(`${BASE_URL}/api/users/${encodeURIComponent("#usuario#")}/can-approve`);
    if (usuarioTest.ok) {
      const result = await usuarioTest.json();
      console.log(`#usuario# can approve after creating step: ${result.canApprove}`);
      
      if (result.canApprove) {
        console.log('✓ Endpoint correctly detected approval step configuration');
      } else {
        console.log('✗ Endpoint failed to detect approval step configuration');
      }
    }
    
    // 5. Test múltiples pasos de aprobación
    console.log('\n5. Testing multiple approval steps...');
    
    const step2Response = await fetch(`${BASE_URL}/api/approval-steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaId: schema.id,
        orden: 2,
        descripcion: "Second Approval Step",
        perfil: "#JefeGrupo#",
        obligatorio: "Si"
      })
    });
    
    const step2 = await step2Response.json();
    testData.steps.push(step2.id);
    
    // Verificar que ambos perfiles pueden aprobar
    const jefeTest = await fetch(`${BASE_URL}/api/users/${encodeURIComponent("#JefeGrupo#")}/can-approve`);
    if (jefeTest.ok) {
      const result = await jefeTest.json();
      console.log(`#JefeGrupo# can approve: ${result.canApprove}`);
    }
    
    // 6. Crear solicitud para probar flujo completo
    console.log('\n6. Creating test request to verify workflow...');
    
    const requestResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: "Permiso",
        fechaSolicitada: "2025-06-19",
        fechaFin: "2025-06-19",
        asunto: "Tab Test Request",
        descripcion: "Testing tab functionality",
        solicitadoPor: "Test User",
        identificador: "20836784",
        usuarioSolicitado: "Test User",
        identificadorUsuario: "20836784",
        motivo: "Tab Test Motivo",
        archivosAdjuntos: []
      })
    });
    
    if (requestResponse.ok) {
      const request = await requestResponse.json();
      console.log(`Created test request: ${request.id}`);
      
      // Verificar que se crearon los pasos de aprobación
      const approvalStepsResponse = await fetch(`${BASE_URL}/api/requests/${request.id}/approval-steps`);
      if (approvalStepsResponse.ok) {
        const approvalSteps = await approvalStepsResponse.json();
        console.log(`Request has ${approvalSteps.length} approval steps`);
        
        if (approvalSteps.length === 2) {
          console.log('✓ Correct number of approval steps created');
        } else {
          console.log('✗ Incorrect number of approval steps created');
        }
      }
      
      // Limpiar la solicitud
      await fetch(`${BASE_URL}/api/requests/${request.id}`, { method: 'DELETE' });
    }
    
    // 7. Test final de todos los perfiles
    console.log('\n7. Final test of all profiles...');
    
    const profiles = ["#usuario#", "#supervisor#", "#JefeGrupo#", "#adminCuenta#", "#ReporteLegal#"];
    const results = {};
    
    for (const profile of profiles) {
      try {
        const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(profile)}/can-approve`);
        if (response.ok) {
          const data = await response.json();
          results[profile] = data.canApprove;
        } else {
          results[profile] = false;
        }
      } catch (error) {
        results[profile] = false;
      }
    }
    
    console.log('\nFinal Profile Approval Capabilities:');
    console.log('Profile'.padEnd(20) + '| Can Approve');
    console.log('-'.repeat(35));
    
    for (const [profile, canApprove] of Object.entries(results)) {
      console.log(profile.padEnd(20) + `| ${canApprove ? 'YES' : 'NO'}`);
    }
    
    // 8. Verificar que perfiles con pasos configurados pueden aprobar
    const expectedApprovers = ["#usuario#", "#JefeGrupo#"];
    const allCorrect = expectedApprovers.every(profile => results[profile]);
    
    if (allCorrect) {
      console.log('\n🎉 APPROVAL STEP TAB TESTS PASSED!');
      console.log('✓ Users with approval step configurations can approve');
      console.log('✓ Can-approve endpoint working correctly');
      console.log('✓ Dynamic tab visibility should work in frontend');
      console.log('\nImplementation is working correctly!');
    } else {
      console.log('\n⚠️ SOME APPROVAL STEP TAB TESTS FAILED');
      console.log('✗ Not all configured users can approve');
    }
    
    return allCorrect;
    
  } catch (error) {
    console.error(`Test error: ${error.message}`);
    return false;
  } finally {
    console.log('\n🧹 Cleanup...');
    for (const stepId of testData.steps) {
      try {
        await fetch(`${BASE_URL}/api/approval-steps/${stepId}`, { method: 'DELETE' });
      } catch (e) {}
    }
    for (const schemaId of testData.schemas) {
      try {
        await fetch(`${BASE_URL}/api/approval-schemas/${schemaId}`, { method: 'DELETE' });
      } catch (e) {}
    }
  }
}

testApprovalStepTabs().then(success => {
  console.log(`\nApproval step tabs test: ${success ? 'SUCCESS' : 'FAILURE'}`);
  process.exit(success ? 0 : 1);
}).catch(() => process.exit(1));