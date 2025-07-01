/**
 * Test solo los endpoints sin lógica compleja
 */

const BASE_URL = 'http://localhost:5000';

async function testEndpointsOnly() {
  console.log('🧪 TESTING ENDPOINTS ONLY\n');
  
  // Test can-view-all-requests
  console.log('=== Testing can-view-all-requests ===');
  try {
    const response = await fetch(`${BASE_URL}/api/users/%23supervisor%23/can-view-all-requests`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Supervisor can-view-all-requests: ${data.canViewAllRequests}`);
    } else {
      console.log(`❌ Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
  
  // Test approval steps for latest request
  console.log('\n=== Testing approval steps endpoint ===');
  try {
    const requestsResponse = await fetch(`${BASE_URL}/api/requests`);
    const requests = await requestsResponse.json();
    const latestRequest = requests[0];
    
    if (latestRequest) {
      const stepsResponse = await fetch(`${BASE_URL}/api/requests/${latestRequest.id}/approval-steps`);
      if (stepsResponse.ok) {
        const steps = await stepsResponse.json();
        console.log(`✅ Got ${steps.length} approval steps`);
        
        if (steps.length > 0 && steps[0].perfil !== undefined) {
          console.log(`✅ Steps have profile data: ${steps[0].perfil}`);
        } else {
          console.log(`❌ Steps missing profile data`);
        }
      } else {
        console.log(`❌ Steps endpoint error: ${stepsResponse.status}`);
      }
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
  
  console.log('\n✅ Endpoint test complete!');
}

testEndpointsOnly().catch(console.error);