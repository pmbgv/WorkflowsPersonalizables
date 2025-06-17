/**
 * Test script to verify the complete request creation and "Mis solicitudes" flow
 * This tests the bug fix for requests not appearing in user's own requests
 */

const BASE_URL = 'http://localhost:5000';

async function testRequestFlow() {
  console.log('🧪 Testing Request Creation and "Mis solicitudes" Flow\n');
  
  // Test user data
  const testUser = {
    Identifier: "164640310",
    Id: "n5j6N29DBwDxdHoy_O8s8A",
    Name: "tito",
    LastName: "rivera"
  };
  
  try {
    // 1. Test creating a request
    console.log('1. Creating test request...');
    const requestData = {
      tipo: "Permiso",
      fechaSolicitada: "2025-01-19",
      fechaFin: "",
      asunto: "Test Flow - Frontend Fix",
      descripcion: "Testing complete flow after bug fix",
      solicitadoPor: `${testUser.Name} ${testUser.LastName}`,
      identificador: testUser.Identifier,
      usuarioSolicitado: `${testUser.Name} ${testUser.LastName}`,
      identificadorUsuario: testUser.Identifier,
      motivo: "Cita médica"
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create request: ${createResponse.status}`);
    }
    
    const createdRequest = await createResponse.json();
    console.log(`✅ Request created with ID: ${createdRequest.id}`);
    
    // 2. Test fetching user's requests using Identifier
    console.log('\n2. Testing "Mis solicitudes" with Identifier...');
    const myRequestsResponse = await fetch(`${BASE_URL}/api/requests/my-requests/${testUser.Identifier}`);
    
    if (!myRequestsResponse.ok) {
      throw new Error(`Failed to fetch user requests: ${myRequestsResponse.status}`);
    }
    
    const userRequests = await myRequestsResponse.json();
    const foundRequest = userRequests.find(r => r.id === createdRequest.id);
    
    if (foundRequest) {
      console.log(`✅ Request found in "Mis solicitudes" using Identifier`);
    } else {
      console.log(`❌ Request NOT found in "Mis solicitudes" using Identifier`);
      console.log(`   Expected ID: ${createdRequest.id}`);
      console.log(`   Found IDs: ${userRequests.map(r => r.id).join(', ')}`);
    }
    
    // 3. Test fetching user's requests using Id (fallback)
    console.log('\n3. Testing "Mis solicitudes" with Id fallback...');
    const myRequestsIdResponse = await fetch(`${BASE_URL}/api/requests/my-requests/${testUser.Id}`);
    
    if (!myRequestsIdResponse.ok) {
      throw new Error(`Failed to fetch user requests with Id: ${myRequestsIdResponse.status}`);
    }
    
    const userRequestsById = await myRequestsIdResponse.json();
    const foundRequestById = userRequestsById.find(r => r.id === createdRequest.id);
    
    if (foundRequestById) {
      console.log(`✅ Request found in "Mis solicitudes" using Id fallback`);
    } else {
      console.log(`❌ Request NOT found in "Mis solicitudes" using Id fallback`);
    }
    
    // 4. Test request data integrity
    console.log('\n4. Validating request data integrity...');
    const checks = [
      { field: 'identificador', expected: testUser.Identifier, actual: createdRequest.identificador },
      { field: 'identificadorUsuario', expected: testUser.Identifier, actual: createdRequest.identificadorUsuario },
      { field: 'usuarioSolicitado', expected: `${testUser.Name} ${testUser.LastName}`, actual: createdRequest.usuarioSolicitado },
      { field: 'solicitadoPor', expected: `${testUser.Name} ${testUser.LastName}`, actual: createdRequest.solicitadoPor }
    ];
    
    let allChecksPass = true;
    checks.forEach(check => {
      if (check.actual === check.expected) {
        console.log(`✅ ${check.field}: "${check.actual}"`);
      } else {
        console.log(`❌ ${check.field}: Expected "${check.expected}", got "${check.actual}"`);
        allChecksPass = false;
      }
    });
    
    // 5. Summary
    console.log('\n📊 Test Summary:');
    const totalTests = 4;
    let passedTests = 1; // Request creation
    
    if (foundRequest) passedTests++;
    if (foundRequestById) passedTests++;
    if (allChecksPass) passedTests++;
    
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! The "Mis solicitudes" bug has been fixed.');
    } else {
      console.log('⚠️  Some tests failed. The bug may still exist.');
    }
    
    // Clean up - delete test request
    console.log('\n🧹 Cleaning up test data...');
    const deleteResponse = await fetch(`${BASE_URL}/api/requests/${createdRequest.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test request deleted successfully');
    } else {
      console.log('⚠️  Failed to delete test request - manual cleanup may be needed');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
testRequestFlow().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
});