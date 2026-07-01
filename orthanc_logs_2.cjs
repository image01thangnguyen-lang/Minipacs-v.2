const { execSync } = require('child_process');
try {
  const container = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest"').toString().trim();
  if (container) {
    const logs = execSync(`docker logs ${container} --tail 100`).toString();
    console.log(logs);
  }
} catch(e) { console.error(e.message); }
