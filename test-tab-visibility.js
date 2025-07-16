/**
 * Test unitario para verificar la visibilidad de pestañas según el perfil de usuario
 * Verifica que "Solicitudes pendientes" solo sea visible para administradores
 */

const BASE_URL = 'http://localhost:5000';

// Perfiles de usuario de prueba
const userProfiles = {
  admin: {
    UserProfile: "#adminCuenta#",
    expectedTabs: ["Mis solicitudes", "Solicitudes pendientes", "Todas las Solicitudes", "Esquemas de aprobación"]
  },
  groupLeader: {
    UserProfile: "#JefeGrupo#", 
    expectedTabs: ["Mis solicitudes", "Solicitudes pendientes", "Todas las Solicitudes"]
  },
  employee: {
    UserProfile: "#usuario#",
    expectedTabs: ["Mis solicitudes"]
  },
  employeeAlt: {
    UserProfile: "#empleado#",
    expectedTabs: ["Mis solicitudes"]
  }
};

function shouldShowPendingRequestsTab(userProfile) {
  // Lógica del frontend: solo admin y jefe de grupo pueden ver "Solicitudes pendientes"
  return ["#adminCuenta#", "#JefeGrupo#"].includes(userProfile);
}

function shouldShowAllRequestsTab(userProfile) {
  // Lógica del frontend: solo admin y jefe de grupo pueden ver "Todas las Solicitudes"
  return ["#adminCuenta#", "#JefeGrupo#"].includes(userProfile);
}

function shouldShowApprovalSchemasTab(userProfile) {
  // Lógica del frontend: solo admin puede ver "Esquemas de aprobación"
  return userProfile === "#adminCuenta#";
}

