import assert from 'node:assert/strict';
const base=process.env.DESK_TEST_URL||'http://localhost:5174';
if(!process.env.STAFF_LOGIN_KEY||!process.env.SARVAM_TOOL_TOKEN)throw Error('Load the private environment before running this check.');
const origin=new URL(base).origin;
const login=await fetch(base+'/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({key:process.env.STAFF_LOGIN_KEY})});
assert.equal(login.status,200,'staff login');const cookie=login.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
assert.equal((await fetch(base+'/api/desk',{headers:{'oai-authenticated-user-id':'forged'}})).status,401,'forged identity rejected');
const headers={cookie,Origin:origin,'Content-Type':'application/json'};
const overview=await fetch(base+'/api/desk',{headers});assert.equal(overview.status,200);const state=await overview.json();assert.ok(state.knowledge.length>0);
const save=await fetch(base+'/api/desk',{method:'POST',headers,body:JSON.stringify({action:'config.save',collegeName:state.config.collegeName,retentionDays:state.config.retentionDays,recordingEnabled:false,voiceEnabled:true})});assert.equal(save.status,200);
const interactionId='deployment-check-'+crypto.randomUUID();
async function tool(operation,extra={}){const r=await fetch(base+'/api/sarvam/tools',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.SARVAM_TOOL_TOKEN},body:JSON.stringify({operation,interactionId,language:'en',...extra})});const result=await r.json();assert.equal(r.status,200,operation+' status '+r.status+' '+JSON.stringify(result));return result;}
await tool('start');try {
 const answer=await tool('resolve',{question:'Where is the college located?'});assert.ok(answer.speakExactly);
 const email=await tool('prepare_email',{requestId:'email',department:'admissions',summary:'INTEGRATION TEST ONLY - deployment validation; no email delivery requested.',consent:true,confirmed:true});assert.equal(email.sent,false);
 const staff=await tool('request_staff',{requestId:'staff',department:'admissions',summary:'INTEGRATION TEST ONLY - deployment validation; no callback requested.',consent:true,confirmed:true});assert.equal(staff.connected,false);
 const after=await (await fetch(base+'/api/desk',{headers})).json();assert.ok(after.emailOutbox.some(x=>x.id===email.id));assert.ok(after.tickets.some(x=>x.id===staff.ticketId));
 console.log(JSON.stringify({staffLogin:true,forgedHeaderRejected:true,knowledgeRecords:state.knowledge.length,lookup:true,emailDraftSaved:true,emailSent:false,staffRequestSaved:true,phoneConnected:false}));
}finally{await tool('end');}
const ended=await fetch(base+'/api/sarvam/tools',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.SARVAM_TOOL_TOKEN},body:JSON.stringify({operation:'resolve',interactionId,language:'en',question:'Where is the college?'})});assert.equal(ended.status,409);console.log('Ended calls reject subsequent queries.');
