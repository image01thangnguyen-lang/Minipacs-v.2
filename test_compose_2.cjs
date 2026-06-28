const { execSync } = require('child_process');
try {
  execSync('docker compose stop');
  execSync('docker compose up -d');
  
  const orthanc = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest"').toString().trim();
  setTimeout(() => {
    const logs = execSync(`docker logs ${orthanc} --tail 50`).toString();
    console.log(logs);
  }, 5000);
} catch(e) { console.error(e.message); }