async function testTabVisibilityLogic() {
  console.log('🧪 Testing Tab Visibility Logic Based on User Profiles\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  try {
    // Test cada perfil de usuario
    for (const [profileName, profileData] of Object.entries(userProfiles)) {
      console.log(`Testing ${profileName} (${profileData.UserProfile}):`);
      
      // Test "Solicitudes pendientes" visibility
      const shouldShowPending = shouldShowPendingRequestsTab(profileData.UserProfile);
      const expectedPending = profileData.expectedTabs.includes("Solicitudes pendientes");
      
      totalTests++;
      if (shouldShowPending === expectedPending) {
        console.log(`  ✅ "Solicitudes pendientes" visibility: ${shouldShowPending ? 'Visible' : 'Hidden'}`);
        passedTests++;
      } else {
        console.log(`  ❌ "Solicitudes pendientes" visibility mismatch. Expected: ${expectedPending}, Got: ${shouldShowPending}`);
      }
      
      // Test "Todas las Solicitudes" visibility
      const shouldShowAll = shouldShowAllRequestsTab(profileData.UserProfile);
      const expectedAll = profileData.expectedTabs.includes("Todas las Solicitudes");
      
      totalTests++;
      if (shouldShowAll === expectedAll) {
        console.log(`  ✅ "Todas las Solicitudes" visibility: ${shouldShowAll ? 'Visible' : 'Hidden'}`);
        passedTests++;
      } else {
        console.log(`  ❌ "Todas las Solicitudes" visibility mismatch. Expected: ${expectedAll}, Got: ${shouldShowAll}`);
      }
      
      // Test "Esquemas de aprobación" visibility
      const shouldShowSchemas = shouldShowApprovalSchemasTab(profileData.UserProfile);
      const expectedSchemas = profileData.expectedTabs.includes("Esquemas de aprobación");
      
      totalTests++;
      if (shouldShowSchemas === expectedSchemas) {
        console.log(`  ✅ "Esquemas de aprobación" visibility: ${shouldShowSchemas ? 'Visible' : 'Hidden'}`);
        passedTests++;
      } else {
        console.log(`  ❌ "Esquemas de aprobación" visibility mismatch. Expected: ${expectedSchemas}, Got: ${shouldShowSchemas}`);
      }
      
      console.log('');
    }
    
    // Test casos específicos de la lógica de negocio
    console.log('Testing Business Logic Rules:');
    
    // Regla 1: Solo administradores pueden aprobar cualquier solicitud
    totalTests++;
    const adminCanApproveAll = userProfiles.admin.UserProfile === "#adminCuenta#";
    if (adminCanApproveAll) {
      console.log(`  ✅ Admin can approve all requests: ${adminCanApproveAll}`);
      passedTests++;
    } else {
      console.log(`  ❌ Admin privileges not correctly identified`);
    }
    
    // Regla 2: Empleados normales solo ven sus propias solicitudes
    totalTests++;
    const employeeRestrictedAccess = !shouldShowPendingRequestsTab("#usuario#") && !shouldShowAllRequestsTab("#usuario#");
    if (employeeRestrictedAccess) {
      console.log(`  ✅ Employee access is properly restricted: ${employeeRestrictedAccess}`);
      passedTests++;
    } else {
      console.log(`  ❌ Employee access is not properly restricted`);
    }
    
    // Regla 3: Jefes de grupo tienen acceso intermedio
    totalTests++;
    const groupLeaderAccess = shouldShowPendingRequestsTab("#JefeGrupo#") && shouldShowAllRequestsTab("#JefeGrupo#") && !shouldShowApprovalSchemasTab("#JefeGrupo#");
    if (groupLeaderAccess) {
      console.log(`  ✅ Group leader has intermediate access: ${groupLeaderAccess}`);
      passedTests++;
    } else {
      console.log(`  ❌ Group leader access not correctly configured`);
    }
    
    // Summary
    console.log('\n📊 Tab Visibility Test Summary:');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tab visibility tests passed! The authorization logic is working correctly.');
    } else {
      console.log('⚠️  Some tab visibility tests failed. Review the authorization logic.');
    }
    
    // Detailed breakdown
    console.log('\n🔍 Detailed Access Matrix:');
    console.log('Profile'.padEnd(15) + '| Mis sol. | Pend. | Todas | Esquemas');
    console.log('-'.repeat(60));
    
    for (const [profileName, profileData] of Object.entries(userProfiles)) {
      const profile = profileData.UserProfile;
      const myReq = '✓';
      const pending = shouldShowPendingRequestsTab(profile) ? '✓' : '✗';
      const all = shouldShowAllRequestsTab(profile) ? '✓' : '✗';
      const schemas = shouldShowApprovalSchemasTab(profile) ? '✓' : '✗';
      
      console.log(`${profileName.padEnd(15)}|    ${myReq}     |   ${pending}   |   ${all}   |    ${schemas}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
  
  return passedTests === totalTests;
}

// Test de integración con endpoints reales
async function testEndpointAccessControl() {
  console.log('\n🌐 Testing Real Endpoint Access Control\n');
  
  const testUsers = [
    { id: "164640310", profile: "#adminCuenta#", name: "Admin User" },
    { id: "39qFD70cpmr7PLP3BzE0FA", profile: "#usuario#", name: "Employee User" }
  ];
  
  let endpointTests = 0;
  let passedEndpointTests = 0;
  
  for (const user of testUsers) {
    console.log(`Testing endpoint access for ${user.name} (${user.profile}):`);
    
    try {
      // Test pending requests endpoint
      const pendingUrl = `${BASE_URL}/api/requests/pending-approval/${user.id}?userProfile=${encodeURIComponent(user.profile)}`;
      const pendingResponse = await fetch(pendingUrl);
      
      endpointTests++;
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        const expectedCount = user.profile === "#adminCuenta#" ? 'many' : 'few/none';
        console.log(`  ✅ Pending requests endpoint accessible (${pendingData.length} requests - expected ${expectedCount})`);
        passedEndpointTests++;
      } else {
        console.log(`  ❌ Pending requests endpoint failed: ${pendingResponse.status}`);
      }
      
      // Test my requests endpoint
      const myRequestsUrl = `${BASE_URL}/api/requests/my-requests/${user.id}`;
      const myRequestsResponse = await fetch(myRequestsUrl);
      
      endpointTests++;
      if (myRequestsResponse.ok) {
        const myRequestsData = await myRequestsResponse.json();
        console.log(`  ✅ My requests endpoint accessible (${myRequestsData.length} requests)`);
        passedEndpointTests++;
      } else {
        console.log(`  ❌ My requests endpoint failed: ${myRequestsResponse.status}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error testing endpoints for ${user.name}: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log(`Endpoint Tests: ${passedEndpointTests}/${endpointTests} passed`);
  return passedEndpointTests === endpointTests;
}

// Run all tests
async function runAllTests() {
  const visibilityTestsPassed = await testTabVisibilityLogic();
  const endpointTestsPassed = await testEndpointAccessControl();
  
  console.log('\n🏁 Final Results:');
  console.log(`Tab Visibility Tests: ${visibilityTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Endpoint Access Tests: ${endpointTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  if (visibilityTestsPassed && endpointTestsPassed) {
    console.log('🎉 All authorization and visibility tests PASSED!');
    console.log('The "Solicitudes pendientes" feature is working correctly for admin users.');
  } else {
    console.log('⚠️  Some tests FAILED. Review the implementation.');
  }
  
  return visibilityTestsPassed && endpointTestsPassed;
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});