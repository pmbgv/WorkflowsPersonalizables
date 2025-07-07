/**
 * Test completo para verificar el nuevo comportamiento de visibilidad:
 * 1. Crear nueva solicitud 
 * 2. Verificar que adminCuenta la ve en "Todas las solicitudes" desde el inicio
 * 3. Verificar que supervisor aprueba paso 1
 * 4. Verificar que adminCuenta ahora la ve en "Solicitudes pendientes"
 */

const BASE_URL = "http://localhost:5000";

function formatDateToLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function testCompleteVisibilityWorkflow() {
  console.log("🎯 TEST: Flujo completo de visibilidad adminCuenta");
  console.log("=".repeat(60));

  try {
    // 1. Crear nueva solicitud
    console.log("\n1. Creando nueva solicitud...");
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const requestDate = formatDateToLocal(tomorrow);
    
    const newRequestData = {
      tipo: "Permiso",
      fechaSolicitada: requestDate,
      fechaFin: requestDate,
      asunto: "Test visibilidad completa adminCuenta",
      descripcion: "Verificación de visibilidad en pestañas",
      solicitadoPor: "Prueba GC",
      identificador: "20836784",
      usuarioSolicitado: "Prueba GC",
      identificadorUsuario: "20836784",
      motivo: "Ley 20823",
      archivosAdjuntos: []
    };

    const createResponse = await fetch(`${BASE_URL}/api/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRequestData)
    });

    if (!createResponse.ok) {
      console.log(`❌ Error creando solicitud: ${createResponse.status}`);
      return;
    }

    const newRequest = await createResponse.json();
    console.log(`✅ Solicitud creada: ID ${newRequest.id}, Estado: ${newRequest.estado}`);

    // 2. Verificar estado inicial - adminCuenta "Solicitudes pendientes"
    console.log("\n2. Verificando adminCuenta 'Solicitudes pendientes' inicial...");
    
    const adminPendingResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
    if (adminPendingResponse.ok) {
      const adminPendingRequests = await adminPendingResponse.json();
      const foundInPending = adminPendingRequests.find(r => r.id === newRequest.id);
      
      console.log(`🔧 En "Solicitudes pendientes": ${foundInPending ? `SÍ (${foundInPending.estado})` : 'NO'}`);
    }

    // 3. Verificar estado inicial - adminCuenta "Todas las solicitudes"  
    console.log("\n3. Verificando adminCuenta 'Todas las solicitudes' inicial...");
    
    const adminAllResponse = await fetch(`${BASE_URL}/api/requests/all-requests/${encodeURIComponent('#adminCuenta#')}`);
    if (adminAllResponse.ok) {
      const adminAllRequests = await adminAllResponse.json();
      const foundInAll = adminAllRequests.find(r => r.id === newRequest.id);
      
      console.log(`📋 En "Todas las solicitudes": ${foundInAll ? `SÍ (${foundInAll.estado})` : 'NO'}`);
    }

    // 4. Verificar supervisor pendientes
    console.log("\n4. Verificando supervisor 'Solicitudes pendientes'...");
    
    const supervisorResponse = await fetch(`${BASE_URL}/api/requests/pending-approval/183955671?userProfile=${encodeURIComponent('#supervisor#')}`);
    if (supervisorResponse.ok) {
      const supervisorRequests = await supervisorResponse.json();
      const foundInSupervisor = supervisorRequests.find(r => r.id === newRequest.id);
      
      console.log(`👔 En supervisor pendientes: ${foundInSupervisor ? `SÍ (${foundInSupervisor.estado})` : 'NO'}`);

      // 5. Si supervisor la ve, aprobar paso 1
      if (foundInSupervisor) {
        console.log("\n5. Supervisor aprobando paso 1...");
        
        const stepsResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps`);
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json();
          const supervisorStep = steps.find(s => s.approvalStep.perfil === '#supervisor#');
          
          if (supervisorStep) {
            const approvalResponse = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approval-steps/${supervisorStep.requestApprovalStep.id}/process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'Aprobado',
                userProfile: '#supervisor#',
                comentario: 'Paso 1 aprobado - test visibilidad'
              })
            });

            const approvalResult = await approvalResponse.json();
            console.log(`🔄 Resultado: ${approvalResult.success ? 'ÉXITO' : 'ERROR'}`);
            console.log(`📊 Estado: ${approvalResult.requestStatus}`);

            if (approvalResult.success) {
              // Esperar un momento para que se procese
              await new Promise(resolve => setTimeout(resolve, 500));

              // 6. Verificar adminCuenta después de paso 1
              console.log("\n6. Verificando adminCuenta después de paso 1...");
              
              // Pendientes
              const adminPendingAfter = await fetch(`${BASE_URL}/api/requests/pending-approval/262698211?userProfile=${encodeURIComponent('#adminCuenta#')}`);
              if (adminPendingAfter.ok) {
                const adminPendingAfterRequests = await adminPendingAfter.json();
                const foundInPendingAfter = adminPendingAfterRequests.find(r => r.id === newRequest.id);
                
                console.log(`🔧 En "Solicitudes pendientes": ${foundInPendingAfter ? `SÍ (${foundInPendingAfter.estado})` : 'NO'}`);
              }

              // Todas las solicitudes
              const adminAllAfter = await fetch(`${BASE_URL}/api/requests/all-requests/${encodeURIComponent('#adminCuenta#')}`);
              if (adminAllAfter.ok) {
                const adminAllAfterRequests = await adminAllAfter.json();
                const foundInAllAfter = adminAllAfterRequests.find(r => r.id === newRequest.id);
                
                console.log(`📋 En "Todas las solicitudes": ${foundInAllAfter ? `SÍ (${foundInAllAfter.estado})` : 'NO'}`);
              }

              // 7. Verificar estado en BD
              const finalCheck = await fetch(`${BASE_URL}/api/requests/${newRequest.id}`);
              if (finalCheck.ok) {
                const finalRequest = await finalCheck.json();
                console.log(`📋 Estado en BD: ${finalRequest.estado}`);
              }
            }
          }
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎯 RESULTADO ESPERADO");
    console.log("=".repeat(60));
    console.log("✅ INICIAL:");
    console.log("   - AdminCuenta NO ve en 'Solicitudes pendientes' (no es su turno)");
    console.log("   - AdminCuenta SÍ ve en 'Todas las solicitudes' (tiene rol en flujo)");
    console.log("   - Supervisor SÍ ve en 'Solicitudes pendientes' (es su turno)");
    console.log("");
    console.log("✅ DESPUÉS DEL PASO 1:");
    console.log("   - AdminCuenta SÍ ve en 'Solicitudes pendientes' (ahora es su turno)");
    console.log("   - AdminCuenta SÍ ve en 'Todas las solicitudes' (mantiene visibilidad)");
    console.log("   - Estado sigue 'Pendiente' (necesita paso 2)");

  } catch (error) {
    console.error("❌ Error en test de flujo completo:", error);
  }
}

// Ejecutar el test
testCompleteVisibilityWorkflow();