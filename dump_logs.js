const { execSync } = require('child_process');
const fs = require('fs');

try {
  const orthancLogs = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest" | xargs -I {} docker logs {} --tail 100').toString();
  fs.writeFileSync('orthanc_logs.txt', orthancLogs);
  
  const dbLogs = execSync('docker ps -q --filter "ancestor=postgres:15-alpine" | xargs -I {} docker logs {} --tail 100').toString();
  fs.writeFileSync('db_logs.txt', dbLogs);
  
  console.log('Logs dumped');
} catch (e) {
  console.error(e);
}
