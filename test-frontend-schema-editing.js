/**
 * Test para verificar la funcionalidad de edición de esquemas en el frontend
 */

const BASE_URL = 'http://localhost:5000';

async function testFrontendSchemaEditing() {
  console.log('Testing Frontend Schema Editing Functionality\n');
  
  let testData = { schemas: [] };
  
  try {
    // 1. Crear esquemas para testear
    console.log('1. Creating test schemas...');
    
    const schema1Response = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Frontend Test Schema 1",
        tipoSolicitud: "Permiso",
        motivos: ["Frontend Motivo A", "Frontend Motivo B"],
        visibilityPermissions: ["#adminCuenta#"],
        approvalPermissions: ["#adminCuenta#"],
        adjuntarDocumentos: "false",
        comentarioRequerido: "false",
        permitirSolicitudTerceros: "false"
      })
    });
    
    const schema2Response = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Frontend Test Schema 2",
        tipoSolicitud: "Permiso",
        motivos: ["Frontend Motivo C"],
        visibilityPermissions: ["#supervisor#"]
      })
    });
    
    const schema1 = await schema1Response.json();
    const schema2 = await schema2Response.json();
    testData.schemas.push(schema1.id, schema2.id);
    
    console.log(`Created schemas: ${schema1.id} and ${schema2.id}`);
    
    // 2. Test actualización de motivos válida
    console.log('\n2. Testing valid motivos update...');
    
    const validUpdateResponse = await fetch(`${BASE_URL}/api/approval-schemas/${schema1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivos: ["Updated Frontend Motivo A", "Updated Frontend Motivo B", "New Frontend Motivo"]
      })
    });
    
    const validUpdateResult = validUpdateResponse.ok;
    if (validUpdateResult) {
      const updated = await validUpdateResponse.json();
      console.log('✓ Valid motivos update successful');
      console.log(`Updated motivos: ${updated.motivos.join(', ')}`);
    } else {
      const error = await validUpdateResponse.json();
      console.log('✗ Valid motivos update failed');
      console.log(`Error: ${error.message}`);
    }
    
    // 3. Test actualización con motivos duplicados (debe fallar)
    console.log('\n3. Testing duplicate motivos update (should fail)...');
    
    const duplicateUpdateResponse = await fetch(`${BASE_URL}/api/approval-schemas/${schema1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivos: ["Frontend Motivo C"] // Este motivo está en schema2
      })
    });
    
    const duplicateRejected = !duplicateUpdateResponse.ok;
    if (duplicateRejected) {
      const error = await duplicateUpdateResponse.json();
      console.log('✓ Duplicate motivos correctly rejected');
      console.log(`Error: ${error.message}`);
      if (error.duplicateMotivos) {
        console.log(`Duplicates found: ${error.duplicateMotivos.join(', ')}`);
      }
    } else {
      console.log('✗ Duplicate motivos incorrectly accepted');
    }
    
    // 4. Test actualización de configuración general
    console.log('\n4. Testing general configuration update...');
    
    const configUpdateResponse = await fetch(`${BASE_URL}/api/approval-schemas/${schema1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Updated Frontend Schema Name",
        adjuntarDocumentos: "true",
        adjuntarDocumentosObligatorio: "true",
        comentarioRequerido: "true",
        comentarioObligatorio: "false",
        comentarioOpcional: "true",
        permitirSolicitudTerceros: "true",
        diasMinimo: 2,
        diasMaximo: 20,
        tipoDias: "habiles"
      })
    });
    
    const configUpdateResult = configUpdateResponse.ok;
    if (configUpdateResult) {
      const updated = await configUpdateResponse.json();
      console.log('✓ Configuration update successful');
      console.log(`Name: ${updated.nombre}`);
      console.log(`Attach docs: ${updated.adjuntarDocumentos}`);
      console.log(`Comment required: ${updated.comentarioRequerido}`);
      console.log(`Allow third party: ${updated.permitirSolicitudTerceros}`);
      console.log(`Days range: ${updated.diasMinimo}-${updated.diasMaximo} (${updated.tipoDias})`);
    } else {
      console.log('✗ Configuration update failed');
    }
    
    // 5. Test actualización de permisos
    console.log('\n5. Testing permissions update...');
    
    const permissionsUpdateResponse = await fetch(`${BASE_URL}/api/approval-schemas/${schema1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibilityPermissions: ["#adminCuenta#", "#supervisor#", "#empleado#"],
        approvalPermissions: ["#supervisor#", "#adminCuenta#"]
      })
    });
    
    const permissionsUpdateResult = permissionsUpdateResponse.ok;
    if (permissionsUpdateResult) {
      const updated = await permissionsUpdateResponse.json();
      console.log('✓ Permissions update successful');
      console.log(`Visibility: ${updated.visibilityPermissions?.join(', ')}`);
      console.log(`Approval: ${updated.approvalPermissions?.join(', ')}`);
    } else {
      console.log('✗ Permissions update failed');
    }
    
    // 6. Test actualización parcial (solo un campo)
    console.log('\n6. Testing partial update...');
    
    const partialUpdateResponse = await fetch(`${BASE_URL}/api/approval-schemas/${schema1.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enviarCorreoNotificacion: "true"
      })
    });
    
    const partialUpdateResult = partialUpdateResponse.ok;
    if (partialUpdateResult) {
      const updated = await partialUpdateResponse.json();
      console.log('✓ Partial update successful');
      console.log(`Email notifications: ${updated.enviarCorreoNotificacion}`);
    } else {
      console.log('✗ Partial update failed');
    }
    
    // 7. Verificar estado final del esquema
    console.log('\n7. Verifying final schema state...');
    
    const finalSchema = await fetch(`${BASE_URL}/api/approval-schemas/${schema1.id}`).then(r => r.json());
    
    console.log('Final schema configuration:');
    console.log(`- ID: ${finalSchema.id}`);
    console.log(`- Name: ${finalSchema.nombre}`);
    console.log(`- Motivos: ${finalSchema.motivos?.join(', ') || 'none'}`);
    console.log(`- Visibility: ${finalSchema.visibilityPermissions?.join(', ') || 'none'}`);
    console.log(`- Approval: ${finalSchema.approvalPermissions?.join(', ') || 'none'}`);
    console.log(`- Attach docs: ${finalSchema.adjuntarDocumentos}`);
    console.log(`- Comment required: ${finalSchema.comentarioRequerido}`);
    console.log(`- Third party: ${finalSchema.permitirSolicitudTerceros}`);
    console.log(`- Days: ${finalSchema.diasMinimo}-${finalSchema.diasMaximo} (${finalSchema.tipoDias})`);
    console.log(`- Email notifications: ${finalSchema.enviarCorreoNotificacion}`);
    
    // 8. Test funcionalidad de frontend completa
    console.log('\n8. Testing complete frontend workflow simulation...');
    
    // Simular el flujo de frontend: seleccionar esquema, modificar, guardar
    console.log('Simulating frontend workflow:');
    console.log('- User selects schema for editing');
    console.log('- User modifies motivos in UI');
    console.log('- User clicks save button');
    
    const frontendWorkflowResponse = await fetch(`${BASE_URL}/api/approval-schemas/${schema2.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        motivos: ["Modified Frontend Motivo C", "Additional Frontend Motivo"],
        visibilityPermissions: ["#supervisor#", "#adminCuenta#"],
        adjuntarDocumentos: "true",
        comentarioRequerido: "true"
      })
    });
    
    const workflowResult = frontendWorkflowResponse.ok;
    if (workflowResult) {
      const updated = await frontendWorkflowResponse.json();
      console.log('✓ Complete frontend workflow successful');
      console.log(`Updated schema: ${updated.nombre}`);
      console.log(`New motivos: ${updated.motivos.join(', ')}`);
    } else {
      console.log('✗ Complete frontend workflow failed');
    }
    
    // 9. Resumen de resultados
    console.log('\n📊 Frontend Schema Editing Test Results:');
    
    const results = {
      validUpdate: validUpdateResult,
      duplicateRejection: duplicateRejected,
      configUpdate: configUpdateResult,
      permissionsUpdate: permissionsUpdateResult,
      partialUpdate: partialUpdateResult,
      workflowComplete: workflowResult
    };
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      console.log('🎉 ALL FRONTEND SCHEMA EDITING TESTS PASSED!');
      console.log('✓ Valid updates work correctly');
      console.log('✓ Duplicate validation works during edits');
      console.log('✓ Configuration updates work');
      console.log('✓ Permission updates work');
      console.log('✓ Partial updates work');
      console.log('✓ Complete frontend workflow works');
      console.log('\nUser can now edit schemas without issues!');
    } else {
      console.log('⚠️ SOME FRONTEND EDITING TESTS FAILED:');
      if (!results.validUpdate) console.log('- Valid updates not working');
      if (!results.duplicateRejection) console.log('- Duplicate validation not working');
      if (!results.configUpdate) console.log('- Configuration updates not working');
      if (!results.permissionsUpdate) console.log('- Permission updates not working');
      if (!results.partialUpdate) console.log('- Partial updates not working');
      if (!results.workflowComplete) console.log('- Complete workflow not working');
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

testFrontendSchemaEditing().then(success => {
  console.log(`\nFrontend schema editing test: ${success ? 'SUCCESS' : 'FAILURE'}`);
  process.exit(success ? 0 : 1);
}).catch(() => process.exit(1));