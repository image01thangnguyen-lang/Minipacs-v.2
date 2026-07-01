const { execSync } = require('child_process');
try {
  const container = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest"').toString().trim();
  if (container) {
    const json = execSync(`docker exec ${container} cat /tmp/orthanc.json`).toString();
    console.log(json);
  }
} catch(e) { console.error(e.message); }
