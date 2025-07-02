/**
 * Test para verificar la corrección del flujo secuencial de aprobación
 * Después de remover la llamada problemática a onStatusChange
 */

async function testCorrectedSequentialFlow() {
  console.log('✅ Test: Flujo secuencial corregido');
  console.log('='.repeat(60));

  try {
    // 1. Crear nueva solicitud con esquema test3
    console.log('\n1. Creando solicitud con flujo supervisor → adminCuenta...');
    const newRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-20",
      fechaFin: "2025-07-20",
      asunto: "Test Flujo Corregido",
      descripcion: "Verificación del flujo secuencial corregido",
      solicitadoPor: "Test Corrected User",
      usuarioSolicitado: "Test Corrected User",
      identificador: "CORRECTED123",
      identificadorUsuario: "CORRECTED123",
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

    // 2. Verificar pasos iniciales
    console.log('\n2. Verificando configuración inicial...');
    const initialSteps = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`).then(r => r.json());
    
    console.log(`   📊 Pasos configurados: ${initialSteps.length}`);
    initialSteps.forEach((step, i) => {
      console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden}) - ${step.requestApprovalStep.estado}`);
    });

    // 3. Supervisor aprueba paso 1
    console.log('\n3. Procesando aprobación de supervisor...');
    const supervisorStep = initialSteps.find(s => s.approvalStep.perfil === '#supervisor#');
    
    const approvalResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Aprobado',
        userProfile: '#supervisor#',
        comentario: 'Aprobado por supervisor - test corregido'
      })
    });
    const result = await approvalResponse.json();
    
    console.log(`   🔄 Resultado: ${result.success ? 'ÉXITO' : 'ERROR'}`);
    console.log(`   📊 Estado devuelto: ${result.requestStatus}`);
    console.log(`   💬 Mensaje: ${result.message}`);

    // 4. Verificar estado de solicitud después de aprobación del supervisor
    console.log('\n4. Verificando estado después de aprobación de supervisor...');
    const afterSupervisorRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
    console.log(`   📋 Estado de solicitud: ${afterSupervisorRequest.estado}`);

    // 5. Verificar pasos después de aprobación
    console.log('\n5. Verificando pasos después de aprobación...');
    const afterSteps = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`).then(r => r.json());
    
    afterSteps.forEach((step, i) => {
      console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden})`);
      console.log(`         Estado: ${step.requestApprovalStep.estado}`);
      console.log(`         Aprobado por: ${step.requestApprovalStep.aprobadoPor || 'N/A'}`);
    });

    // 6. Verificar visibilidad para adminCuenta
    console.log('\n6. Verificando visibilidad para adminCuenta...');
    const adminPendingResponse = await fetch('http://localhost:5000/api/requests/pending-approval/262698211');
    const adminPendingRequests = await adminPendingResponse.json();
    
    const adminCanSeeRequest = adminPendingRequests.some(r => r.id === request.id);
    console.log(`   👀 AdminCuenta puede ver solicitud: ${adminCanSeeRequest ? 'SÍ' : 'NO'}`);

    // 7. AdminCuenta aprueba paso 2 (completar flujo)
    console.log('\n7. Completando flujo - adminCuenta aprueba paso 2...');
    const adminStep = afterSteps.find(s => s.approvalStep.perfil === '#adminCuenta#' && s.requestApprovalStep.estado === 'Pendiente');
    
    if (adminStep) {
      const finalApprovalResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps/${adminStep.requestApprovalStep.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Aprobado',
          userProfile: '#adminCuenta#',
          comentario: 'Aprobado por adminCuenta - completando flujo'
        })
      });
      const finalResult = await finalApprovalResponse.json();
      
      console.log(`   🔄 Resultado final: ${finalResult.success ? 'ÉXITO' : 'ERROR'}`);
      console.log(`   📊 Estado final devuelto: ${finalResult.requestStatus}`);
      console.log(`   💬 Mensaje final: ${finalResult.message}`);

      // 8. Verificar estado final de la solicitud
      console.log('\n8. Verificando estado final de la solicitud...');
      const finalRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
      console.log(`   📋 Estado final: ${finalRequest.estado}`);
    } else {
      console.log('   ❌ No se encontró paso pendiente para adminCuenta');
    }

    // 9. Resumen de resultados
    console.log('\n9. 📊 RESUMEN DEL TEST:');
    console.log('   ='.repeat(40));
    
    const expectingSupervisorApproval = afterSupervisorRequest.estado === 'Pendiente';
    const adminCanSee = adminCanSeeRequest;
    
    if (expectingSupervisorApproval && adminCanSee) {
      console.log('   ✅ CORRECCIÓN EXITOSA:');
      console.log('      - Supervisor aprobó paso 1');
      console.log('      - Solicitud sigue "Pendiente" (correcto)');
      console.log('      - AdminCuenta puede ver solicitud para paso 2');
      console.log('      - Flujo secuencial funciona correctamente');
    } else {
      console.log('   ❌ AÚN HAY PROBLEMAS:');
      console.log(`      - Estado después de supervisor: ${afterSupervisorRequest.estado}`);
      console.log(`      - AdminCuenta puede ver solicitud: ${adminCanSee}`);
    }

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testCorrectedSequentialFlow();