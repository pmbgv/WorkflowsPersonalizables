/**
 * Script para crear múltiples solicitudes de demo para presentación a clientes
 * Crea diferentes escenarios: pendientes en paso 1, paso 2, y completadas
 */

async function createDemoRequest(data) {
  try {
    const response = await fetch("http://localhost:5000/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error("Error creando solicitud:", error);
    return null;
  }
}

async function approveStep(requestId, stepId, userProfile, comentario) {
  try {
    const response = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps/${stepId}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "Aprobado",
        userProfile,
        comentario
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Error aprobando paso:", error);
    return null;
  }
}

async function getApprovalSteps(requestId) {
  try {
    const response = await fetch(`http://localhost:5000/api/requests/${requestId}/approval-steps`);
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo pasos:", error);
    return [];
  }
}

async function createDemoScenarios() {
  console.log("🎯 CREANDO ESCENARIOS DE DEMO PARA CLIENTES\n");

  const demoRequests = [
    {
      name: "Solicitud pendiente - Paso 1 (Supervisor)",
      data: {
        tipo: "Permiso",
        fechaSolicitada: "2025-07-03",
        fechaFin: "2025-07-03",
        asunto: "Permiso personal - Demo 1",
        descripcion: "Solicitud para cita médica",
        solicitadoPor: "Ana García",
        usuarioSolicitado: "Ana García", 
        identificador: "demo001",
        identificadorUsuario: "demo001",
        motivo: "Ley 20823",
        archivosAdjuntos: [],
        diasSolicitados: 1,
        estado: "Pendiente"
      },
      scenario: "pending_step1"
    },
    {
      name: "Solicitud pendiente - Paso 1 (Supervisor) #2", 
      data: {
        tipo: "Permiso",
        fechaSolicitada: "2025-07-04",
        fechaFin: "2025-07-04",
        asunto: "Trámite bancario - Demo 2",
        descripcion: "Gestión documentos personales",
        solicitadoPor: "Carlos López",
        usuarioSolicitado: "Carlos López",
        identificador: "demo002", 
        identificadorUsuario: "demo002",
        motivo: "Ley 20823",
        archivosAdjuntos: [],
        diasSolicitados: 1,
        estado: "Pendiente"
      },
      scenario: "pending_step1"
    },
    {
      name: "Solicitud pendiente - Paso 2 (AdminCuenta)",
      data: {
        tipo: "Permiso", 
        fechaSolicitada: "2025-07-05",
        fechaFin: "2025-07-05",
        asunto: "Gestión familiar - Demo 3",
        descripcion: "Asunto familiar urgente",
        solicitadoPor: "María Rodríguez",
        usuarioSolicitado: "María Rodríguez",
        identificador: "demo003",
        identificadorUsuario: "demo003", 
        motivo: "Ley 20823",
        archivosAdjuntos: [],
        diasSolicitados: 1,
        estado: "Pendiente"
      },
      scenario: "pending_step2"
    },
    {
      name: "Solicitud completamente aprobada",
      data: {
        tipo: "Permiso",
        fechaSolicitada: "2025-07-06", 
        fechaFin: "2025-07-06",
        asunto: "Vacaciones planificadas - Demo 4",
        descripcion: "Día de descanso personal",
        solicitadoPor: "Pedro Martínez",
        usuarioSolicitado: "Pedro Martínez",
        identificador: "demo004",
        identificadorUsuario: "demo004",
        motivo: "Ley 20823", 
        archivosAdjuntos: [],
        diasSolicitados: 1,
        estado: "Pendiente"
      },
      scenario: "fully_approved"
    }
  ];

  for (const requestConfig of demoRequests) {
    console.log(`📝 Creando: ${requestConfig.name}`);
    
    const request = await createDemoRequest(requestConfig.data);
    if (!request) {
      console.log(`❌ Error creando ${requestConfig.name}`);
      continue;
    }

    console.log(`✅ Solicitud ${request.id} creada`);

    // Configurar según escenario
    const steps = await getApprovalSteps(request.id);
    
    if (requestConfig.scenario === "pending_step1") {
      console.log(`   → Dejando en paso 1 (Supervisor)`);
      
    } else if (requestConfig.scenario === "pending_step2") {
      console.log(`   → Aprobando paso 1, dejando en paso 2`);
      const step1 = steps.find(s => s.orden === 1);
      if (step1) {
        await approveStep(request.id, step1.id, "#supervisor#", "Aprobado por supervisor - Demo");
        console.log(`   ✅ Paso 1 aprobado`);
      }
      
    } else if (requestConfig.scenario === "fully_approved") {
      console.log(`   → Aprobando todos los pasos`);
      const step1 = steps.find(s => s.orden === 1);
      const step2 = steps.find(s => s.orden === 2);
      
      if (step1) {
        await approveStep(request.id, step1.id, "#supervisor#", "Aprobado por supervisor - Demo");
        console.log(`   ✅ Paso 1 aprobado`);
      }
      
      if (step2) {
        await approveStep(request.id, step2.id, "#adminCuenta#", "Aprobado por adminCuenta - Demo");
        console.log(`   ✅ Paso 2 aprobado - Solicitud completada`);
      }
    }
    
    console.log();
  }

  console.log("🎉 DATOS DE DEMO CREADOS EXITOSAMENTE");
  console.log("\n📋 RESUMEN PARA LA DEMO:");
  console.log("• Solicitudes pendientes paso 1: Visibles solo para #supervisor#");
  console.log("• Solicitudes pendientes paso 2: Visibles solo para #adminCuenta#"); 
  console.log("• Solicitudes completadas: No aparecen en listas pendientes");
  console.log("\n🎯 Listo para demostrar flujo a clientes!");
}

createDemoScenarios();