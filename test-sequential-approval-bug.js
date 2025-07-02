/**
 * Test específico para diagnosticar el bug de aprobación secuencial
 * El problema: supervisor aprueba paso 1, pero la solicitud se marca como "Aprobado" 
 * en lugar de continuar "Pendiente" para adminCuenta
 */

async function testSequentialApprovalBug() {
  console.log('🐛 Test: Diagnóstico del bug de aprobación secuencial');
  console.log('='.repeat(70));

  try {
    // 1. Crear solicitud nueva con esquema test3 (supervisor → adminCuenta)
    console.log('\n1. Creando nueva solicitud con esquema test3...');
    const newRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-18",
      fechaFin: "2025-07-18",
      asunto: "Test Sequential Bug",
      descripcion: "Diagnóstico del bug secuencial",
      solicitadoPor: "Test User",
      usuarioSolicitado: "Test User", 
      identificador: "TEST123",
      identificadorUsuario: "TEST123",
      motivo: "Ley 20823", // Este motivo usa esquema test3
      archivosAdjuntos: []
    };

    const createResponse = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    });
    const request = await createResponse.json();
    console.log(`   ✅ Solicitud creada: ID ${request.id}`);

    // 2. Verificar estado inicial
    console.log('\n2. Verificando estado inicial...');
    const initialRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
    console.log(`   📋 Estado inicial: ${initialRequest.estado}`);

    // 3. Verificar pasos de aprobación creados
    console.log('\n3. Verificando pasos de aprobación...');
    const stepsResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`);
    const steps = await stepsResponse.json();
    
    console.log(`   📊 Pasos configurados: ${steps.length}`);
    steps.forEach((step, i) => {
      console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden}) - ${step.requestApprovalStep.estado} - ${step.approvalStep.obligatorio}`);
    });

    // 4. Simular aprobación del supervisor (paso 1)
    console.log('\n4. Simulando aprobación de supervisor...');
    const supervisorStepId = steps.find(s => s.approvalStep.perfil === '#supervisor#')?.requestApprovalStep.id;
    
    if (!supervisorStepId) {
      console.log('   ❌ No se encontró paso de supervisor');
      return;
    }

    const approvalResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps/${supervisorStepId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Aprobado',
        userProfile: '#supervisor#',
        comentario: 'Aprobado por supervisor para test'
      })
    });
    const approvalResult = await approvalResponse.json();
    
    console.log(`   🔄 Resultado aprobación supervisor: ${approvalResult.success ? 'ÉXITO' : 'ERROR'}`);
    console.log(`   📊 Estado resultante: ${approvalResult.requestStatus}`);
    console.log(`   💬 Mensaje: ${approvalResult.message}`);

    // 5. Verificar estado final de la solicitud
    console.log('\n5. Verificando estado final...');
    const finalRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
    console.log(`   📋 Estado final de solicitud: ${finalRequest.estado}`);

    // 6. Verificar estado de pasos individuales
    console.log('\n6. Verificando pasos individuales después de aprobación...');
    const finalSteps = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`).then(r => r.json());
    
    finalSteps.forEach((step, i) => {
      console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden})`);
      console.log(`         Estado: ${step.requestApprovalStep.estado}`);
      console.log(`         Obligatorio: ${step.approvalStep.obligatorio}`);
      console.log(`         Aprobado por: ${step.requestApprovalStep.aprobadoPor || 'N/A'}`);
    });

    // 7. Análisis del problema
    console.log('\n7. 🔍 ANÁLISIS DEL PROBLEMA:');
    console.log('   ='.repeat(40));
    
    const obligatorySteps = finalSteps.filter(s => s.approvalStep.obligatorio === 'Si');
    const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
    
    console.log(`   📊 Pasos obligatorios totales: ${obligatorySteps.length}`);
    console.log(`   ⏳ Pasos obligatorios pendientes: ${pendingObligatory.length}`);
    
    if (finalRequest.estado === 'Aprobado' && pendingObligatory.length > 0) {
      console.log('   ❌ BUG CONFIRMADO: Solicitud marcada como "Aprobado" pero hay pasos obligatorios pendientes');
      console.log('   🎯 CAUSA PROBABLE: Error en lógica de processApprovalStep');
    } else if (finalRequest.estado === 'Pendiente' && pendingObligatory.length > 0) {
      console.log('   ✅ COMPORTAMIENTO CORRECTO: Solicitud sigue "Pendiente" con pasos obligatorios pendientes');
    } else {
      console.log('   ⚠️  Estado inesperado - revisar lógica');
    }

    // 8. Verificar visibilidad para adminCuenta
    console.log('\n8. Verificando visibilidad para adminCuenta...');
    const adminPendingResponse = await fetch('http://localhost:5000/api/requests/pending-approval/262698211');
    const adminPendingRequests = await adminPendingResponse.json();
    
    const adminCanSeeRequest = adminPendingRequests.some(r => r.id === request.id);
    console.log(`   👀 AdminCuenta puede ver solicitud ${request.id}: ${adminCanSeeRequest ? 'SÍ' : 'NO'}`);
    
    if (!adminCanSeeRequest && finalRequest.estado === 'Pendiente') {
      console.log('   ⚠️  PROBLEMA: Solicitud pendiente pero adminCuenta no la ve');
    }

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testSequentialApprovalBug();