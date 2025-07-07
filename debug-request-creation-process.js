/**
 * Debug del proceso completo de creación de solicitudes
 * Para entender exactamente qué está marcando como "Aprobado" las solicitudes nuevas
 */

const BASE_URL = "http://localhost:5000";

function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function debugRequestCreationProcess() {
  console.log("🔍 DEBUG: Proceso de creación de solicitudes");
  console.log("=".repeat(60));

  try {
    // 1. Obtener ID de la solicitud más reciente ANTES de crear una nueva
    console.log("\n1. Obteniendo ID más reciente actual...");
    
    const beforeResponse = await fetch(`${BASE_URL}/api/requests`);
    const beforeRequests = await beforeResponse.json();
    const currentMaxId = beforeRequests.length > 0 ? Math.max(...beforeRequests.map(r => r.id)) : 0;
    console.log(`📊 ID más alto actual: ${currentMaxId}`);

    // 2. Crear nueva solicitud
    console.log("\n2. Creando nueva solicitud...");
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const requestDate = formatDateToLocal(tomorrow);
    
    const newRequestData = {
      tipo: "Permiso",
      fechaSolicitada: requestDate,
      fechaFin: requestDate,
      asunto: "DEBUG - Test flujo dos pasos",
      descripcion: "Solicitud para debug del proceso",
      solicitadoPor: "Prueba GC",
      identificador: "20836784",
      usuarioSolicitado: "Prueba GC", 
      identificadorUsuario: "20836784",
      motivo: "Ley 20823",
      archivosAdjuntos: []
    };

    console.log("📋 Enviando solicitud...");
    const createResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequestData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log(`❌ Error creando solicitud: ${createResponse.status} - ${errorText}`);
      return;
    }

    const newRequest = await createResponse.json();
    console.log(`✅ Solicitud creada: ID ${newRequest.id}`);
    console.log(`   Estado inicial retornado: ${newRequest.estado}`);

    // 3. Verificar estado inmediatamente después
    console.log("\n3. Verificando estado inmediatamente después...");
    
    // Esperar un momento para que cualquier proceso asíncrono termine
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const immediateCheckResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    if (immediateCheckResponse.ok) {
      const immediateRequest = await immediateCheckResponse.json();
      console.log(`📋 Estado en BD inmediatamente: ${immediateRequest.estado}`);
      
      if (immediateRequest.estado !== newRequest.estado) {
        console.log(`🚨 ¡CAMBIO DE ESTADO DETECTADO! ${newRequest.estado} → ${immediateRequest.estado}`);
      }
    }

    // 4. Verificar pasos de aprobación
    console.log("\n4. Verificando pasos de aprobación...");
    
    const stepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
    if (stepsResponse.ok) {
      const steps = await stepsResponse.json();
      console.log(`📊 Pasos creados: ${steps.length}`);
      
      steps.forEach((step, i) => {
        console.log(`   Paso ${step.approvalStep.orden}: ${step.approvalStep.perfil} - ${step.requestApprovalStep.estado} (${step.approvalStep.obligatorio})`);
      });
      
      // Verificar consistencia
      const obligatorySteps = steps.filter(s => s.approvalStep.obligatorio === 'Si');
      const pendingObligatory = obligatorySteps.filter(s => s.requestApprovalStep.estado === 'Pendiente');
      
      console.log(`🔍 Análisis de consistencia:`);
      console.log(`   Pasos obligatorios: ${obligatorySteps.length}`);
      console.log(`   Obligatorios pendientes: ${pendingObligatory.length}`);
      
      const expectedStatus = pendingObligatory.length === 0 ? "Aprobado" : "Pendiente";
      const actualStatus = immediateRequest?.estado || newRequest.estado;
      
      console.log(`   Estado esperado: ${expectedStatus}`);
      console.log(`   Estado actual: ${actualStatus}`);
      
      if (expectedStatus !== actualStatus) {
        console.log(`🚨 INCONSISTENCIA: Estado "${actualStatus}" no coincide con pasos (debería ser "${expectedStatus}")`);
        
        // Si todos los pasos están pendientes pero el estado es Aprobado, hay un problema
        if (pendingObligatory.length > 0 && actualStatus === "Aprobado") {
          console.log(`❌ PROBLEMA CRÍTICO: Solicitud marcada como Aprobada con pasos pendientes`);
        }
      } else {
        console.log(`✅ Estado consistente con pasos de aprobación`);
      }
    } else {
      console.log(`❌ Error obteniendo pasos: ${stepsResponse.status}`);
    }

    // 5. Verificar historial de la solicitud
    console.log("\n5. Verificando historial...");
    
    const historyResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/history`);
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log(`📚 Entradas en historial: ${history.length}`);
      
      history.forEach((entry, i) => {
        console.log(`   ${i + 1}. ${entry.newState || 'N/A'} - ${entry.changedBy} - ${entry.changeReason || 'Sin razón'}`);
        if (entry.fechaCreacion) {
          console.log(`      Fecha: ${new Date(entry.fechaCreacion).toLocaleString()}`);
        }
      });
    } else {
      console.log(`❌ Error obteniendo historial: ${historyResponse.status}`);
    }

    // 6. Verificar esquema de aprobación utilizado
    console.log("\n6. Verificando esquema de aprobación...");
    
    const schemasResponse = await fetch(`${BASE_URL}/api/approval-schemas`);
    if (schemasResponse.ok) {
      const schemas = await schemasResponse.json();
      
      // Buscar esquema que coincida
      const matchingSchema = schemas.find(s => 
        s.tipoSolicitud === newRequest.tipo && 
        s.motivos && 
        s.motivos.includes(newRequest.motivo)
      );
      
      if (matchingSchema) {
        console.log(`📋 Esquema utilizado: "${matchingSchema.nombre}" (ID: ${matchingSchema.id})`);
        console.log(`   Tipo: ${matchingSchema.tipoSolicitud}`);
        console.log(`   Motivos: ${matchingSchema.motivos?.join(', ') || 'N/A'}`);
        
        // Verificar pasos del esquema
        const schemaStepsResponse = await fetch(`${BASE_URL}/api/approval-schemas/${matchingSchema.id}/steps`);
        if (schemaStepsResponse.ok) {
          const schemaSteps = await schemaStepsResponse.json();
          console.log(`   Pasos en esquema: ${schemaSteps.length}`);
          
          schemaSteps.forEach(step => {
            console.log(`      ${step.orden}. ${step.perfil} (${step.obligatorio})`);
          });
        }
      } else {
        console.log(`❌ No se encontró esquema coincidente para tipo "${newRequest.tipo}" y motivo "${newRequest.motivo}"`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL DEBUG");
    console.log("=".repeat(60));
    
    const finalCheckResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
    const finalRequest = await finalCheckResponse.json();
    
    console.log(`📋 Solicitud ID: ${newRequest.id}`);
    console.log(`📊 Estado final: ${finalRequest.estado}`);
    console.log(`🎯 Motivo: ${finalRequest.motivo}`);
    console.log(`📅 Fecha: ${finalRequest.fechaSolicitada}`);
    
    if (finalRequest.estado === "Aprobado") {
      console.log(`🚨 PROBLEMA CONFIRMADO: Nueva solicitud auto-aprobada`);
      console.log(`💡 Investigar: ¿Qué proceso está cambiando el estado automáticamente?`);
    } else {
      console.log(`✅ Estado correcto: Solicitud permanece en "${finalRequest.estado}"`);
    }

  } catch (error) {
    console.error("❌ Error en debug del proceso:", error);
  }
}

// Ejecutar el debug
debugRequestCreationProcess();