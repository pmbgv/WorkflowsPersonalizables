/**
 * Test para identificar el problema de sincronización frontend-backend
 * El backend está correcto pero el frontend muestra estado incorrecto
 */

async function testFrontendSyncIssue() {
  console.log('🔍 Test: Problema de sincronización frontend-backend');
  console.log('='.repeat(55));

  try {
    // 1. Crear solicitud que va al flujo supervisor → adminCuenta
    console.log('\n1. Creando solicitud para flujo supervisor → adminCuenta...');
    const testRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-31",
      fechaFin: "2025-07-31", 
      asunto: "Test Frontend Sync",
      descripcion: "Verificación sincronización frontend",
      solicitadoPor: "Frontend Sync Test",
      usuarioSolicitado: "Frontend Sync User",
      identificador: "FRONTSYNC123",
      identificadorUsuario: "20836784",
      motivo: "Ley 20823", // Usa esquema test3 con supervisor → adminCuenta
      archivosAdjuntos: []
    };

    const createResponse = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });
    const newRequest = await createResponse.json();
    console.log(`   ✅ Solicitud creada: ID ${newRequest.id}, Estado: ${newRequest.estado}`);

    // 2. Verificar pasos de aprobación iniciales
    console.log('\n2. Verificando pasos de aprobación...');
    const stepsResponse = await fetch(`http://localhost:5000/api/requests/${newRequest.id}/approval-steps`);
    const steps = await stepsResponse.json();
    
    const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
    console.log(`   📊 Pasos obligatorios: ${obligatorySteps.length}`);
    obligatorySteps.forEach((step, i) => {
      console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden}) - ${step.requestApprovalStep.estado}`);
    });

    // 3. Simular aprobación del supervisor
    console.log('\n3. Simulando aprobación del supervisor...');
    const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
    
    if (supervisorStep) {
      const approvalResponse = await fetch(`http://localhost:5000/api/requests/${newRequest.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Aprobado',
          userProfile: '#supervisor#',
          comentario: 'Aprobado por supervisor - test frontend'
        })
      });
      
      const result = await approvalResponse.json();
      console.log(`   🔄 Resultado: ${result.success ? 'ÉXITO' : 'ERROR'}`);
      console.log(`   📊 Estado devuelto: ${result.requestStatus}`);
      console.log(`   💬 Mensaje: ${result.message}`);

      // 4. Verificar estado inmediatamente después
      console.log('\n4. Verificando estado inmediatamente después...');
      const afterApprovalResponse = await fetch(`http://localhost:5000/api/requests/${newRequest.id}`);
      const afterApproval = await afterApprovalResponse.json();
      console.log(`   📋 Estado en base de datos: ${afterApproval.estado}`);

      // 5. Verificar pasos actualizados
      console.log('\n5. Verificando pasos actualizados...');
      const updatedStepsResponse = await fetch(`http://localhost:5000/api/requests/${newRequest.id}/approval-steps`);
      const updatedSteps = await updatedStepsResponse.json();
      
      const updatedObligatory = updatedSteps.filter(s => s.approvalStep.obligatorio === 'Si');
      const pendingObligatory = updatedObligatory.filter(s => s.requestApprovalStep.estado === 'Pendiente');
      
      console.log(`   📊 Pasos obligatorios pendientes: ${pendingObligatory.length}/${updatedObligatory.length}`);
      updatedObligatory.forEach((step, i) => {
        console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden}) - ${step.requestApprovalStep.estado}`);
      });

      // 6. Verificar consistencia
      console.log('\n6. Verificando consistencia...');
      const isConsistent = !(afterApproval.estado === 'Aprobado' && pendingObligatory.length > 0);
      console.log(`   📋 Estado: ${afterApproval.estado}`);
      console.log(`   📊 Pasos pendientes: ${pendingObligatory.length}`);
      console.log(`   ✅ Consistente: ${isConsistent ? 'SÍ' : 'NO'}`);

      // 7. Simular endpoint que usa el frontend
      console.log('\n7. Simulando endpoints del frontend...');
      
      // Mis solicitudes
      const myRequestsResponse = await fetch(`http://localhost:5000/api/requests/my-requests/20836784`);
      const myRequests = await myRequestsResponse.json();
      const foundInMy = myRequests.find(r => r.id === newRequest.id);
      console.log(`   📋 En "Mis solicitudes": ${foundInMy ? `Estado ${foundInMy.estado}` : 'NO ENCONTRADO'}`);

      // Solicitudes pendientes supervisor
      const supervisorPendingResponse = await fetch(`http://localhost:5000/api/requests/pending-approval/183955671`);
      const supervisorPending = await supervisorPendingResponse.json();
      const supervisorCanSee = supervisorPending.find(r => r.id === newRequest.id);
      console.log(`   📋 Supervisor puede ver: ${supervisorCanSee ? 'SÍ' : 'NO'}`);

      // Solicitudes pendientes adminCuenta
      const adminPendingResponse = await fetch(`http://localhost:5000/api/requests/pending-approval/262698211`);
      const adminPending = await adminPendingResponse.json();
      const adminCanSee = adminPending.find(r => r.id === newRequest.id);
      console.log(`   📋 AdminCuenta puede ver: ${adminCanSee ? 'SÍ' : 'NO'}`);

      // 8. Resumen del problema potencial
      console.log('\n8. 🔍 ANÁLISIS DEL PROBLEMA:');
      console.log('   ='.repeat(40));
      
      if (isConsistent && adminCanSee) {
        console.log('   ✅ Backend funciona correctamente');
        console.log('   ✅ Flujo secuencial trabajando');
        console.log('   ✅ AdminCuenta ve solicitud para siguiente paso');
        console.log('\n   🎯 POSIBLE CAUSA: Problema de cache o React Query en frontend');
        console.log('   💡 SOLUCIÓN: Verificar invalidación de queries en frontend');
      } else {
        console.log('   ❌ Hay problemas en el backend');
        if (!isConsistent) console.log('   - Estado inconsistente detectado');
        if (!adminCanSee) console.log('   - AdminCuenta no puede ver solicitud');
      }

    } else {
      console.log('   ❌ No se encontró paso de supervisor');
    }

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testFrontendSyncIssue();