/**
 * Comprehensive test for approval schema workflow
 * Tests the complete flow: create request -> generate approval steps -> filter by user profile
 */

const BASE_URL = 'http://localhost:5000';

async function testCompleteApprovalFlow() {
  console.log('Testing Complete Approval Schema Workflow\n');
  
  const createdRequests = [];
  
  try {
    // 1. Create a test request for Capacitación (should use "capas" schema)
    console.log('1. Creating Capacitación request...');
    const capacitacionRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-02-10",
      fechaFin: "",
      asunto: "Test Approval Flow - Capacitación",
      descripcion: "Testing complete approval workflow",
      solicitadoPor: "Test User",
      identificador: "TEST_USER",
      usuarioSolicitado: "Test User",
      identificadorUsuario: "TEST_USER",
      motivo: "Capacitación"
    };
    
    const response = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capacitacionRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create request: ${response.status}`);
    }
    
    const createdRequest = await response.json();
    createdRequests.push(createdRequest.id);
    console.log(`✅ Created request ID: ${createdRequest.id}`);
    
    // Wait for approval steps to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 2. Verify approval steps were created
    console.log('\n2. Checking approval steps...');
    
    // Query the database to see what approval steps were created
    const stepsQuery = `
      SELECT r.id as request_id, r.motivo, 
             ras.estado as step_estado, 
             ast.perfil, ast.orden, ast.descripcion
      FROM requests r 
      LEFT JOIN request_approval_steps ras ON r.id = ras.request_id 
      LEFT JOIN approval_steps ast ON ras.approval_step_id = ast.id 
      WHERE r.id = ${createdRequest.id}
      ORDER BY ast.orden;
    `;
    
    // Since we can't directly query from the test, let's check by calling the pending requests endpoint
    
    // 3. Test with "Seleccionar" profile (should see the request)
    console.log('\n3. Testing with "Seleccionar" profile...');
    const selectorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/TEST_SELECTOR?userProfile=Seleccionar`);
    
    let selectorRequests = [];
    if (selectorResponse.ok) {
      selectorRequests = await selectorResponse.json();
      const foundRequest = selectorRequests.find(r => r.id === createdRequest.id);
      
      if (foundRequest) {
        console.log('✅ "Seleccionar" user can see the request (correct!)');
      } else {
        console.log('❌ "Seleccionar" user cannot see the request');
      }
    } else {
      console.log(`❌ Error fetching for Seleccionar: ${selectorResponse.status}`);
    }
    
    // 4. Test with wrong profile (should NOT see the request)
    console.log('\n4. Testing with wrong profile...');
    const wrongProfileResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/TEST_WRONG?userProfile=%23usuario%23`);
    
    let wrongProfileRequests = [];
    if (wrongProfileResponse.ok) {
      wrongProfileRequests = await wrongProfileResponse.json();
      const foundRequest = wrongProfileRequests.find(r => r.id === createdRequest.id);
      
      if (!foundRequest) {
        console.log('✅ Wrong profile user cannot see the request (correct!)');
      } else {
        console.log('❌ Wrong profile user can incorrectly see the request');
      }
    } else {
      console.log(`❌ Error fetching for wrong profile: ${wrongProfileResponse.status}`);
    }
    
    // 5. Test with admin profile (should see the request)
    console.log('\n5. Testing with admin profile...');
    const adminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/164640310?userProfile=%23adminCuenta%23`);
    
    let adminRequests = [];
    if (adminResponse.ok) {
      adminRequests = await adminResponse.json();
      const foundRequest = adminRequests.find(r => r.id === createdRequest.id);
      
      if (foundRequest) {
        console.log('✅ Admin user can see the request (admin override works!)');
      } else {
        console.log('❌ Admin user cannot see the request');
      }
    } else {
      console.log(`❌ Error fetching for admin: ${adminResponse.status}`);
    }
    
    // 6. Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`- Seleccionar profile requests: ${selectorRequests.length}`);
    console.log(`- Wrong profile requests: ${wrongProfileRequests.length}`);
    console.log(`- Admin profile requests: ${adminRequests.length}`);
    
    const selectorCanSee = selectorRequests.find(r => r.id === createdRequest.id);
    const wrongProfileCanSee = wrongProfileRequests.find(r => r.id === createdRequest.id);
    const adminCanSee = adminRequests.find(r => r.id === createdRequest.id);
    
    console.log('\n🔍 Detailed Analysis:');
    console.log(`- Request visible to Seleccionar: ${!!selectorCanSee}`);
    console.log(`- Request visible to wrong profile: ${!!wrongProfileCanSee}`);
    console.log(`- Request visible to admin: ${!!adminCanSee}`);
    
    // Check if approval schema logic is working
    const schemaLogicWorking = selectorCanSee && !wrongProfileCanSee && adminCanSee;
    
    if (schemaLogicWorking) {
      console.log('\n🎉 Approval schema logic is working correctly!');
      console.log('   - Requests only appear for users whose profile matches next approval step');
      console.log('   - Admin override functionality works');
      console.log('   - Profile-based filtering is effective');
    } else {
      console.log('\n⚠️  Approval schema logic needs refinement');
      if (!selectorCanSee) console.log('   - Issue: Seleccionar profile should see the request');
      if (wrongProfileCanSee) console.log('   - Issue: Wrong profile should not see the request');
      if (!adminCanSee) console.log('   - Issue: Admin should always see requests');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    for (const requestId of createdRequests) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`, {
          method: 'DELETE'
        });
        if (deleteResponse.ok) {
          console.log(`✅ Deleted request ${requestId}`);
        }
      } catch (error) {
        console.log(`⚠️  Failed to delete request ${requestId}`);
      }
    }
  }
}

testCompleteApprovalFlow().then(() => {
  console.log('\n✨ Complete approval flow test finished');
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
});