/**
 * Test unitario para verificar la lógica simplificada de usuarios
 * Extrae solo nombre y perfil, máximo 3 por perfil
 */

// Datos simulados de la API
const mockApiUsers = [
  { Name: "Juan", LastName: "Pérez", UserProfile: "#JefeGrupo#", Enabled: "1" },
  { Name: "María", LastName: "González", UserProfile: "#JefeGrupo#", Enabled: "1" },
  { Name: "Carlos", LastName: "López", UserProfile: "#JefeGrupo#", Enabled: "1" },
  { Name: "Ana", LastName: "Martín", UserProfile: "#JefeGrupo#", Enabled: "1" }, // 4to - debe ser excluido
  { Name: "Pedro", LastName: "Sánchez", UserProfile: "#supervisor#", Enabled: "1" },
  { Name: "Laura", LastName: "Torres", UserProfile: "#supervisor#", Enabled: "1" },
  { Name: "Diego", LastName: "Ruiz", UserProfile: "#adminCuenta#", Enabled: "1" },
  { Name: "Sofia", LastName: "Morales", UserProfile: "#adminCuenta#", Enabled: "1" },
  { Name: "Luis", LastName: "Vargas", UserProfile: "#adminCuenta#", Enabled: "1" },
  { Name: "Carmen", LastName: "Jiménez", UserProfile: "#adminCuenta#", Enabled: "1" }, // 4to - debe ser excluido
  { Name: "Roberto", LastName: "Disabled", UserProfile: "#JefeGrupo#", Enabled: "0" }, // Deshabilitado - debe ser excluido
  { Name: "Elena", LastName: "SinPerfil", UserProfile: "", Enabled: "1" }, // Sin perfil - debe ser excluido
];

function simplifyUsers(apiUsers) {
  console.log("=== SIMPLIFICANDO USUARIOS ===");
  console.log(`Total usuarios de API: ${apiUsers.length}`);
  
  // 1. Filtrar solo usuarios habilitados con perfil válido
  const enabledUsers = apiUsers.filter(user => 
    user.Enabled === "1" && 
    user.UserProfile && 
    user.UserProfile.trim() !== ""
  );
  
  console.log(`Usuarios habilitados con perfil: ${enabledUsers.length}`);
  
  // 2. Agrupar por perfil
  const usersByProfile = {};
  enabledUsers.forEach(user => {
    const profile = user.UserProfile;
    if (!usersByProfile[profile]) {
      usersByProfile[profile] = [];
    }
    usersByProfile[profile].push({
      displayName: `${user.Name} ${user.LastName}`,
      profile: profile,
      originalData: user
    });
  });
  
  console.log(`Perfiles encontrados: ${Object.keys(usersByProfile).length}`);
  Object.keys(usersByProfile).forEach(profile => {
    console.log(`  ${profile}: ${usersByProfile[profile].length} usuarios`);
  });
  
  // 3. Limitar a máximo 3 usuarios por perfil
  const simplifiedUsers = [];
  Object.keys(usersByProfile).forEach(profile => {
    const usersInProfile = usersByProfile[profile].slice(0, 3); // Solo los primeros 3
    simplifiedUsers.push(...usersInProfile);
    
    if (usersByProfile[profile].length > 3) {
      console.log(`  ⚠️  ${profile}: Limitado de ${usersByProfile[profile].length} a 3 usuarios`);
    }
  });
  
  console.log(`Total usuarios simplificados: ${simplifiedUsers.length}`);
  
  return simplifiedUsers;
}

function testSimplificationLogic() {
  console.log("🧪 PROBANDO LÓGICA DE SIMPLIFICACIÓN\n");
  
  const result = simplifyUsers(mockApiUsers);
  
  console.log("\n📋 RESULTADO FINAL:");
  result.forEach(user => {
    console.log(`• ${user.displayName} - ${user.profile}`);
  });
  
  // Verificaciones
  console.log("\n✅ VERIFICACIONES:");
  
  // 1. Verificar que no hay más de 3 usuarios por perfil
  const profileCounts = {};
  result.forEach(user => {
    profileCounts[user.profile] = (profileCounts[user.profile] || 0) + 1;
  });
  
  let maxPerProfileOk = true;
  Object.keys(profileCounts).forEach(profile => {
    const count = profileCounts[profile];
    console.log(`${profile}: ${count} usuarios`);
    if (count > 3) {
      console.log(`❌ ERROR: ${profile} tiene más de 3 usuarios (${count})`);
      maxPerProfileOk = false;
    }
  });
  
  if (maxPerProfileOk) {
    console.log("✅ Máximo 3 usuarios por perfil respetado");
  }
  
  // 2. Verificar que no hay usuarios deshabilitados
  const hasDisabledUsers = result.some(user => user.originalData.Enabled !== "1");
  console.log(hasDisabledUsers ? "❌ Hay usuarios deshabilitados" : "✅ Solo usuarios habilitados");
  
  // 3. Verificar que no hay usuarios sin perfil
  const hasUsersWithoutProfile = result.some(user => !user.profile || user.profile.trim() === "");
  console.log(hasUsersWithoutProfile ? "❌ Hay usuarios sin perfil" : "✅ Todos tienen perfil");
  
  // 4. Verificar formato de displayName
  const validDisplayNames = result.every(user => 
    user.displayName.includes(" ") && user.displayName.trim().length > 0
  );
  console.log(validDisplayNames ? "✅ Nombres con formato correcto" : "❌ Formato de nombres incorrecto");
  
  return {
    success: maxPerProfileOk && !hasDisabledUsers && !hasUsersWithoutProfile && validDisplayNames,
    result: result,
    stats: {
      totalProcessed: mockApiUsers.length,
      finalCount: result.length,
      profileCounts: profileCounts
    }
  };
}

function testWithRealApiStructure() {
  console.log("\n🌐 PROBANDO CON ESTRUCTURA REAL DE API\n");
  
  // Datos que coinciden con la estructura real de la API GeoVictoria
  const realApiUsers = [
    {
      "Id": "OZBVKtv7GTxDHd5khi9_Vw",
      "Identifier": "183955671", 
      "Name": "Fabian Test",
      "LastName": " Jefe Grupo",
      "Email": "jraposo@geovictoria.cl",
      "UserProfile": "#supervisor#",
      "Enabled": "1"
    },
    {
      "Id": "2U--oYkw19Zl4pt9gjFSGw",
      "Identifier": "262698211",
      "Name": "Marilia",
      "LastName": "Copia", 
      "Email": "mprado1@geovictoria.com",
      "UserProfile": "#adminCuenta#",
      "Enabled": "1"
    }
  ];
  
  const result = simplifyUsers(realApiUsers);
  
  console.log("📋 RESULTADO CON DATOS REALES:");
  result.forEach(user => {
    console.log(`• ${user.displayName} - ${user.profile}`);
  });
  
  return result;
}

// Ejecutar tests
const testResult = testSimplificationLogic();
console.log(`\n🎯 TEST ${testResult.success ? 'EXITOSO' : 'FALLIDO'}`);

testWithRealApiStructure();