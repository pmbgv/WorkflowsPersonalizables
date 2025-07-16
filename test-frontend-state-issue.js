/**
 * Test para identificar el problema de sincronización frontend-backend
 * El backend está correcto pero el frontend muestra estado incorrecto
 */

async function testFrontendStateIssue() {
  console.log('🔍 Test: Investigando problema de estado en frontend');
  console.log('='.repeat(65));

  try {
    // 1. Crear nueva solicitud
    console.log('\n1. Creando nueva solicitud...');
    const newRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-27",
      fechaFin: "2025-07-27", 
      asunto: "Test Frontend State",
      descripcion: "Investigando problema frontend",
      solicitadoPor: "Frontend Test User",
      usuarioSolicitado: "Frontend Test User",
      identificador: "FRONTEND123",
      identificadorUsuario: "FRONTEND123",
      motivo: "Ley 20823",
      archivosAdjuntos: []
    };

    const response = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });
    const request = await response.json();
    console.log(`   ✅ Solicitud creada: ID ${request.id}`);

    // 2. Verificar estado inicial
    console.log('\n2. Estado inicial de la solicitud...');
    const initialRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
    console.log(`   📋 Estado en backend: ${initialRequest.estado}`);

    // 3. Verificar visibilidad en "Mis solicitudes" del usuario creador  
    console.log('\n3. Verificando "Mis solicitudes" del usuario creador...');
    // Simulamos el ID del usuario que creó la solicitud
    const userRequestsResponse = await fetch(`http://localhost:5000/api/requests/my-requests/FRONTEND123`);
    const userRequests = await userRequestsResponse.json();
    
    const myRequest = userRequests.find(r => r.id === request.id);
    if (myRequest) {
      console.log(`   📋 Estado en "Mis solicitudes": ${myRequest.estado}`);
      console.log(`   🔍 Comparación: Backend=${initialRequest.estado}, MisSolicitudes=${myRequest.estado}`);
    } else {
      console.log('   ❌ Solicitud no aparece en "Mis solicitudes"');
    }

    // 4. Supervisor aprueba el primer paso
    console.log('\n4. Supervisor aprueba primer paso...');
    const stepsResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`);
    const steps = await stepsResponse.json();
    
    const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
    const approvalResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Aprobado',
        userProfile: '#supervisor#',
        comentario: 'Primer paso aprobado'
      })
    });
    const approvalResult = await approvalResponse.json();
    console.log(`   🔄 Resultado aprobación: ${approvalResult.success ? 'ÉXITO' : 'ERROR'}`);
    console.log(`   📊 Estado devuelto por processApproval: ${approvalResult.requestStatus}`);

    // 5. Verificar estado en backend después de primera aprobación
    console.log('\n5. Estado en backend después de primera aprobación...');
    const afterApprovalRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
    console.log(`   📋 Estado en backend: ${afterApprovalRequest.estado}`);

    // 6. Verificar estado en diferentes endpoints del frontend
    console.log('\n6. Verificando diferentes endpoints que usa el frontend...');
    
    // a) "Mis solicitudes"
    const userRequestsAfter = await fetch(`http://localhost:5000/api/requests/my-requests/FRONTEND123`).then(r => r.json());
    const myRequestAfter = userRequestsAfter.find(r => r.id === request.id);
    if (myRequestAfter) {
      console.log(`   📋 Estado en "Mis solicitudes": ${myRequestAfter.estado}`);
    }

    // b) Endpoint general de requests
    const allRequestsResponse = await fetch('http://localhost:5000/api/requests');
    const allRequests = await allRequestsResponse.json();
    const requestInAll = allRequests.find(r => r.id === request.id);
    if (requestInAll) {
      console.log(`   📋 Estado en endpoint general: ${requestInAll.estado}`);
    }

    // c) Solicitudes pendientes para adminCuenta
    const pendingForAdmin = await fetch('http://localhost:5000/api/requests/pending-approval/262698211').then(r => r.json());
    const pendingRequest = pendingForAdmin.find(r => r.id === request.id);
    if (pendingRequest) {
      console.log(`   📋 Estado en "Solicitudes pendientes" adminCuenta: ${pendingRequest.estado}`);
    } else {
      console.log('   ⚠️  Solicitud no aparece en pendientes de adminCuenta');
    }

    // 7. Análisis del problema
    console.log('\n7. 🔍 ANÁLISIS DEL PROBLEMA:');
    console.log('   ='.repeat(45));
    
    const backendState = afterApprovalRequest.estado;
    const frontendState = myRequestAfter?.estado;
    
    if (backendState === 'Pendiente' && frontendState === 'Aprobado') {
      console.log('   ❌ PROBLEMA CONFIRMADO: Desincronización frontend-backend');
      console.log(`      - Backend: ${backendState} (correcto)`);
      console.log(`      - Frontend: ${frontendState} (incorrecto)`);
      console.log('   🎯 CAUSA PROBABLE: Frontend no está invalidando queries correctamente');
    } else if (backendState === frontendState) {
      console.log('   ✅ Estados sincronizados correctamente');
      console.log(`      - Backend y Frontend: ${backendState}`);
    } else {
      console.log('   ⚠️  Estado inesperado - requiere investigación adicional');
      console.log(`      - Backend: ${backendState}`);
      console.log(`      - Frontend: ${frontendState}`);
    }

    // 8. Verificar pasos de aprobación
    console.log('\n8. Estado actual de pasos de aprobación...');
    const finalSteps = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`).then(r => r.json());
    finalSteps.forEach((step, i) => {
      console.log(`   Paso ${i+1}: ${step.approvalStep.perfil} → ${step.requestApprovalStep.estado}`);
    });

    const pendingObligatory = finalSteps.filter(s => 
      s.approvalStep.obligatorio === 'Si' && s.requestApprovalStep.estado === 'Pendiente'
    );
    console.log(`   ⏳ Pasos obligatorios pendientes: ${pendingObligatory.length}`);

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testFrontendStateIssue();