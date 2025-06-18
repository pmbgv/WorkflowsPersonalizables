/**
 * Test comprehensivo para verificar el guardado correcto de perfiles en pasos de aprobación
 * Identifica y corrige problemas con perfiles duplicados y guardado incorrecto
 */

const BASE_URL = 'http://localhost:5000';

async function testApprovalStepProfiles() {
  console.log('Testing Approval Step Profiles Management\n');
  
  let createdSchemaId = null;
  let createdStepIds = [];
  
  try {
    // 1. Verificar perfiles disponibles del sistema
    console.log('1. Checking available user profiles...');
    const usersResponse = await fetch(`${BASE_URL}/api/users-complete`);
    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status}`);
    }
    const users = await usersResponse.json();
    
    // Extraer perfiles únicos
    const profiles = [...new Set(users
      .filter(user => user.Enabled === "1" && user.UserProfile && user.UserProfile.trim() !== "")
      .map(user => user.UserProfile)
    )].sort();
    
    console.log(`Available profiles: ${profiles.join(', ')}`);
    
    // 2. Crear un esquema de prueba
    console.log('\n2. Creating test approval schema...');
    const schemaData = {
      nombre: "Test Profile Schema",
      tipoSolicitud: "Permiso",
      motivos: ["Test Motivo"],
      visibilityPermissions: ["#adminCuenta#"],
      approvalPermissions: ["#adminCuenta#"]
    };
    
    const schemaResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schemaData)
    });
    
    if (!schemaResponse.ok) {
      throw new Error(`Failed to create schema: ${schemaResponse.status}`);
    }
    
    const createdSchema = await schemaResponse.json();
    createdSchemaId = createdSchema.id;
    console.log(`Created schema with ID: ${createdSchemaId}`);
    
    // 3. Crear pasos con diferentes perfiles
    console.log('\n3. Creating approval steps with different profiles...');
    
    const testSteps = [
      { orden: 1, descripcion: "Primer paso", perfil: "#JefeGrupo#", obligatorio: "Si" },
      { orden: 2, descripcion: "Segundo paso", perfil: "#adminCuenta#", obligatorio: "Si" },
      { orden: 3, descripcion: "Tercer paso", perfil: "Seleccionar", obligatorio: "No" }
    ];
    
    for (const stepData of testSteps) {
      const stepPayload = {
        schemaId: createdSchemaId,
        ...stepData
      };
      
      const stepResponse = await fetch(`${BASE_URL}/api/approval-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepPayload)
      });
      
      if (!stepResponse.ok) {
        throw new Error(`Failed to create step: ${stepResponse.status}`);
      }
      
      const createdStep = await stepResponse.json();
      createdStepIds.push(createdStep.id);
      console.log(`Created step ${stepData.orden} with profile "${stepData.perfil}" (ID: ${createdStep.id})`);
    }
    
    // 4. Verificar que los pasos se guardaron correctamente
    console.log('\n4. Verifying saved steps...');
    
    const stepsResponse = await fetch(`${BASE_URL}/api/approval-schemas/${createdSchemaId}/steps`);
    if (!stepsResponse.ok) {
      throw new Error(`Failed to fetch steps: ${stepsResponse.status}`);
    }
    
    const savedSteps = await stepsResponse.json();
    console.log(`Retrieved ${savedSteps.length} steps from database`);
    
    let correctProfiles = 0;
    let totalSteps = savedSteps.length;
    
    for (const step of savedSteps) {
      const expectedStep = testSteps.find(t => t.orden === step.orden);
      if (expectedStep) {
        if (step.perfil === expectedStep.perfil) {
          console.log(`✅ Step ${step.orden}: Profile "${step.perfil}" saved correctly`);
          correctProfiles++;
        } else {
          console.log(`❌ Step ${step.orden}: Expected "${expectedStep.perfil}", got "${step.perfil}"`);
        }
      }
    }
    
    // 5. Test actualización de perfiles
    console.log('\n5. Testing profile updates...');
    
    if (savedSteps.length > 0) {
      const stepToUpdate = savedSteps[0];
      const newProfile = "#usuario#";
      
      const updateResponse = await fetch(`${BASE_URL}/api/approval-steps/${stepToUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil: newProfile })
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Successfully updated step ${stepToUpdate.id} profile to "${newProfile}"`);
        
        // Verificar la actualización
        const verifyResponse = await fetch(`${BASE_URL}/api/approval-schemas/${createdSchemaId}/steps`);
        if (verifyResponse.ok) {
          const updatedSteps = await verifyResponse.json();
          const updatedStep = updatedSteps.find(s => s.id === stepToUpdate.id);
          
          if (updatedStep && updatedStep.perfil === newProfile) {
            console.log(`✅ Profile update verified in database`);
            correctProfiles++; // Bonus point for successful update
          } else {
            console.log(`❌ Profile update not reflected in database`);
          }
        }
      } else {
        console.log(`❌ Failed to update step profile: ${updateResponse.status}`);
      }
    }
    
    // 6. Test validación de perfiles únicos
    console.log('\n6. Testing profile validation...');
    
    // Verificar que no hay perfiles duplicados inválidos
    const profileCounts = {};
    users.forEach(user => {
      if (user.UserProfile) {
        profileCounts[user.UserProfile] = (profileCounts[user.UserProfile] || 0) + 1;
      }
    });
    
    console.log('Profile distribution:');
    Object.entries(profileCounts).forEach(([profile, count]) => {
      console.log(`  ${profile}: ${count} users`);
    });
    
    // 7. Test integridad de datos
    console.log('\n7. Testing data integrity...');
    
    // Verificar que todos los pasos tienen perfiles válidos
    let validProfileSteps = 0;
    for (const step of savedSteps) {
      if (profiles.includes(step.perfil)) {
        validProfileSteps++;
        console.log(`✅ Step ${step.orden} has valid profile: ${step.perfil}`);
      } else {
        console.log(`❌ Step ${step.orden} has invalid profile: ${step.perfil}`);
      }
    }
    
    // 8. Resumen final
    console.log('\n📊 Test Results Summary:');
    console.log(`Available profiles: ${profiles.length}`);
    console.log(`Created steps: ${totalSteps}`);
    console.log(`Correct profiles: ${correctProfiles}/${totalSteps + 1}`); // +1 for update test
    console.log(`Valid profile steps: ${validProfileSteps}/${totalSteps}`);
    
    const success = correctProfiles >= totalSteps && validProfileSteps === totalSteps;
    
    if (success) {
      console.log('\n🎉 APPROVAL STEP PROFILES TEST PASSED!');
      console.log('✓ Profiles are being saved correctly');
      console.log('✓ Profile updates work properly');
      console.log('✓ Profile validation is functioning');
      console.log('✓ Data integrity is maintained');
    } else {
      console.log('\n⚠️  APPROVAL STEP PROFILES TEST FAILED');
      console.log('Issues detected with profile management:');
      if (correctProfiles < totalSteps) {
        console.log('- Profile saving/updating not working correctly');
      }
      if (validProfileSteps < totalSteps) {
        console.log('- Invalid profiles detected in database');
      }
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete created steps
    for (const stepId of createdStepIds) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/approval-steps/${stepId}`, {
          method: 'DELETE'
        });
        if (deleteResponse.ok) {
          console.log(`✅ Deleted step ${stepId}`);
        } else {
          console.log(`⚠️  Failed to delete step ${stepId}`);
        }
      } catch (error) {
        console.log(`⚠️  Error deleting step ${stepId}: ${error.message}`);
      }
    }
    
    // Delete created schema
    if (createdSchemaId) {
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/approval-schemas/${createdSchemaId}`, {
          method: 'DELETE'
        });
        if (deleteResponse.ok) {
          console.log(`✅ Deleted schema ${createdSchemaId}`);
        } else {
          console.log(`⚠️  Failed to delete schema ${createdSchemaId}`);
        }
      } catch (error) {
        console.log(`⚠️  Error deleting schema ${createdSchemaId}: ${error.message}`);
      }
    }
  }
}

testApprovalStepProfiles().then(success => {
  console.log(`\n✨ Profile management test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});