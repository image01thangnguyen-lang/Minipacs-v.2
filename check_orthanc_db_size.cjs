const { execSync } = require('child_process');
try {
  const container = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest"').toString().trim();
  const res = execSync(`docker exec ${container} du -sh /var/lib/orthanc/db`).toString();
  console.log(res);
} catch(e) { console.error(e.message); }
