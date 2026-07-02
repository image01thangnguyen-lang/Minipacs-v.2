const fs = require('fs');

const targetFile = 'C:/App/Antigravity/Minipacs-v.2/ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx';
const newIconsFile = 'C:/App/Antigravity/Minipacs-v.2/new_icons.tsx';

const lines = fs.readFileSync(targetFile, 'utf-8').split('\n');
const newIcons = fs.readFileSync(newIconsFile, 'utf-8');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const ChevronDown = () => (")) {
        startIdx = i;
    }
    if (lines[i].includes("Volume: Box3DIcon,") || lines[i].includes("Volume: VolumeIcon,")) {
        for (let j = i; j < i + 10; j++) {
            if (lines[j].includes("};")) {
                endIdx = j + 1;
                break;
            }
        }
    }
}

if (endIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("function getIcon(id: string): React.FC {")) {
            endIdx = i - 1;
            break;
        }
    }
}

if (startIdx === -1 || endIdx === -1) {
    console.error(`Could not find boundaries: start=${startIdx}, end=${endIdx}`);
    process.exit(1);
}

const newContent = lines.slice(0, startIdx).join('\n') + '\n' + newIcons + '\n' + lines.slice(endIdx).join('\n');

fs.writeFileSync(targetFile, newContent, 'utf-8');
console.log("Successfully replaced lines " + startIdx + " to " + endIdx);
