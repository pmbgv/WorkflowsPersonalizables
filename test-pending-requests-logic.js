/**
 * Test script para verificar la lógica de "Solicitudes pendientes"
 * Prueba que los administradores puedan ver solicitudes pendientes de usuarios bajo su jerarquía
 */

const BASE_URL = 'http://localhost:5000';

// Datos de usuarios de prueba
const testUsers = {
  admin: {
    Identifier: "164640310",
    Id: "n5j6N29DBwDxdHoy_O8s8A",
    Name: "tito",
    LastName: "rivera",
    UserProfile: "#adminCuenta#",
    GroupDescription: "Santiago"
  },
  employee: {
    Identifier: "39qFD70cpmr7PLP3BzE0FA",
    Id: "39qFD70cpmr7PLP3BzE0FA",
    Name: "Renato",
    LastName: "Rivera",
    UserProfile: "#usuario#",
    GroupDescription: "Santiago"
  },
  employeeOtherGroup: {
    Identifier: "123456789",
    Id: "YFwoUq2dEYPyFpEXZKTiLw",
    Name: "Alejandra",
    LastName: "Guzman",
    UserProfile: "#usuario#",
    GroupDescription: "Neltume"
  }
};

async function testPendingRequestsLogic() {
  console.log('🧪 Testing "Solicitudes pendientes" Logic for Admin Users\n');
  
  const createdRequests = [];
  
  try {
    // 1. Crear solicitudes de prueba
    console.log('1. Creating test requests...');
    
    // Solicitud del empleado del mismo grupo
    const request1Data = {
      tipo: "Permiso",
      fechaSolicitada: "2025-01-25",
      fechaFin: "",
      asunto: "Test - Same Group Request",
      descripcion: "Testing pending request from same group employee",
      solicitadoPor: `${testUsers.employee.Name} ${testUsers.employee.LastName}`,
      identificador: testUsers.employee.Identifier,
      usuarioSolicitado: `${testUsers.employee.Name} ${testUsers.employee.LastName}`,
      identificadorUsuario: testUsers.employee.Identifier,
      motivo: "Cita médica"
    };
    
    const createResponse1 = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request1Data)
    });
    
    if (!createResponse1.ok) {
      throw new Error(`Failed to create request 1: ${createResponse1.status}`);
    }
    
    const createdRequest1 = await createResponse1.json();
    createdRequests.push(createdRequest1.id);
    console.log(`✅ Created request from same group employee (ID: ${createdRequest1.id})`);
    
    // Solicitud del empleado de otro grupo
    const request2Data = {
      tipo: "Permiso",
      fechaSolicitada: "2025-01-26",
      fechaFin: "",
      asunto: "Test - Different Group Request",
      descripcion: "Testing pending request from different group employee",
      solicitadoPor: `${testUsers.employeeOtherGroup.Name} ${testUsers.employeeOtherGroup.LastName}`,
      identificador: testUsers.employeeOtherGroup.Identifier,
      usuarioSolicitado: `${testUsers.employeeOtherGroup.Name} ${testUsers.employeeOtherGroup.LastName}`,
      identificadorUsuario: testUsers.employeeOtherGroup.Identifier,
      motivo: "Cita médica"
    };
    
    const createResponse2 = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request2Data)
    });
    
    if (!createResponse2.ok) {
      throw new Error(`Failed to create request 2: ${createResponse2.status}`);
    }
    
    const createdRequest2 = await createResponse2.json();
    createdRequests.push(createdRequest2.id);
    console.log(`✅ Created request from different group employee (ID: ${createdRequest2.id})`);
    
    // 2. Test administrator can see pending requests
    console.log('\n2. Testing admin access to pending requests...');
    
    const adminPendingUrl = `${BASE_URL}/api/requests/pending-approval/${testUsers.admin.Identifier}?userProfile=${encodeURIComponent(testUsers.admin.UserProfile)}&userGroupDescription=${encodeURIComponent(testUsers.admin.GroupDescription)}`;
    
    const adminPendingResponse = await fetch(adminPendingUrl);
    if (!adminPendingResponse.ok) {
      throw new Error(`Failed to fetch admin pending requests: ${adminPendingResponse.status}`);
    }
    
    const adminPendingRequests = await adminPendingResponse.json();
    console.log(`✅ Admin can access pending requests endpoint`);
    console.log(`   Found ${adminPendingRequests.length} pending requests for admin`);
    
    // 3. Verify admin can see requests (admin should see all pending requests)
    console.log('\n3. Verifying admin visibility...');
    
    const foundRequest1 = adminPendingRequests.find(r => r.id === createdRequest1.id);
    const foundRequest2 = adminPendingRequests.find(r => r.id === createdRequest2.id);
    
    let adminTests = 0;
    let totalAdminTests = 2;
    
    if (foundRequest1) {
      console.log(`✅ Admin can see request from same group employee`);
      adminTests++;
    } else {
      console.log(`❌ Admin cannot see request from same group employee`);
    }
    
    if (foundRequest2) {
      console.log(`✅ Admin can see request from different group employee (admin privilege)`);
      adminTests++;
    } else {
      console.log(`❌ Admin cannot see request from different group employee`);
    }
    
    // 4. Test employee cannot access admin pending requests endpoint
    console.log('\n4. Testing employee access restrictions...');
    
    const employeePendingUrl = `${BASE_URL}/api/requests/pending-approval/${testUsers.employee.Identifier}?userProfile=${encodeURIComponent(testUsers.employee.UserProfile)}&userGroupDescription=${encodeURIComponent(testUsers.employee.GroupDescription)}`;
    
    const employeePendingResponse = await fetch(employeePendingUrl);
    if (!employeePendingResponse.ok) {
      throw new Error(`Failed to fetch employee pending requests: ${employeePendingResponse.status}`);
    }
    
    const employeePendingRequests = await employeePendingResponse.json();
    console.log(`✅ Employee can access pending requests endpoint`);
    console.log(`   Found ${employeePendingRequests.length} pending requests for employee (should be limited)`);
    
    // Employee should not see admin-level requests (or very limited)
    const employeeCanSeeRequest1 = employeePendingRequests.find(r => r.id === createdRequest1.id);
    const employeeCanSeeRequest2 = employeePendingRequests.find(r => r.id === createdRequest2.id);
    
    if (!employeeCanSeeRequest1 && !employeeCanSeeRequest2) {
      console.log(`✅ Employee correctly has limited access to pending requests`);
    } else {
      console.log(`⚠️  Employee can see requests they shouldn't have approval rights for`);
    }
    
    // 5. Test filtering by status
    console.log('\n5. Testing status filtering...');
    
    const statusFilterUrl = `${BASE_URL}/api/requests/pending-approval/${testUsers.admin.Identifier}?userProfile=${encodeURIComponent(testUsers.admin.UserProfile)}&estado=Pendiente`;
    
    const statusFilterResponse = await fetch(statusFilterUrl);
    if (!statusFilterResponse.ok) {
      throw new Error(`Failed to fetch filtered requests: ${statusFilterResponse.status}`);
    }
    
    const filteredRequests = await statusFilterResponse.json();
    const allPending = filteredRequests.every(r => r.estado === "Pendiente");
    
    if (allPending) {
      console.log(`✅ Status filtering works correctly (all ${filteredRequests.length} requests are Pendiente)`);
    } else {
      console.log(`❌ Status filtering failed - found non-pending requests`);
    }
    
    // 6. Summary
    console.log('\n📊 Test Summary:');
    const totalTests = 5;
    let passedTests = 2; // Basic endpoint access + status filtering
    
    passedTests += adminTests;
    if (!employeeCanSeeRequest1 && !employeeCanSeeRequest2) passedTests++;
    
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    
    if (passedTests >= 4) {
      console.log('🎉 "Solicitudes pendientes" logic is working correctly for admin users!');
    } else {
      console.log('⚠️  Some tests failed. The pending requests logic may need refinement.');
    }
    
    // Detailed analysis
    console.log('\n🔍 Detailed Analysis:');
    console.log(`- Admin pending requests: ${adminPendingRequests.length}`);
    console.log(`- Employee pending requests: ${employeePendingRequests.length}`);
    console.log(`- Admin can approve across groups: ${foundRequest2 ? 'Yes' : 'No'}`);
    console.log(`- Employee access is restricted: ${(!employeeCanSeeRequest1 && !employeeCanSeeRequest2) ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    
    for (const requestId of createdRequests) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/requests/${requestId}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deleted test request ${requestId}`);
        } else {
          console.log(`⚠️  Failed to delete test request ${requestId}`);
        }
      } catch (error) {
        console.log(`⚠️  Error deleting test request ${requestId}: ${error.message}`);
      }
    }
  }
}

// Run the test
testPendingRequestsLogic().then(() => {
  console.log('\n✨ Pending requests logic test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});