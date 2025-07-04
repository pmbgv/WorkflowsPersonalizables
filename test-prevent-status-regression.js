/**
 * Test de regresión para prevenir que solicitudes se marquen como "Aprobado" 
 * cuando aún tienen pasos obligatorios pendientes
 */

async function testPreventStatusRegression() {
  console.log('🔒 Test: Prevención de regresión de estados');
  console.log('='.repeat(55));

  try {
    // 1. Crear solicitud nueva de control
    console.log('\n1. Creando solicitud de control...');
    const controlRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-28",
      fechaFin: "2025-07-28",
      asunto: "Control Regression Test",
      descripcion: "Test para prevenir regresión",
      solicitadoPor: "Regression Test User",
      usuarioSolicitado: "Regression Test User",
      identificador: "REGR123",
      identificadorUsuario: "REGR123",
      motivo: "Ley 20823",
      archivosAdjuntos: []
    };

    const response = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(controlRequest)
    });
    const request = await response.json();
    console.log(`   ✅ Solicitud de control creada: ID ${request.id}`);

    // 2. Validar estado inicial
    console.log('\n2. Validando estado inicial...');
    const initialRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
    console.log(`   📋 Estado inicial: ${initialRequest.estado}`);
    
    if (initialRequest.estado !== 'Pendiente') {
      console.log(`   ❌ ERROR: Estado inicial incorrecto - esperado: Pendiente, actual: ${initialRequest.estado}`);
      return;
    }

    // 3. Validar pasos de aprobación
    console.log('\n3. Validando pasos de aprobación...');
    const stepsResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`);
    const steps = await stepsResponse.json();
    
    const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
    console.log(`   📊 Pasos obligatorios configurados: ${obligatorySteps.length}`);
    
    obligatorySteps.forEach((step, i) => {
      console.log(`      Paso ${i+1}: ${step.approvalStep.perfil} (orden ${step.approvalStep.orden})`);
    });

    // 4. Función para validar consistencia
    const validateRequestConsistency = async (requestId, stepDescription) => {
      const request = await fetch(`http://localhost:5000/api/requests/${requestId}`).then(r => r.json());
      const steps = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps`).then(r => r.json());
      
      const obligatory = steps.filter(s => s.approvalStep.obligatorio === 'Si');
      const pendingObligatory = obligatory.filter(s => s.requestApprovalStep.estado === 'Pendiente');
      
      console.log(`   📋 ${stepDescription}:`);
      console.log(`      Estado de solicitud: ${request.estado}`);
      console.log(`      Pasos obligatorios pendientes: ${pendingObligatory.length}/${obligatory.length}`);
      
      // Validar consistencia
      if (request.estado === 'Aprobado' && pendingObligatory.length > 0) {
        console.log(`   ❌ INCONSISTENCIA DETECTADA: Solicitud "Aprobado" con ${pendingObligatory.length} pasos pendientes`);
        return false;
      } else if (request.estado === 'Pendiente' && pendingObligatory.length === 0) {
        console.log(`   ⚠️  POSIBLE INCONSISTENCIA: Solicitud "Pendiente" sin pasos pendientes`);
        return false;
      } else {
        console.log(`   ✅ Estado consistente`);
        return true;
      }
    };

    // 5. Procesar primer paso de aprobación
    console.log('\n4. Procesando primer paso de aprobación...');
    const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
    
    const approvalResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'Aprobado',
        userProfile: '#supervisor#',
        comentario: 'Primer paso - test regresión'
      })
    });
    const result = await approvalResponse.json();
    console.log(`   🔄 Resultado: ${result.success ? 'ÉXITO' : 'ERROR'}`);
    console.log(`   📊 Estado devuelto: ${result.requestStatus}`);

    // 6. Validar consistencia después del primer paso
    console.log('\n5. Validando consistencia después del primer paso...');
    const isConsistent = await validateRequestConsistency(request.id, 'Después del primer paso');
    
    if (!isConsistent) {
      console.log('\n❌ REGRESIÓN DETECTADA: Test fallido');
      return;
    }

    // 7. Verificar que adminCuenta puede ver la solicitud
    console.log('\n6. Verificando visibilidad para adminCuenta...');
    const adminPendingResponse = await fetch('http://localhost:5000/api/requests/pending-approval/262698211');
    const adminPending = await adminPendingResponse.json();
    
    const adminCanSee = adminPending.some(r => r.id === request.id);
    console.log(`   👀 AdminCuenta puede ver solicitud: ${adminCanSee ? 'SÍ' : 'NO'}`);
    
    if (!adminCanSee) {
      console.log('   ❌ ERROR: AdminCuenta debería ver la solicitud para segundo paso');
      return;
    }

    // 8. Completar segundo paso
    console.log('\n7. Completando segundo paso...');
    const updatedSteps = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`).then(r => r.json());
    const adminStep = updatedSteps.find(s => s.approvalStep.perfil === '#adminCuenta#' && s.requestApprovalStep.estado === 'Pendiente');
    
    if (adminStep) {
      const finalApprovalResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps/${adminStep.requestApprovalStep.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'Aprobado',
          userProfile: '#adminCuenta#',
          comentario: 'Segundo paso - completando flujo'
        })
      });
      const finalResult = await finalApprovalResponse.json();
      console.log(`   🔄 Resultado final: ${finalResult.success ? 'ÉXITO' : 'ERROR'}`);
      console.log(`   📊 Estado final devuelto: ${finalResult.requestStatus}`);

      // 9. Validar estado final
      console.log('\n8. Validando estado final...');
      const finalRequest = await fetch(`http://localhost:5000/api/requests/${request.id}`).then(r => r.json());
      console.log(`   📋 Estado final: ${finalRequest.estado}`);
      
      if (finalRequest.estado === 'Aprobado') {
        console.log('   ✅ Estado final correcto');
      } else {
        console.log(`   ❌ ERROR: Estado final incorrecto - esperado: Aprobado, actual: ${finalRequest.estado}`);
        return;
      }
    }

    // 10. Resultado del test
    console.log('\n9. 📊 RESULTADO DEL TEST:');
    console.log('   ='.repeat(40));
    console.log('   ✅ TEST EXITOSO: No se detectaron regresiones');
    console.log('   ✅ Flujo secuencial funciona correctamente');
    console.log('   ✅ Estados son consistentes en todo momento');
    console.log('   ✅ Visibilidad por pasos funciona correctamente');
    console.log('\n🎉 PREVENCIÓN DE REGRESIÓN: EXITOSA');

  } catch (error) {
    console.error('❌ Error durante el test de regresión:', error.message);
  }
}

// Ejecutar test
testPreventStatusRegression();