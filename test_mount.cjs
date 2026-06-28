const { execSync } = require('child_process');
const fs = require('fs');

try {
  fs.writeFileSync('d:\\Antigravity\\Minipacs-v.2\\pacs_data\\postgres\\test.txt', 'hello from host');
  const container = execSync('docker ps -q --filter "ancestor=postgres:15-alpine"').toString().trim();
  const ls = execSync(`docker exec ${container} ls /var/lib/postgresql/data`).toString();
  console.log('Files in container:');
  console.log(ls);
} catch(e) { console.error(e.message); }
