/**
 * Test rápido para la nueva función extractLocalDate
 */

function extractLocalDate(date) {
  // Obtener componentes de fecha directamente sin conversión de zona horaria
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  
  // Formatear con padding
  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  
  return `${year}-${formattedMonth}-${formattedDay}`;
}

console.log("Test extractLocalDate con fechas problemáticas:");
console.log("");

const testDates = [
  new Date("2025-07-01T03:00:00.000Z"),
  new Date("2025-07-03T03:00:00.000Z"),
  new Date("2025-07-05T03:00:00.000Z"),
];

testDates.forEach((date, i) => {
  console.log(`Test ${i + 1}:`);
  console.log(`  Input: ${date.toISOString()}`);
  console.log(`  getFullYear(): ${date.getFullYear()}`);
  console.log(`  getMonth() + 1: ${date.getMonth() + 1}`);
  console.log(`  getDate(): ${date.getDate()}`);
  console.log(`  extractLocalDate(): ${extractLocalDate(date)}`);
  console.log("");
});

console.log("✅ extractLocalDate debería extraer correctamente las fechas sin offset");