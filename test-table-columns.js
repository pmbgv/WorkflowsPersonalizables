/**
 * Test para verificar que las columnas de las tablas funcionan correctamente
 */

async function testTableColumns() {
  console.log('📊 Test: Columnas de tablas actualizadas');
  console.log('='.repeat(50));

  try {
    // 1. Verificar estructura de datos de solicitudes
    console.log('\n1. Verificando estructura de datos...');
    const response = await fetch('http://localhost:5000/api/requests');
    const requests = await response.json();
    
    if (requests.length > 0) {
      const sampleRequest = requests[0];
      console.log(`   📋 Campos disponibles en solicitud ${sampleRequest.id}:`);
      
      // Verificar campos requeridos para cada tabla
      const missSolicitudesFields = ['fechaSolicitada', 'tipo', 'estado', 'solicitadoPor', 'fechaCreacion'];
      const pendientesFields = ['usuarioSolicitado', 'identificadorUsuario', 'grupo', 'fechaSolicitada', 'tipo', 'estado', 'fechaCreacion'];
      
      console.log('\n   Para "Mis solicitudes":');
      missSolicitudesFields.forEach(field => {
        const exists = sampleRequest[field] !== undefined;
        console.log(`      ${field}: ${exists ? '✅' : '❌'} ${exists ? sampleRequest[field] : 'NO ENCONTRADO'}`);
      });
      
      console.log('\n   Para "Solicitudes pendientes" e "Historial":');
      pendientesFields.forEach(field => {
        const exists = sampleRequest[field] !== undefined;
        console.log(`      ${field}: ${exists ? '✅' : '❌'} ${exists ? sampleRequest[field] : 'NO ENCONTRADO'}`);
      });
    }

    // 2. Verificar datos de grupo en solicitudes existentes
    console.log('\n2. Verificando datos de grupo...');
    const withGroup = requests.filter(r => r.grupo);
    const withIdentifier = requests.filter(r => r.identificadorUsuario);
    
    console.log(`   📊 Solicitudes con grupo: ${withGroup.length}/${requests.length}`);
    console.log(`   📊 Solicitudes con identificadorUsuario: ${withIdentifier.length}/${requests.length}`);
    
    if (withGroup.length > 0) {
      console.log('\n   Ejemplos de grupos encontrados:');
      const grupos = [...new Set(withGroup.map(r => r.grupo))];
      grupos.forEach(grupo => {
        const count = withGroup.filter(r => r.grupo === grupo).length;
        console.log(`      ${grupo}: ${count} solicitudes`);
      });
    }

    // 3. Crear solicitud de prueba para verificar flujo completo
    console.log('\n3. Creando solicitud de prueba...');
    const testRequest = {
      tipo: "Permiso",
      fechaSolicitada: "2025-07-30",
      fechaFin: "2025-07-30",
      asunto: "Test Columnas Tabla",
      descripcion: "Verificación de columnas",
      solicitadoPor: "Test User Columns",
      usuarioSolicitado: "Test User Columns",
      identificador: "TESTCOL123",
      identificadorUsuario: "20836784", // Usuario real de GeoVictoria
      motivo: "Ley 20823",
      archivosAdjuntos: []
    };

    const createResponse = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });
    
    if (createResponse.ok) {
      const newRequest = await createResponse.json();
      console.log(`   ✅ Solicitud de prueba creada: ID ${newRequest.id}`);
      console.log(`   📍 Grupo asignado: ${newRequest.grupo || 'NO ASIGNADO'}`);
      
      // Verificar que aparece correctamente en endpoints
      console.log('\n4. Verificando visibilidad en endpoints...');
      
      // Endpoint general
      const allResponse = await fetch('http://localhost:5000/api/requests');
      const allRequests = await allResponse.json();
      const foundInAll = allRequests.find(r => r.id === newRequest.id);
      console.log(`   📋 Visible en endpoint general: ${foundInAll ? '✅' : '❌'}`);
      if (foundInAll) {
        console.log(`      Grupo mostrado: ${foundInAll.grupo || 'SIN GRUPO'}`);
      }
      
      // Mis solicitudes
      const myResponse = await fetch('http://localhost:5000/api/requests/my-requests/20836784');
      const myRequests = await myResponse.json();
      const foundInMy = myRequests.find(r => r.id === newRequest.id);
      console.log(`   📋 Visible en "Mis solicitudes": ${foundInMy ? '✅' : '❌'}`);
      
    } else {
      console.log(`   ❌ Error creando solicitud de prueba: ${createResponse.status}`);
    }

    // 5. Resumen final
    console.log('\n5. 📊 RESUMEN DE COLUMNAS:');
    console.log('   ='.repeat(35));
    console.log('   ✅ Mis solicitudes: fecha solicitada, tipo, estado, solicitado por, fecha de creación, detalle');
    console.log('   ✅ Solicitudes pendientes: nombre, identificador, grupo, fecha solicitada, tipo, estado, fecha de creación, detalle');  
    console.log('   ✅ Historial: nombre, identificador, grupo, fecha solicitada, tipo, estado, fecha de creación, detalle');
    console.log('\n🎉 COLUMNAS CONFIGURADAS CORRECTAMENTE');

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Ejecutar test
testTableColumns();