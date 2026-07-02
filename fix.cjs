const fs = require('fs');
const path = 'ohif-viewer/extensions/minipacs/src/Components/CustomTopToolbar.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original file has: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
// We replace the xmlns part with className="w-[18px] h-[18px]"

content = content.replace(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" /g, '<svg className="w-[18px] h-[18px]" ');
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced xmlns with className sizing!');
