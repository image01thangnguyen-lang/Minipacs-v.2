const fs = require('fs');
const file = '/home/thang/Minipacs-v.2/config/orthanc.json';
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
config.AuthenticationEnabled = false;
if (!config.HttpExtraHeaders) config.HttpExtraHeaders = {};
config.HttpExtraHeaders['Access-Control-Allow-Origin'] = '*';
fs.writeFileSync(file, JSON.stringify(config, null, 2));
