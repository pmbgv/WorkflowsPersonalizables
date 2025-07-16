/**
 * Script para arreglar solicitudes con estado inconsistente
 * Identifica solicitudes marcadas como "Aprobado" pero con pasos pendientes
 */

async function fixStatusInconsistency() {
  console.log('🔧 Arreglo: Inconsistencias de estado en solicitudes');
  console.log('='.repeat(60));

  try {
    // 1. Obtener todas las solicitudes
    console.log('\n1. Obteniendo todas las solicitudes...');
    const allRequestsResponse = await fetch('http://localhost:5000/api/requests');
    const allRequests = await allRequestsResponse.json();
    console.log(`   📊 Total de solicitudes: ${allRequests.length}`);

    // 2. Buscar solicitudes con estado inconsistente
    console.log('\n2. Buscando inconsistencias...');
    const inconsistentRequests = [];

    for (const request of allRequests) {
      if (request.estado === 'Aprobado') {
        // Verificar si tiene pasos pendientes
        const stepsResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`);
        const steps = await stepsResponse.json();
        
        const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
        const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
        
        if (pendingObligatory.length > 0) {
          inconsistentRequests.push({
            id: request.id,
            currentState: request.estado,
            obligatoryTotal: obligatorySteps.length,
            obligatoryPending: pendingObligatory.length,
            steps: steps.map(s => ({
              perfil: s.approvalStep.perfil,
              orden: s.approvalStep.orden,
              obligatorio: s.approvalStep.obligatorio,
              estado: s.requestApprovalStep.estado
            }))
          });
        }
      }
    }

    console.log(`   ❌ Solicitudes inconsistentes encontradas: ${inconsistentRequests.length}`);

    // 3. Mostrar detalles de solicitudes inconsistentes
    if (inconsistentRequests.length > 0) {
      console.log('\n3. Detalles de inconsistencias:');
      inconsistentRequests.forEach(req => {
        console.log(`   📋 Solicitud ${req.id}:`);
        console.log(`      Estado actual: ${req.currentState} (incorrecto)`);
        console.log(`      Pasos obligatorios pendientes: ${req.obligatoryPending}/${req.obligatoryTotal}`);
        console.log(`      Pasos:`);
        req.steps.forEach(step => {
          console.log(`         ${step.perfil} (orden ${step.orden}) - ${step.estado} (${step.obligatorio})`);
        });
        console.log('');
      });

      // 4. Corregir automáticamente
      console.log('\n4. Corrigiendo estados inconsistentes...');
      for (const req of inconsistentRequests) {
        try {
          // Llamar al endpoint para corregir el estado
          const updateResponse = await fetch(`http://localhost:5000/api/requests/${req.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'Pendiente' })
          });
          
          if (updateResponse.ok) {
            console.log(`   ✅ Solicitud ${req.id} corregida a estado "Pendiente"`);
          } else {
            console.log(`   ❌ Error corrigiendo solicitud ${req.id}: ${updateResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error corrigiendo solicitud ${req.id}: ${error.message}`);
        }
      }
    } else {
      console.log('\n3. ✅ No se encontraron inconsistencias');
    }

    // 5. Verificación final
    console.log('\n5. Verificación final...');
    const finalRequestsResponse = await fetch('http://localhost:5000/api/requests');
    const finalRequests = await finalRequestsResponse.json();
    
    let finalInconsistent = 0;
    for (const request of finalRequests) {
      if (request.estado === 'Aprobado') {
        const stepsResponse = await fetch(`http://localhost:5000/api/requests/${request.id}/approval-steps`);
        const steps = await stepsResponse.json();
        
        const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
        const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
        
        if (pendingObligatory.length > 0) {
          finalInconsistent++;
        }
      }
    }

    console.log(`   📊 Inconsistencias restantes: ${finalInconsistent}`);
    
    if (finalInconsistent === 0) {
      console.log('\n🎉 CORRECCIÓN EXITOSA: Todas las inconsistencias han sido arregladas');
    } else {
      console.log('\n⚠️  Algunas inconsistencias persisten - revisar manualmente');
    }

  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
  }
}

// Ejecutar corrección
fixStatusInconsistency();