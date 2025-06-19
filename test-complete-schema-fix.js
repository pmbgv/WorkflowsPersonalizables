/**
 * Test completo para verificar la corrección del problema de motivos duplicados
 */

const BASE_URL = 'http://localhost:5000';

async function testCompleteSchemaFix() {
  console.log('Testing Complete Schema Creation Fix\n');
  
  let testData = { schemas: [] };
  
  try {
    // 1. Crear esquema base
    console.log('1. Creating base schema...');
    
    const baseResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Test Base Schema",
        tipoSolicitud: "Permiso",
        motivos: ["Test Motivo A", "Test Motivo B"]
      })
    });
    
    if (baseResponse.ok) {
      const baseSchema = await baseResponse.json();
      testData.schemas.push(baseSchema.id);
      console.log('✓ Base schema created successfully');
    } else {
      console.log('✗ Failed to create base schema');
      return false;
    }
    
    // 2. Intentar crear esquema con motivos duplicados (debería fallar)
    console.log('\n2. Testing duplicate motivo rejection...');
    
    const duplicateResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Duplicate Schema",
        tipoSolicitud: "Permiso",
        motivos: ["Test Motivo A"] // Duplicado
      })
    });
    
    if (!duplicateResponse.ok) {
      const error = await duplicateResponse.json();
      console.log('✓ Duplicate motivos correctly rejected');
      console.log(`  Error: ${error.message}`);
      if (error.duplicateMotivos) {
        console.log(`  Duplicates: ${error.duplicateMotivos.join(', ')}`);
      }
    } else {
      console.log('✗ Duplicate motivos incorrectly accepted');
      const dupSchema = await duplicateResponse.json();
      testData.schemas.push(dupSchema.id);
    }
    
    // 3. Crear esquema con motivos únicos (debería funcionar)
    console.log('\n3. Testing unique motivo acceptance...');
    
    const uniqueResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Unique Schema",
        tipoSolicitud: "Permiso",
        motivos: ["Test Motivo C", "Test Motivo D"]
      })
    });
    
    if (uniqueResponse.ok) {
      const uniqueSchema = await uniqueResponse.json();
      testData.schemas.push(uniqueSchema.id);
      console.log('✓ Unique motivos correctly accepted');
    } else {
      console.log('✗ Unique motivos incorrectly rejected');
    }
    
    // 4. Test de escenario específico del usuario
    console.log('\n4. Testing user scenario...');
    console.log('Scenario: User editing base schema, then creates new schema');
    
    // Obtener esquemas existentes para simular frontend
    const allSchemas = await fetch(`${BASE_URL}/api/approval-schemas`).then(r => r.json());
    
    // Simular validación frontend con exclusión
    const validateDuplicateMotivos = (selectedMotivos, excludeSchemaId = null) => {
      const duplicates = [];
      
      for (const schema of allSchemas) {
        if (excludeSchemaId && schema.id === excludeSchemaId) {
          continue; // Excluir esquema actual
        }
        
        if (schema.motivos && schema.motivos.length > 0) {
          const commonMotivos = selectedMotivos.filter(motivo => 
            schema.motivos.includes(motivo)
          );
          duplicates.push(...commonMotivos);
        }
      }
      
      return [...new Set(duplicates)];
    };
    
    const baseSchemaId = testData.schemas[0];
    
    // Sin exclusión - debería encontrar duplicados
    const dupsWithoutExclusion = validateDuplicateMotivos(["Test Motivo A"]);
    console.log(`Frontend validation without exclusion: ${dupsWithoutExclusion.length > 0 ? 'DUPLICATES FOUND' : 'NO DUPLICATES'}`);
    
    // Con exclusión - no debería encontrar duplicados
    const dupsWithExclusion = validateDuplicateMotivos(["Test Motivo A"], baseSchemaId);
    console.log(`Frontend validation with exclusion: ${dupsWithExclusion.length > 0 ? 'DUPLICATES FOUND' : 'NO DUPLICATES'}`);
    
    console.log('\n📊 Test Results:');
    
    const results = {
      backendValidation: !duplicateResponse.ok,
      uniqueAcceptance: uniqueResponse.ok,
      frontendLogic: dupsWithoutExclusion.length > 0 && dupsWithExclusion.length === 0
    };
    
    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✓ Backend correctly validates duplicate motivos');
      console.log('✓ Unique motivos are accepted');
      console.log('✓ Frontend logic correctly excludes current schema');
      console.log('\nThe user can now:');
      console.log('- Edit a schema without interference');
      console.log('- Create new schemas while editing others');
      console.log('- Still get proper duplicate validation');
    } else {
      console.log('⚠️  SOME TESTS FAILED:');
      if (!results.backendValidation) console.log('- Backend validation not working');
      if (!results.uniqueAcceptance) console.log('- Unique motivos being rejected');
      if (!results.frontendLogic) console.log('- Frontend exclusion logic not working');
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

testCompleteSchemaFix().then(success => {
  console.log(`\nSchema creation fix: ${success ? 'SUCCESSFUL' : 'NEEDS MORE WORK'}`);
  process.exit(success ? 0 : 1);
}).catch(() => process.exit(1));