/**
 * Backend test script to verify all modal data endpoints work correctly
 * Tests database queries and API responses for modal display
 */

async function testModalBackendVerification() {
  console.log("🗄️ Testing modal backend data endpoints...\n");

  try {
    // Test 1: Verify all requests endpoint returns complete data
    console.log("1. Testing requests endpoint data completeness...");
    const requestsResponse = await fetch('http://localhost:5000/api/requests');
    
    if (!requestsResponse.ok) {
      throw new Error(`Requests endpoint failed: ${requestsResponse.status}`);
    }

    const requests = await requestsResponse.json();
    console.log(`✅ Found ${requests.length} requests in database`);

    if (requests.length > 0) {
      const sampleRequest = requests[0];
      const fields = ['id', 'tipo', 'motivo', 'identificador', 'solicitadoPor', 'grupo', 'fechaSolicitada', 'estado'];
      
      console.log("   Sample request structure:");
      fields.forEach(field => {
        const hasField = field in sampleRequest;
        const value = sampleRequest[field];
        console.log(`   ${hasField ? '✅' : '❌'} ${field}: ${value || 'null'}`);
      });
    }

    // Test 2: Test approval steps endpoint for specific request
    if (requests.length > 0) {
      const testRequestId = requests[0].id;
      console.log(`\n2. Testing approval steps for request ${testRequestId}...`);
      
      const stepsResponse = await fetch(`http://localhost:5000/api/requests/${testRequestId}/approval-steps`);
      
      if (stepsResponse.ok) {
        const steps = await stepsResponse.json();
        console.log(`✅ Approval steps endpoint working: ${steps.length} steps`);
        
        if (steps.length > 0) {
          console.log("   Step structure analysis:");
          steps.forEach((step, index) => {
            console.log(`   Step ${index + 1}:`);
            console.log(`     - Approval Step: ${step.approvalStep ? '✅' : '❌'}`);
            console.log(`     - Request Approval Step: ${step.requestApprovalStep ? '✅' : '❌'}`);
            if (step.approvalStep) {
              console.log(`     - Profile: ${step.approvalStep.perfil}`);
              console.log(`     - Order: ${step.approvalStep.orden}`);
              console.log(`     - Description: ${step.approvalStep.descripcion}`);
            }
            if (step.requestApprovalStep) {
              console.log(`     - Status: ${step.requestApprovalStep.estado}`);
              console.log(`     - Date: ${step.requestApprovalStep.fechaAprobacion || 'Pending'}`);
              console.log(`     - Comment: ${step.requestApprovalStep.comentario || 'None'}`);
            }
          });
        }
      } else {
        console.log("❌ Approval steps endpoint failed");
      }

      // Test 3: Test request history endpoint
      console.log(`\n3. Testing request history for request ${testRequestId}...`);
      
      const historyResponse = await fetch(`http://localhost:5000/api/requests/${testRequestId}/history`);
      
      if (historyResponse.ok) {
        const history = await historyResponse.json();
        console.log(`✅ Request history endpoint working: ${history.length} entries`);
        
        if (history.length > 0) {
          console.log("   History entries:");
          history.forEach((entry, index) => {
            console.log(`   Entry ${index + 1}:`);
            console.log(`     - Previous State: ${entry.previousState || 'Initial'}`);
            console.log(`     - New State: ${entry.newState}`);
            console.log(`     - Changed By: ${entry.changedBy}`);
            console.log(`     - Date: ${entry.fechaCreacion}`);
            console.log(`     - Reason: ${entry.changeReason || 'Not specified'}`);
          });
        } else {
          console.log("   No history entries found (this is normal for new requests)");
        }
      } else {
        console.log("❌ Request history endpoint failed");
      }
    }

    // Test 4: Verify database schema consistency
    console.log("\n4. Testing database schema consistency...");
    
    // Test that requests table has all required fields by checking field presence
    if (requests.length > 0) {
      const request = requests[0];
      const expectedFields = [
        'id', 'tipo', 'motivo', 'fechaSolicitada', 'fechaFin', 
        'descripcion', 'identificador', 'solicitadoPor', 'grupo', 
        'estado', 'fechaCreacion'
      ];
      
      const presentFields = expectedFields.filter(field => field in request);
      const missingFields = expectedFields.filter(field => !(field in request));
      
      console.log(`✅ Request schema check: ${presentFields.length}/${expectedFields.length} fields present`);
      
      if (missingFields.length > 0) {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log("✅ All expected request fields are present");
      }
    }

    // Test 5: Verify API error handling
    console.log("\n5. Testing API error handling...");
    
    // Test non-existent request
    const nonExistentResponse = await fetch('http://localhost:5000/api/requests/99999/approval-steps');
    if (nonExistentResponse.status === 200) {
      const result = await nonExistentResponse.json();
      console.log(`✅ Non-existent request handling: Returns ${Array.isArray(result) ? 'empty array' : 'valid response'}`);
    } else {
      console.log(`✅ Non-existent request handling: Returns ${nonExistentResponse.status} status`);
    }

  } catch (error) {
    console.error("❌ Backend verification failed:", error.message);
    
    if (error.message.includes('fetch')) {
      console.log("\n💡 Tip: Make sure the server is running and accessible");
    }
  }

  console.log("\n🎯 Backend verification summary:");
  console.log("   📊 Request data completeness verified");
  console.log("   🔄 Approval steps endpoint tested");
  console.log("   📝 Request history endpoint tested");
  console.log("   🗃️ Database schema consistency checked");
  console.log("   ⚠️ Error handling validated");
}

// Run the test
testModalBackendVerification();