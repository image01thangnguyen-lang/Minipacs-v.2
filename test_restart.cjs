const { execSync } = require('child_process');
try {
  execSync('bash ./manage.sh restart');
  const container = execSync('docker ps -q --filter "ancestor=orthancteam/orthanc:latest"').toString().trim();
  if (container) {
    // Wait a bit
    execSync('sleep 5');
    const logs = execSync(`docker logs ${container} --tail 50`).toString();
    console.log(logs);
  }
} catch(e) { console.error(e.message); }
