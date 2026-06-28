const { execSync } = require('child_process');

try {
  // Find db container
  const dbContainer = execSync('docker ps -q --filter "ancestor=postgres:15-alpine"').toString().trim();
  if (!dbContainer) {
    console.log('No db container found');
    process.exit(0);
  }
  
  // List tables in public schema
  const tables = execSync(`docker exec ${dbContainer} psql -U orthanc -d orthanc_db -c "\\dt public.*"`).toString();
  console.log('Tables in public schema:');
  console.log(tables);

  // Check row count in Resources table (Orthanc's main table)
  const count = execSync(`docker exec ${dbContainer} psql -U orthanc -d orthanc_db -t -c "SELECT COUNT(*) FROM public.\\"Resources\\";"`).toString().trim();
  console.log('Number of resources in Orthanc DB:', count);
  
} catch (e) {
  console.error(e.message);
}
