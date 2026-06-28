const { execSync } = require('child_process');
try {
  const container = execSync('docker ps -q --filter "ancestor=postgres:15-alpine"').toString().trim();
  const mounts = execSync(`docker inspect -f "{{json .Mounts}}" ${container}`).toString();
  console.log(JSON.stringify(JSON.parse(mounts), null, 2));
} catch(e) { console.error(e.message); }
