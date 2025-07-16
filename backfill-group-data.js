/**
 * Script para rellenar la información de grupo en solicitudes existentes
 */

async function backfillGroupData() {
  console.log('📍 Rellenando información de grupo en solicitudes existentes');
  console.log('='.repeat(60));

  try {
    // 1. Obtener todas las solicitudes sin información de grupo
    console.log('\n1. Obteniendo solicitudes sin información de grupo...');
    const requestsResponse = await fetch('http://localhost:5000/api/requests');
    const allRequests = await requestsResponse.json();
    
    const requestsWithoutGroup = allRequests.filter(r => !r.grupo && r.identificadorUsuario);
    console.log(`   📊 Solicitudes sin grupo: ${requestsWithoutGroup.length} de ${allRequests.length}`);

    // 2. Obtener datos completos de usuarios
    console.log('\n2. Obteniendo datos completos de usuarios...');
    const usersResponse = await fetch('http://localhost:5000/api/users-complete');
    const users = await usersResponse.json();
    console.log(`   📊 Usuarios obtenidos: ${users.length}`);

    // 3. Actualizar solicitudes con información de grupo
    console.log('\n3. Actualizando solicitudes con información de grupo...');
    let updatedCount = 0;

    for (const request of requestsWithoutGroup) {
      const user = users.find(u => u.Identifier === request.identificadorUsuario);
      
      if (user && user.GroupDescription) {
        try {
          const updateResponse = await fetch(`http://localhost:5000/api/requests/${request.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grupo: user.GroupDescription })
          });

          if (updateResponse.ok) {
            console.log(`   ✅ Solicitud ${request.id}: Grupo "${user.GroupDescription}" agregado para ${request.identificadorUsuario}`);
            updatedCount++;
          } else {
            console.log(`   ❌ Error actualizando solicitud ${request.id}: ${updateResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error actualizando solicitud ${request.id}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  No se encontró usuario ${request.identificadorUsuario} en datos de GeoVictoria`);
      }
    }

    // 4. Verificar resultados
    console.log('\n4. Verificando resultados...');
    const updatedRequestsResponse = await fetch('http://localhost:5000/api/requests');
    const updatedRequests = await updatedRequestsResponse.json();
    const withGroupCount = updatedRequests.filter(r => r.grupo).length;

    console.log(`   📊 Solicitudes actualizadas: ${updatedCount}`);
    console.log(`   📊 Total con grupo ahora: ${withGroupCount}/${updatedRequests.length}`);

    if (updatedCount > 0) {
      console.log('\n🎉 PROCESO COMPLETADO: Información de grupo agregada exitosamente');
    } else {
      console.log('\n⚠️  No se actualizaron solicitudes - posiblemente ya tienen información de grupo');
    }

  } catch (error) {
    console.error('❌ Error durante el proceso:', error.message);
  }
}

// Ejecutar script
backfillGroupData();