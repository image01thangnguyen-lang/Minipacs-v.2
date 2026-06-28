const fs = require('fs');
try {
  const stat = fs.statSync('d:\\Antigravity\\Minipacs-v.2\\pacs_data\\postgres\\PG_VERSION');
  console.log('Created:', stat.birthtime);
  console.log('Modified:', stat.mtime);
} catch(e) { console.error(e.message); }
