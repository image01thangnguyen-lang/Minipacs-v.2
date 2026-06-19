import json

file = '/home/thang/Minipacs-v.2/config/orthanc.json'
with open(file, 'r') as f:
    config = json.load(f)

config['AuthenticationEnabled'] = False
if 'HttpExtraHeaders' not in config:
    config['HttpExtraHeaders'] = {}
config['HttpExtraHeaders']['Access-Control-Allow-Origin'] = '*'

with open(file, 'w') as f:
    json.dump(config, f, indent=2)
