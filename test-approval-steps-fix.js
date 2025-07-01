/**
 * Test que los approval steps ahora devuelven los datos correctos
 */

const BASE_URL = 'http://localhost:5000';

async function testApprovalStepsFix() {
  console.log('🧪 TESTING APPROVAL STEPS FIX\n');
  
  // Get latest request
  const requestsResponse = await fetch(`${BASE_URL}/api/requests`);
  const requests = await requestsResponse.json();
  const latestRequest = requests[0];
  
  if (!latestRequest) {
    console.log('❌ No requests found');
    return;
  }
  
  console.log(`Testing request ${latestRequest.id} - ${latestRequest.motivo}`);
  
  // Get approval steps
  const stepsResponse = await fetch(`${BASE_URL}/api/requests/${latestRequest.id}/approval-steps`);
  const steps = await stepsResponse.json();
  
  console.log(`\nApproval steps (${steps.length}):`);
  steps.forEach(step => {
    console.log(`  Step ${step.id}:`);
    console.log(`    - Order: ${step.orden} (should not be undefined)`);
    console.log(`    - Profile: ${step.perfil} (should not be undefined)`);
    console.log(`    - Estado: ${step.estado}`);
    console.log(`    - Obligatorio: ${step.obligatorio} (should not be undefined)`);
  });
  
  // Test sequential logic
  console.log('\n=== Testing sequential logic ===');
  
  const firstStep = steps.find(s => s.orden === 1);
  if (firstStep) {
    console.log(`First step requires profile: ${firstStep.perfil}`);
    console.log(`First step is pending: ${firstStep.estado === 'Pendiente'}`);
    
    if (firstStep.perfil === '#supervisor#' && firstStep.estado === 'Pendiente') {
      console.log('✅ Supervisor should see this request in pending');
    } else {
      console.log('❌ Supervisor should NOT see this request in pending');
    }
  }
  
  // Test supervisor pending requests
  console.log('\n=== Testing supervisor view ===');
  
  const supervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
  if (supervisorResponse.ok) {
    const supervisorRequests = await supervisorResponse.json();
    const seesLatest = supervisorRequests.some(r => r.id === latestRequest.id);
    console.log(`Supervisor sees ${supervisorRequests.length} requests`);
    console.log(`Supervisor sees latest request: ${seesLatest}`);
    
    if (seesLatest && firstStep?.perfil === '#supervisor#') {
      console.log('✅ Sequential flow working correctly');
    } else {
      console.log('❌ Sequential flow still has issues');
    }
  }
  
  console.log('\n✅ Test complete!');
}

testApprovalStepsFix().catch(console.error);