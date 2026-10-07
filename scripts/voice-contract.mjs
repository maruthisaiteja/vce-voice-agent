import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'campus-contract-'));
try{for(const name of ['policy','college-intent']){let code=ts.transpileModule(fs.readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace("'./college-intent'","'./college-intent.mjs'");fs.writeFileSync(path.join(tmp,name+'.mjs'),code);}const p=await import(pathToFileURL(path.join(tmp,'policy.mjs')));fs.writeFileSync('public/voice-contract.json',JSON.stringify({instructions:p.VOICE_INSTRUCTIONS,tools:p.VOICE_TOOLS},null,2)+'\n');}finally{fs.rmSync(tmp,{recursive:true,force:true})}
