/**
 * Test completo para demo del flujo de aprobación secuencial
 * Crea datos de prueba y simula el flujo supervisor → adminCuenta
 */

async function createDemoData() {
  console.log("=== CREANDO DATOS DE PRUEBA PARA DEMO ===");
  
  // 1. Crear una nueva solicitud con esquema de 2 pasos obligatorios
  const requestData = {
    tipo: "Permiso",
    fechaSolicitada: "2025-07-02",
    fechaFin: "2025-07-02", 
    asunto: "Demo Flujo Aprobación",
    descripcion: "Solicitud para demostrar flujo supervisor -> adminCuenta",
    solicitadoPor: "Demo User",
    usuarioSolicitado: "Demo User",
    identificador: "demo123",
    identificadorUsuario: "demo123",
    motivo: "Ley 20823",
    archivosAdjuntos: [],
    diasSolicitados: 1,
    estado: "Pendiente"
  };

  try {
    const response = await fetch("http://localhost:5000/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Error creating request: ${response.status}`);
    }

    const newRequest = await response.json();
    console.log(`✅ Solicitud creada: ID ${newRequest.id}`);
    return newRequest;
  } catch (error) {
    console.error("❌ Error creando solicitud:", error);
    return null;
  }
}

async function testSupervisorFlow(requestId) {
  console.log(`\n=== PASO 1: SUPERVISOR APRUEBA SOLICITUD ${requestId} ===`);
  
  // Verificar que supervisor puede ver la solicitud
  const pendingResponse = await fetch(`http://localhost:5000/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
  const pendingRequests = await pendingResponse.json();
  
  const supervisorCanSee = pendingRequests.some(req => req.id === requestId);
  console.log(supervisorCanSee ? "✅ Supervisor puede ver la solicitud" : "❌ Supervisor NO puede ver la solicitud");
  
  if (!supervisorCanSee) {
    console.log("📋 Solicitudes que ve supervisor:", pendingRequests.map(r => r.id));
    return false;
  }

  // Obtener pasos de aprobación
  const stepsResponse = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps`);
  const steps = await stepsResponse.json();
  console.log("📋 Pasos de aprobación:", steps.map(s => `Paso ${s.orden}: ${s.perfil} (${s.estado})`));

  // Supervisor aprueba primer paso
  const firstStep = steps.find(s => s.orden === 1);
  if (!firstStep) {
    console.log("❌ No se encontró primer paso");
    return false;
  }

  const approvalResponse = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps/${firstStep.id}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "Aprobado",
      userProfile: "#supervisor#",
      comentario: "Aprobado por supervisor - Demo"
    })
  });

  const approvalResult = await approvalResponse.json();
  console.log("📝 Resultado aprobación supervisor:", approvalResult);
  
  return approvalResult.success;
}

async function testAdminCuentaFlow(requestId) {
  console.log(`\n=== PASO 2: ADMINCUENTA APRUEBA SOLICITUD ${requestId} ===`);
  
  // Verificar que adminCuenta ahora puede ver la solicitud
  const pendingResponse = await fetch(`http://localhost:5000/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
  const pendingRequests = await pendingResponse.json();
  
  const adminCanSee = pendingRequests.some(req => req.id === requestId);
  console.log(adminCanSee ? "✅ AdminCuenta puede ver la solicitud" : "❌ AdminCuenta NO puede ver la solicitud");
  
  if (!adminCanSee) {
    console.log("📋 Solicitudes que ve adminCuenta:", pendingRequests.map(r => r.id));
    return false;
  }

  // Obtener pasos de aprobación actualizados
  const stepsResponse = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps`);
  const steps = await stepsResponse.json();
  console.log("📋 Estado actual de pasos:", steps.map(s => `Paso ${s.orden}: ${s.perfil} (${s.estado})`));

  // AdminCuenta aprueba segundo paso
  const secondStep = steps.find(s => s.orden === 2);
  if (!secondStep) {
    console.log("❌ No se encontró segundo paso");
    return false;
  }

  const approvalResponse = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps/${secondStep.id}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "Aprobado",
      userProfile: "#adminCuenta#",
      comentario: "Aprobado por adminCuenta - Demo final"
    })
  });

  const approvalResult = await approvalResponse.json();
  console.log("📝 Resultado aprobación adminCuenta:", approvalResult);
  
  return approvalResult.success && approvalResult.requestStatus === "Aprobado";
}

async function verifyFinalState(requestId) {
  console.log(`\n=== VERIFICACIÓN FINAL SOLICITUD ${requestId} ===`);
  
  // Verificar estado final de la solicitud
  const requestResponse = await fetch(`http://localhost:5000/api/requests/${requestId}`);
  const finalRequest = await requestResponse.json();
  console.log("📋 Estado final solicitud:", finalRequest.estado);
  
  // Verificar que ya no aparece en listas pendientes
  const supervisorPending = await fetch(`http://localhost:5000/api/requests/pending-approval/183955671?userProfile=%23supervisor%23`);
  const supervisorRequests = await supervisorPending.json();
  
  const adminPending = await fetch(`http://localhost:5000/api/requests/pending-approval/262698211?userProfile=%23adminCuenta%23`);
  const adminRequests = await adminPending.json();
  
  const stillInSupervisor = supervisorRequests.some(req => req.id === requestId);
  const stillInAdmin = adminRequests.some(req => req.id === requestId);
  
  console.log(stillInSupervisor ? "❌ Aún aparece en supervisor" : "✅ Ya no aparece en supervisor");
  console.log(stillInAdmin ? "❌ Aún aparece en adminCuenta" : "✅ Ya no aparece en adminCuenta");
  
  return finalRequest.estado === "Aprobado" && !stillInSupervisor && !stillInAdmin;
}

async function runDemoFlow() {
  console.log("🚀 INICIANDO TEST COMPLETO DE FLUJO DE DEMO\n");
  
  try {
    // Paso 1: Crear datos de prueba
    const newRequest = await createDemoData();
    if (!newRequest) {
      console.log("❌ FALLO: No se pudo crear solicitud de prueba");
      return;
    }

    // Paso 2: Supervisor aprueba
    const supervisorSuccess = await testSupervisorFlow(newRequest.id);
    if (!supervisorSuccess) {
      console.log("❌ FALLO: Supervisor no pudo aprobar");
      return;
    }

    // Paso 3: AdminCuenta aprueba  
    const adminSuccess = await testAdminCuentaFlow(newRequest.id);
    if (!adminSuccess) {
      console.log("❌ FALLO: AdminCuenta no pudo aprobar");
      return;
    }

    // Paso 4: Verificar estado final
    const finalSuccess = await verifyFinalState(newRequest.id);
    if (!finalSuccess) {
      console.log("❌ FALLO: Estado final incorrecto");
      return;
    }

    console.log("\n🎉 ÉXITO: Flujo completo de demo funcionando correctamente");
    console.log(`📋 Solicitud ${newRequest.id} completó el flujo supervisor → adminCuenta → Aprobado`);
    
  } catch (error) {
    console.error("❌ ERROR EN TEST:", error);
  }
}

// Ejecutar test
runDemoFlow();