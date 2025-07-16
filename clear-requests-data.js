
/**
 * Script para eliminar solo solicitudes e historial de cambios de estado
 * CONSERVA: esquemas de aprobación, pasos de aprobación, motivos de permisos, saldos de vacaciones
 * ELIMINA: solicitudes y historial de cambios de estado
 */

const { Pool } = require('@neondatabase/serverless');

async function clearRequestsAndHistoryOnly() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧹 Iniciando limpieza de solicitudes e historial...');

    // Eliminar en orden para respetar las foreign keys
    
    // 1. Eliminar pasos de aprobación de solicitudes específicas
    console.log('Eliminando pasos de aprobación de solicitudes...');
    const result1 = await pool.query('DELETE FROM request_approval_steps');
    console.log(`✅ Eliminados ${result1.rowCount} pasos de aprobación de solicitudes`);

    // 2. Eliminar historial de solicitudes
    console.log('Eliminando historial de solicitudes...');
    const result2 = await pool.query('DELETE FROM request_history');
    console.log(`✅ Eliminados ${result2.rowCount} registros de historial`);

    // 3. Eliminar solicitudes
    console.log('Eliminando solicitudes...');
    const result3 = await pool.query('DELETE FROM requests');
    console.log(`✅ Eliminadas ${result3.rowCount} solicitudes`);

    // Reiniciar solo las secuencias relacionadas con solicitudes
    console.log('Reiniciando secuencias de IDs de solicitudes...');
    await pool.query('ALTER SEQUENCE requests_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE request_history_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE request_approval_steps_id_seq RESTART WITH 1');
    console.log('✅ Secuencias de IDs reiniciadas');

    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    console.log('Se eliminaron:');
    console.log('- Todas las solicitudes');
    console.log('- Todo el historial de cambios de estado');
    console.log('- Todos los pasos de aprobación de solicitudes específicas');
    console.log('\nSe conservaron:');
    console.log('- Esquemas de aprobación configurados');
    console.log('- Pasos de aprobación configurados');
    console.log('- Motivos de permisos');
    console.log('- Saldos de vacaciones de usuarios');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    console.error('Detalles del error:', error.message);
  } finally {
    await pool.end();
  }
}

// Verificar que se proporcionó la variable de entorno
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está configurada');
  process.exit(1);
}

// Ejecutar la limpieza
clearRequestsAndHistoryOnly();
