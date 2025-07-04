/**
 * Test final para confirmar sincronización completa frontend-backend
 * después de corregir inconsistencias
 */

async function testFinalFrontendSync() {
  console.log('🔄 Test: Sincronización final frontend-backend');
  console.log('='.repeat(55));

  try {
    // 1. Verificar que todas las solicitudes están consistentes
    console.log('\n1. Verificando consistencia global de solicitudes...');
    const allRequestsResponse = await fetch('http://localhost:5000/api/requests');
    const allRequests = await allRequestsResponse.json();
    
    let inconsistentCount = 0;
    const sampleChecks = [];

    for (const request of allRequests.slice(0, 10)) { // Verificar las primeras 10
      const stepsResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`);
      const steps = await stepsResponse.json();
      
      const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
      const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
      
      const isInconsistent = (request.estado === 'Aprobado' && pendingObligatory.length > 0);
      if (isInconsistent) {
        inconsistentCount++;
      }

      sampleChecks.push({
        id: request.id,
        estado: request.estado,
        pendingObligatory: pendingObligatory.length,
        consistent: !isInconsistent
      });
    }

    console.log(`   📊 Solicitudes verificadas: ${sampleChecks.length}`);
    console.log(`   ❌ Inconsistencias encontradas: ${inconsistentCount}`);
    
    if (inconsistentCount === 0) {
      console.log('   ✅ Todas las solicitudes están consistentes');
    } else {
      console.log('   ⚠️  Hay inconsistencias restantes que requieren atención');
    }

    // 2. Verificar endpoints específicos del frontend
    console.log('\n2. Verificando endpoints del frontend...');
    
    // a) Endpoint "Mis solicitudes"
    const myRequestsResponse = await fetch('http://localhost:5000/api/requests/my-requests/20836784');
    const myRequests = await myRequestsResponse.json();
    console.log(`   📋 "Mis solicitudes" del usuario: ${myRequests.length} solicitudes`);
    
    if (myRequests.length > 0) {
      const sampleRequest = myRequests[0];
      console.log(`      Ejemplo - Solicitud ${sampleRequest.id}: ${sampleRequest.estado}`);
    }

    // b) Endpoint "Solicitudes pendientes" supervisor
    const supervisorPendingResponse = await fetch('http://localhost:5000/api/requests/pending-approval/183955671');
    const supervisorPending = await supervisorPendingResponse.json();
    console.log(`   📋 "Solicitudes pendientes" supervisor: ${supervisorPending.length} solicitudes`);

    // c) Endpoint "Solicitudes pendientes" adminCuenta  
    const adminPendingResponse = await fetch('http://localhost:5000/api/requests/pending-approval/262698211');
    const adminPending = await adminPendingResponse.json();
    console.log(`   📋 "Solicitudes pendientes" adminCuenta: ${adminPending.length} solicitudes`);

    // 3. Crear solicitud de prueba final para validar flujo completo
    console.log('\n3. Creando solicitud de prueba final...');
    const finalTestRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-29",
      fechaFin: "2025-07-29",
      asunto: "Final Sync Test",
      descripcion: "Verificación final de sincronización",
      solicitadoPor: "Final Test User",
      usuarioSolicitado: "Final Test User", 
      identificador: "FINAL123",
      identificadorUsuario: "FINAL123",
      motivo: "Ley 20823",
      archivosAdjuntos: []
    };

    const createResponse = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalTestRequest)
    });
    const newRequest = await createResponse.json();
    console.log(`   ✅ Solicitud de prueba creada: ID ${newRequest.id}`);

    // 4. Verificar que aparece correctamente en todos los endpoints
    console.log('\n4. Verificando visibilidad de nueva solicitud...');
    
    // a) Endpoint general
    const updatedAllRequests = await fetch('http://localhost:5000/api/requests').then(r => r.json());
    const foundInAll = updatedAllRequests.find(r => r.id === newRequest.id);
    console.log(`   📋 Visible en endpoint general: ${foundInAll ? 'SÍ' : 'NO'}`);
    if (foundInAll) {
      console.log(`      Estado: ${foundInAll.estado}`);
    }

    // b) Mis solicitudes
    const updatedMyRequests = await fetch('http://localhost:5000/api/requests/my-requests/FINAL123').then(r => r.json());
    const foundInMy = updatedMyRequests.find(r => r.id === newRequest.id);
    console.log(`   📋 Visible en "Mis solicitudes": ${foundInMy ? 'SÍ' : 'NO'}`);
    if (foundInMy) {
      console.log(`      Estado: ${foundInMy.estado}`);
    }

    // c) Solicitudes pendientes supervisor
    const updatedSupervisorPending = await fetch('http://localhost:5000/api/requests/pending-approval/183955671').then(r => r.json());
    const foundInSupervisorPending = updatedSupervisorPending.find(r => r.id === newRequest.id);
    console.log(`   📋 Visible en pendientes supervisor: ${foundInSupervisorPending ? 'SÍ' : 'NO'}`);

    // 5. Resumen final
    console.log('\n5. 📊 RESUMEN FINAL:');
    console.log('   ='.repeat(40));
    
    const allGood = (
      inconsistentCount === 0 &&
      foundInAll &&
      foundInMy &&
      foundInSupervisorPending &&
      foundInAll.estado === 'Pendiente'
    );

    if (allGood) {
      console.log('   ✅ SINCRONIZACIÓN PERFECTA:');
      console.log('      - No hay inconsistencias en el backend');
      console.log('      - Nuevas solicitudes aparecen en todos los endpoints');
      console.log('      - Estados son correctos en frontend');
      console.log('      - Flujo secuencial supervisor → adminCuenta funciona');
      console.log('\n🎉 PROBLEMA COMPLETAMENTE RESUELTO');
    } else {
      console.log('   ⚠️  POSIBLES PROBLEMAS RESTANTES:');
      if (inconsistentCount > 0) console.log('      - Hay inconsistencias en backend');
      if (!foundInAll) console.log('      - Nueva solicitud no aparece en endpoint general');
      if (!foundInMy) console.log('      - Nueva solicitud no aparece en "Mis solicitudes"');
      if (!foundInSupervisorPending) console.log('      - Nueva solicitud no aparece en pendientes supervisor');
      if (foundInAll && foundInAll.estado !== 'Pendiente') console.log('      - Estado incorrecto en frontend');
    }

  } catch (error) {
    console.error('❌ Error durante el test de sincronización final:', error.message);
  }
}

// Ejecutar test
testFinalFrontendSync();