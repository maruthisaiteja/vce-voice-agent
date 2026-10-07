import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','site-creator-d1','--local','--config','wrangler.local.json','--persist-to','.wrangler/state'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
