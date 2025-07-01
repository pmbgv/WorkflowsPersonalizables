/**
 * Test to debug approval step progression issue
 * Checks the current state of requests and their approval steps
 */

const BASE_URL = "http://localhost:5000";

async function debugApprovalSteps() {
  console.log("🔍 Testing approval step progression debugging...\n");

  try {
    // 1. Get all requests to see current state (using supervisor profile)
    console.log("1. Fetching all requests...");
    const allRequestsResponse = await fetch(`${BASE_URL}/api/requests/all-requests/${encodeURIComponent("#supervisor#")}`);
    if (!allRequestsResponse.ok) {
      throw new Error(`Failed to fetch all requests: ${allRequestsResponse.status}`);
    }
    
    const allRequests = await allRequestsResponse.json();
    console.log(`Found ${allRequests.length} total requests`);
    
    // Find a pending request for testing
    const pendingRequests = allRequests.filter(r => r.estado === "Pendiente");
    console.log(`Found ${pendingRequests.length} pending requests`);
    
    if (pendingRequests.length === 0) {
      console.log("❌ No pending requests found for testing");
      return;
    }
    
    const testRequest = pendingRequests[0];
    console.log(`\n2. Testing with request ID ${testRequest.id}:`);
    console.log(`   - Tipo: ${testRequest.tipo}`);
    console.log(`   - Motivo: ${testRequest.motivo}`);
    console.log(`   - Estado: ${testRequest.estado}`);
    console.log(`   - Solicitado por: ${testRequest.solicitadoPor}`);
    
    // 2. Get approval steps for this request
    console.log(`\n3. Fetching approval steps for request ${testRequest.id}...`);
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${testRequest.id}/approval-steps`);
    if (!stepsResponse.ok) {
      throw new Error(`Failed to fetch approval steps: ${stepsResponse.status}`);
    }
    
    const approvalSteps = await stepsResponse.json();
    console.log(`Found ${approvalSteps.length} approval steps:`);
    
    approvalSteps.forEach((step, index) => {
      console.log(`   Step ${index + 1}:`);
      console.log(`     - Orden: ${step.orden}`);
      console.log(`     - Perfil: ${step.perfil}`);
      console.log(`     - Obligatorio: ${step.obligatorio}`);
      console.log(`     - Estado: ${step.estado}`);
      console.log(`     - Aprobado por: ${step.aprobadoPor || 'N/A'}`);
      console.log(`     - Fecha aprobación: ${step.fechaAprobacion || 'N/A'}`);
      console.log(`     - Comentario: ${step.comentario || 'N/A'}`);
    });
    
    // 3. Test pending requests for supervisor
    console.log(`\n4. Testing pending requests for #supervisor#...`);
    const supervisorPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent("#supervisor#")}`);
    if (!supervisorPendingResponse.ok) {
      throw new Error(`Failed to fetch supervisor pending requests: ${supervisorPendingResponse.status}`);
    }
    
    const supervisorPending = await supervisorPendingResponse.json();
    console.log(`Supervisor sees ${supervisorPending.length} pending requests`);
    
    const supervisorCanSeeTestRequest = supervisorPending.find(r => r.id === testRequest.id);
    if (supervisorCanSeeTestRequest) {
      console.log(`✅ Supervisor CAN see test request ${testRequest.id}`);
    } else {
      console.log(`❌ Supervisor CANNOT see test request ${testRequest.id}`);
    }
    
    // 4. Test pending requests for adminCuenta
    console.log(`\n5. Testing pending requests for #adminCuenta#...`);
    const adminPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent("#adminCuenta#")}`);
    if (!adminPendingResponse.ok) {
      throw new Error(`Failed to fetch admin pending requests: ${adminPendingResponse.status}`);
    }
    
    const adminPending = await adminPendingResponse.json();
    console.log(`Admin sees ${adminPending.length} pending requests`);
    
    const adminCanSeeTestRequest = adminPending.find(r => r.id === testRequest.id);
    if (adminCanSeeTestRequest) {
      console.log(`✅ Admin CAN see test request ${testRequest.id}`);
    } else {
      console.log(`❌ Admin CANNOT see test request ${testRequest.id}`);
    }
    
    // 5. Analyze why admin can't see the request
    console.log(`\n6. Analyzing why admin might not see the request...`);
    
    const pendingSteps = approvalSteps.filter(step => step.estado === "Pendiente");
    console.log(`Request has ${pendingSteps.length} pending steps:`);
    
    pendingSteps.forEach((step, index) => {
      console.log(`   Pending Step ${index + 1}:`);
      console.log(`     - Orden: ${step.orden}`);
      console.log(`     - Perfil: ${step.perfil}`);
      console.log(`     - Obligatorio: ${step.obligatorio}`);
      
      if (step.perfil === "#adminCuenta#") {
        console.log(`     ✅ This step matches admin profile`);
      } else {
        console.log(`     ❌ This step does NOT match admin profile (needs ${step.perfil})`);
      }
    });
    
    // 6. Check the logic for sequential approval
    console.log(`\n7. Checking sequential approval logic...`);
    
    const obligatorySteps = approvalSteps.filter(step => step.obligatorio === "Si");
    const optionalSteps = approvalSteps.filter(step => step.obligatorio === "No");
    
    console.log(`Total steps: ${approvalSteps.length}`);
    console.log(`Obligatory steps: ${obligatorySteps.length}`);
    console.log(`Optional steps: ${optionalSteps.length}`);
    
    if (obligatorySteps.length > 0) {
      console.log(`\nObligatory steps analysis:`);
      obligatorySteps.forEach((step, index) => {
        console.log(`   Step ${step.orden} (${step.perfil}): ${step.estado}`);
        
        if (step.estado === "Pendiente") {
          // Check if previous obligatory steps are completed
          const previousObligatory = obligatorySteps.filter(s => s.orden < step.orden);
          const allPreviousCompleted = previousObligatory.every(s => s.estado === "Aprobado");
          
          console.log(`     Previous obligatory steps completed: ${allPreviousCompleted}`);
          
          if (allPreviousCompleted) {
            console.log(`     ✅ This step is ready for approval`);
            if (step.perfil === "#adminCuenta#") {
              console.log(`     ✅ Admin should be able to approve this step`);
            } else {
              console.log(`     ❌ Admin cannot approve this step (needs ${step.perfil})`);
            }
          } else {
            console.log(`     ⏸️ This step is waiting for previous steps`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error("❌ Error during debugging:", error);
  }
}

// Run the test
debugApprovalSteps().then(() => {
  console.log("\n✅ Debugging completed");
}).catch(error => {
  console.error("❌ Test failed:", error);
});