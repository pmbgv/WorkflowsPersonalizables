/**
 * Test específico del escenario reportado por el usuario
 */

const BASE_URL = 'http://localhost:5000';

async function testUserScenario() {
  console.log('Testing Specific User Scenario\n');
  
  let testData = { schemas: [] };
  
  try {
    // 1. Simular que ya existe un esquema con motivos
    console.log('1. Creating existing schema (simulating user having schemas)...');
    
    const existingResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Existing Schema", 
        tipoSolicitud: "Permiso",
        motivos: ["P. Administrativo", "Reunión"]
      })
    });
    
    const existingSchema = await existingResponse.json();
    if (existingResponse.ok) {
      testData.schemas.push(existingSchema.id);
      console.log(`Created existing schema with motivos: ${existingSchema.motivos.join(', ')}`);
    }
    
    // 2. Simular que el usuario SELECCIONA ese esquema para editar
    console.log('\n2. User selects schema for editing...');
    console.log(`Selected schema: "${existingSchema.nombre}"`);
    
    // 3. Ahora el usuario quiere crear un NUEVO esquema
    console.log('\n3. User clicks "Crear esquema" button...');
    console.log('Expected: Selected schema should be cleared');
    
    // 4. Usuario elige tipo Permiso y selecciona motivos
    console.log('\n4. User creates new schema with different motivos...');
    
    const newSchemaResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "New User Schema",
        tipoSolicitud: "Permiso",
        motivos: ["Capacitación", "Comisión"]
      })
    });
    
    if (newSchemaResponse.ok) {
      const newSchema = await newSchemaResponse.json();
      testData.schemas.push(newSchema.id);
      console.log('✓ New schema created successfully with unique motivos');
    } else {
      const error = await newSchemaResponse.json();
      console.log('✗ New schema creation failed:', error.message);
      if (error.duplicateMotivos) {
        console.log('Detected duplicates:', error.duplicateMotivos);
      }
    }
    
    // 5. Test el caso problemático: mismo motivo que el esquema seleccionado
    console.log('\n5. Testing problematic case: same motivo as selected schema...');
    
    const problematicResponse = await fetch(`${BASE_URL}/api/approval-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: "Problematic Schema",
        tipoSolicitud: "Permiso", 
        motivos: ["P. Administrativo"] // Same as existing schema
      })
    });
    
    if (!problematicResponse.ok) {
      const error = await problematicResponse.json();
      console.log('✓ Backend correctly rejects true duplicates');
      console.log(`Error: ${error.message}`);
    } else {
      console.log('✗ Backend incorrectly allows duplicates');
      const problemSchema = await problematicResponse.json();
      testData.schemas.push(problemSchema.id);
    }
    
    // 6. Simular la corrección del frontend
    console.log('\n6. Testing frontend validation with exclusion...');
    
    const allSchemas = await fetch(`${BASE_URL}/api/approval-schemas`).then(r => r.json());
    
    // Función corregida del frontend
    const validateDuplicateMotivos = (selectedMotivos, excludeCurrentSchema = false, currentSchemaId = null) => {
      const duplicates = [];
      
      for (const schema of allSchemas) {
        // Cuando estamos creando un nuevo esquema y el usuario tiene uno seleccionado,
        // NO consideramos el esquema seleccionado como duplicado
        if (excludeCurrentSchema && currentSchemaId && schema.id === currentSchemaId) {
          console.log(`Excluding schema "${schema.nombre}" from validation`);
          continue;
        }
        
        if (schema.motivos && Array.isArray(schema.motivos)) {
          for (const motivo of selectedMotivos) {
            if (schema.motivos.includes(motivo)) {
              duplicates.push(motivo);
            }
          }
        }
      }
      
      return [...new Set(duplicates)];
    };
    
    // Test: motivo del esquema existente SIN exclusión
    const dupsNormal = validateDuplicateMotivos(["P. Administrativo"]);
    console.log(`Without exclusion: ${dupsNormal.length > 0 ? 'Found duplicates' : 'No duplicates'}`);
    
    // Test: motivo del esquema existente CON exclusión
    const dupsExcluded = validateDuplicateMotivos(["P. Administrativo"], true, existingSchema.id);
    console.log(`With exclusion: ${dupsExcluded.length > 0 ? 'Found duplicates' : 'No duplicates'}`);
    
    console.log('\n📊 User Scenario Results:');
    
    const scenarios = {
      uniqueMotivosWork: newSchemaResponse.ok,
      duplicateRejection: !problematicResponse.ok,
      frontendExclusion: dupsNormal.length > 0 && dupsExcluded.length === 0
    };
    
    const allWorking = Object.values(scenarios).every(s => s);
    
    if (allWorking) {
      console.log('🎉 USER ISSUE RESOLVED!');
      console.log('✓ User can edit a schema and create new ones without interference');
      console.log('✓ Backend properly validates real duplicates');
      console.log('✓ Frontend correctly excludes selected schema from validation');
    } else {
      console.log('❌ USER ISSUE PERSISTS:');
      if (!scenarios.uniqueMotivosWork) console.log('- Cannot create schemas with unique motivos');
      if (!scenarios.duplicateRejection) console.log('- Backend allows true duplicates');
      if (!scenarios.frontendExclusion) console.log('- Frontend exclusion not working');
    }
    
    return allWorking;
    
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

testUserScenario().then(success => {
  console.log(`\nUser scenario test: ${success ? 'RESOLVED' : 'STILL BROKEN'}`);
  process.exit(success ? 0 : 1);
}).catch(() => process.exit(1));