const { execSync } = require('child_process');
try {
  const info = execSync('docker inspect $(docker ps -q --filter "ancestor=postgres:15-alpine")').toString();
  console.log(info);
} catch(e) { console.error(e.message); }
