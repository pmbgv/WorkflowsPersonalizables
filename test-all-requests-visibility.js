/**
 * Test para verificar que perfiles configurados en approval steps tengan acceso a "Todas las solicitudes"
 */

const BASE_URL = 'http://localhost:5000';

async function testAllRequestsVisibility() {
  console.log('🔍 ALL REQUESTS VISIBILITY TEST\n');
  
  const testProfiles = [
    { profile: "#supervisor#", shouldHaveAccess: true, reason: "configured in approval steps" },
    { profile: "#adminCuenta#", shouldHaveAccess: true, reason: "admin always has access" },
    { profile: "#JefeGrupo#", shouldHaveAccess: true, reason: "jefe grupo always has access" },
    { profile: "#usuario#", shouldHaveAccess: false, reason: "not configured in approval steps" },
    { profile: "#empleado#", shouldHaveAccess: false, reason: "not configured in approval steps" }
  ];
  
  console.log('Testing "can-view-all-requests" endpoint for each profile:\n');
  
  let passed = 0;
  let total = testProfiles.length;
  
  for (const test of testProfiles) {
    try {
      const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(test.profile)}/can-view-all-requests`);
      
      if (!response.ok) {
        console.log(`❌ ${test.profile}: API error ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const hasAccess = data.canViewAllRequests;
      
      if (hasAccess === test.shouldHaveAccess) {
        console.log(`✅ ${test.profile}: ${hasAccess ? 'HAS' : 'NO'} access (${test.reason})`);
        passed++;
      } else {
        console.log(`❌ ${test.profile}: Expected ${test.shouldHaveAccess ? 'HAS' : 'NO'} access, got ${hasAccess ? 'HAS' : 'NO'} access`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.profile}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All visibility tests passed! Profile-based access is working correctly.');
  } else {
    console.log('⚠️ Some visibility tests failed. Check the access logic.');
  }
  
  return passed === total;
}

testAllRequestsVisibility().then(success => {
  console.log(`\nAll requests visibility test: ${success ? "✅ SUCCESS" : "❌ FAILED"}`);
  process.exit(success ? 0 : 1);
});