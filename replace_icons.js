const fs = require('fs');
const path = 'ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 24 24"/g, '<svg className="w-[18px] h-[18px]" viewBox="0 0 24 24"');
fs.writeFileSync(path, content, 'utf8');
console.log('Replaced successfully');
