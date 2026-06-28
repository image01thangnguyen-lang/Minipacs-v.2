const { execSync } = require('child_process');
try {
  execSync('docker compose stop');
  execSync('docker compose up -d');
  
  const orthanc = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest"').toString().trim();
  execSync('sleep 5');
  const logs = execSync(`docker logs ${orthanc} --tail 50`).toString();
  console.log(logs);
} catch(e) { console.error(e.message); }
