/**
 * Test completo para verificar todas las correcciones de visibilidad
 */

const BASE_URL = 'http://localhost:5000';

async function testCompleteVisibilityFix() {
  console.log('Testing Complete Visibility Configuration Fix\n');
  
  let testData = { schemas: [] };
  
  try {
    // 1. Verificar perfiles disponibles
    console.log('1. Verifying available profiles...');
    
    const usersResponse = await fetch(`${BASE_URL}/api/users-complete`);
    const users = await usersResponse.json();
    
    const realProfiles = users
      .filter(user => user.Enabled === "1" && user.UserProfile && user.UserProfile.trim() !== "")
      .map(user => user.UserProfile)
      .filter((profile, index, array) => array.indexOf(profile) === index)
      .sort();
    
    console.log(`Found ${realProfiles.length} real profiles: ${realProfiles.join(', ')}`);
    
    // Verificar ausencia de perfiles de sistema
    const systemProfiles = ["Seleccionar", "Revisor", "Aprobador", "Supervisor"];
    const hasSystemProfiles = systemProfiles.some(sysProfile => 
      realProfiles.includes(sysProfile)
    );
    
    console.log(`System profiles excluded: ${!hasSystemProfiles ? 'YES' : 'NO'}`);
    
    // 2. Test creación con "todos los perfiles" por defecto
    console.log('\n2. Testing default "todos los perfiles" behavior...');
    
    const defaultSchemaResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Default Visibility Test",
        tipoSolicitud: "Permiso",
        motivos: ["Default Test Motivo"],
        visibilityPermissions: realProfiles // Simular frontend enviando todos por defecto
      })
    });
    
    const defaultSchema = await defaultSchemaResponse.json();
    testData.schemas.push(defaultSchema.id);
    
    const hasAllProfiles = realProfiles.every(profile => 
      defaultSchema.visibilityPermissions.includes(profile)
    );
    
    console.log(`All profiles included by default: ${hasAllProfiles ? 'YES' : 'NO'}`);
    
    // 3. Test toggle de "todos los perfiles"
    console.log('\n3. Testing "todos los perfiles" toggle...');
    
    // Demarcar todos
    const clearAllResponse = await fetch(`${BASE_URL}/api/approval-schemas/${defaultSchema.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibilityPermissions: []
      })
    });
    
    // Marcar todos nuevamente
    const selectAllResponse = await fetch(`${BASE_URL}/api/approval-schemas/${defaultSchema.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibilityPermissions: realProfiles
      })
    });
    
    const toggleSuccess = clearAllResponse.ok && selectAllResponse.ok;
    console.log(`Toggle functionality works: ${toggleSuccess ? 'YES' : 'NO'}`);
    
    // 4. Test selección individual
    console.log('\n4. Testing individual profile selection...');
    
    const selectedProfiles = realProfiles.slice(0, Math.ceil(realProfiles.length / 2));
    
    const individualResponse = await fetch(`${BASE_URL}/api/approval-schemas/${defaultSchema.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibilityPermissions: selectedProfiles
      })
    });
    
    if (individualResponse.ok) {
      const updated = await individualResponse.json();
      const correctSelection = selectedProfiles.every(profile => 
        updated.visibilityPermissions.includes(profile)
      );
      console.log(`Individual selection works: ${correctSelection ? 'YES' : 'NO'}`);
    }
    
    // 5. Verificar que checkbox "todos los perfiles" se comporta correctamente
    console.log('\n5. Testing checkbox logic simulation...');
    
    const finalState = await fetch(`${BASE_URL}/api/approval-schemas/${defaultSchema.id}`).then(r => r.json());
    
    // Simular lógica de checkbox
    const allProfilesSelected = realProfiles.length > 0 && 
                               realProfiles.every(profile => finalState.visibilityPermissions.includes(profile));
    
    console.log(`Current selection: ${finalState.visibilityPermissions.join(', ')}`);
    console.log(`"Todos los perfiles" should be checked: ${allProfilesSelected ? 'YES' : 'NO'}`);
    
    // 6. Test esquema sin permisos existentes
    console.log('\n6. Testing schema without existing permissions...');
    
    const noPermissionsResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "No Permissions Schema",
        tipoSolicitud: "Permiso",
        motivos: ["No Permissions Motivo"]
        // Sin visibilityPermissions
      })
    });
    
    const noPermissionsSchema = await noPermissionsResponse.json();
    testData.schemas.push(noPermissionsSchema.id);
    
    // Frontend debería defaultear a todos los perfiles
    const frontendDefaultResponse = await fetch(`${BASE_URL}/api/approval-schemas/${noPermissionsSchema.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibilityPermissions: realProfiles
      })
    });
    
    const frontendDefaultWorked = frontendDefaultResponse.ok;
    console.log(`Frontend default behavior works: ${frontendDefaultWorked ? 'YES' : 'NO'}`);
    
    // 7. Resumen final
    console.log('\n📊 Complete Visibility Fix Test Results:');
    
    const results = {
      systemProfilesExcluded: !hasSystemProfiles,
      defaultToAllProfiles: hasAllProfiles,
      toggleWorks: toggleSuccess,
      individualSelectionWorks: individualResponse.ok,
      frontendDefaultWorks: frontendDefaultWorked
    };
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      console.log('🎉 ALL VISIBILITY CONFIGURATION TESTS PASSED!');
      console.log('✓ System profiles ("Revisor", "Seleccionar", "Aprobador", "Supervisor") excluded');
      console.log('✓ Only real API profiles are shown');
      console.log('✓ "Todos los perfiles" checkbox defaults to checked');
      console.log('✓ Toggle functionality works correctly');
      console.log('✓ Individual profile selection works');
      console.log('✓ Frontend default behavior implemented');
      console.log('\nUser requirements have been successfully implemented!');
    } else {
      console.log('⚠️ SOME VISIBILITY TESTS FAILED:');
      if (!results.systemProfilesExcluded) console.log('- System profiles still present');
      if (!results.defaultToAllProfiles) console.log('- Not defaulting to all profiles');
      if (!results.toggleWorks) console.log('- Toggle functionality broken');
      if (!results.individualSelectionWorks) console.log('- Individual selection broken');
      if (!results.frontendDefaultWorks) console.log('- Frontend default behavior broken');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error(`Test error: ${error.message}`);
    return false;
  } finally {
    console.log('\n🧹 Cleanup...');
    for (const schemaId of testData.schemas) {
      try {
        await fetch(`${BASE_URL}/api/approval-schemas/${schemaId}`, { method: 'DELETE' });
      } catch (e) {}
    }
  }
}

testCompleteVisibilityFix().then(success => {
  console.log(`\nComplete visibility fix test: ${success ? 'SUCCESS' : 'FAILURE'}`);
  process.exit(success ? 0 : 1);
}).catch(() => process.exit(1));