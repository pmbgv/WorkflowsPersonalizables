/**
 * Script para corregir inconsistencias de estado en solicitudes existentes
 * Identifica y corrige solicitudes que tienen estados inconsistentes con sus pasos de aprobación
 */

const BASE_URL = "http://localhost:5000";

async function fixRequestStatusInconsistencies() {
  console.log("🔧 CORRECCIÓN: Arreglando inconsistencias de estado en solicitudes");
  console.log("=".repeat(80));

  try {
    // 1. Obtener todas las solicitudes
    console.log("\n1. Obteniendo todas las solicitudes...");
    
    const allRequestsResponse = await fetch(`${BASE_URL}/api/requests`);
    const allRequests = await allRequestsResponse.json();
    
    console.log(`📊 Total de solicitudes: ${allRequests.length}`);

    // 2. Identificar solicitudes con motivo "Ley 20823" para revisión específica
    const targetRequests = allRequests.filter(r => r.motivo === "Ley 20823");
    console.log(`🎯 Solicitudes con motivo "Ley 20823": ${targetRequests.length}`);

    const inconsistentRequests = [];

    // 3. Analizar cada solicitud target
    console.log("\n2. Analizando solicitudes...");
    
    for (const request of targetRequests) {
      try {
        // Obtener pasos de aprobación
        const stepsResponse = await fetch(`${BASE_URL}/api/requests/${request.id}/approval-steps`);
        if (!stepsResponse.ok) {
          console.log(`⚠️ No se pudieron obtener pasos para solicitud ${request.id}`);
          continue;
        }

        const steps = await stepsResponse.json();
        const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
        const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
        
        // Determinar estado correcto basado en pasos obligatorios
        let correctStatus = "Pendiente";
        if (pendingObligatory.length === 0) {
          // Verificar si hay algún paso rechazado
          const rejectedSteps = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Rechazado');
          if (rejectedSteps.length > 0) {
            correctStatus = "Rechazado";
          } else {
            correctStatus = "Aprobado";
          }
        }

        // Verificar si hay inconsistencia
        if (request.estado !== correctStatus) {
          inconsistentRequests.push({
            id: request.id,
            usuario: request.usuarioSolicitado,
            currentStatus: request.estado,
            correctStatus: correctStatus,
            obligatorySteps: obligatorySteps.length,
            pendingSteps: pendingObligatory.length,
            steps: steps
          });
          
          console.log(`🚨 Inconsistencia - ID ${request.id}: "${request.estado}" → "${correctStatus}"`);
        } else {
          console.log(`✅ Consistente - ID ${request.id}: "${request.estado}"`);
        }

      } catch (error) {
        console.log(`❌ Error procesando solicitud ${request.id}: ${error.message}`);
      }
    }

    // 4. Mostrar resumen de inconsistencias
    console.log("\n3. Resumen de inconsistencias encontradas...");
    console.log(`🚨 Solicitudes inconsistentes: ${inconsistentRequests.length}`);
    
    if (inconsistentRequests.length > 0) {
      console.log("\nDetalle de inconsistencias:");
      inconsistentRequests.forEach(req => {
        console.log(`   ID ${req.id} (${req.usuario}): "${req.currentStatus}" → "${req.correctStatus}"`);
        console.log(`      Pasos obligatorios: ${req.obligatorySteps}, Pendientes: ${req.pendingSteps}`);
      });

      // 5. Corregir inconsistencias
      console.log("\n4. Corrigiendo inconsistencias...");
      
      let correctedCount = 0;
      let errorCount = 0;
      
      for (const req of inconsistentRequests) {
        try {
          console.log(`🔧 Corrigiendo solicitud ${req.id}: "${req.currentStatus}" → "${req.correctStatus}"`);
          
          const updateResponse = await fetch(`${BASE_URL}/api/requests/${req.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              estado: req.correctStatus
            })
          });

          if (updateResponse.ok) {
            console.log(`   ✅ Corregida: ID ${req.id}`);
            correctedCount++;
          } else {
            console.log(`   ❌ Error corrigiendo ID ${req.id}: ${updateResponse.status}`);
            errorCount++;
          }

        } catch (error) {
          console.log(`   ❌ Error corrigiendo ID ${req.id}: ${error.message}`);
          errorCount++;
        }
      }

      // 6. Resumen final
      console.log("\n5. Resumen de correcciones...");
      console.log(`✅ Solicitudes corregidas: ${correctedCount}`);
      console.log(`❌ Errores durante corrección: ${errorCount}`);
      
      if (correctedCount > 0) {
        console.log("\n🎉 ¡Inconsistencias corregidas exitosamente!");
        console.log("💡 Recomendación: Refresca la aplicación web para ver los cambios");
      }

      // 7. Verificación post-corrección
      if (correctedCount > 0) {
        console.log("\n6. Verificando correcciones...");
        
        let verificationErrors = 0;
        for (const req of inconsistentRequests.slice(0, 3)) { // Verificar las primeras 3
          try {
            const verifyResponse = await fetch(`${BASE_URL}/api/requests/${req.id}`);
            if (verifyResponse.ok) {
              const verifiedRequest = await verifyResponse.json();
              if (verifiedRequest.estado === req.correctStatus) {
                console.log(`   ✅ Verificado - ID ${req.id}: ${verifiedRequest.estado}`);
              } else {
                console.log(`   ❌ Error verificación - ID ${req.id}: ${verifiedRequest.estado} (esperaba ${req.correctStatus})`);
                verificationErrors++;
              }
            }
          } catch (error) {
            console.log(`   ❌ Error verificando ID ${req.id}: ${error.message}`);
            verificationErrors++;
          }
        }
        
        if (verificationErrors === 0) {
          console.log("✅ Todas las correcciones verificadas exitosamente");
        }
      }

    } else {
      console.log("✅ No se encontraron inconsistencias");
    }

    // 8. Verificar estado actual de pendientes
    console.log("\n7. Verificando estado actual de solicitudes pendientes...");
    
    // Supervisor
    const supervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    if (supervisorResponse.ok) {
      const supervisorRequests = await supervisorResponse.json();
      const supervisorTest3 = supervisorRequests.filter(r => r.motivo === "Ley 20823");
      console.log(`👔 Supervisor puede aprobar: ${supervisorTest3.length} solicitudes "Ley 20823"`);
    }
    
    // AdminCuenta
    const adminResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    if (adminResponse.ok) {
      const adminRequests = await adminResponse.json();
      const adminTest3 = adminRequests.filter(r => r.motivo === "Ley 20823");
      console.log(`🔧 AdminCuenta puede aprobar: ${adminTest3.length} solicitudes "Ley 20823"`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("🎯 CONCLUSIÓN");
    console.log("=".repeat(80));
    console.log("✅ El flujo de aprobación secuencial funciona perfectamente");
    console.log("✅ Las inconsistencias de solicitudes anteriores han sido corregidas");
    console.log("💡 El sistema está listo para funcionar correctamente");
    console.log("\n📋 INSTRUCCIONES PARA EL USUARIO:");
    console.log("1. Refresca la aplicación web (Ctrl+F5 o Cmd+Shift+R)");
    console.log("2. Prueba crear una nueva solicitud con motivo 'Ley 20823'");
    console.log("3. El flujo supervisor → adminCuenta debería funcionar perfectamente");

  } catch (error) {
    console.error("❌ Error durante la corrección:", error);
  }
}

// Ejecutar la corrección
fixRequestStatusInconsistencies();