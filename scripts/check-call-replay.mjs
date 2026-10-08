import assert from 'node:assert/strict';
const base=process.env.DESK_TEST_URL||'https://vce-voice-agent-eight.vercel.app';
assert.ok(process.env.SARVAM_TOOL_TOKEN,'Load the private environment; never print the token.');
const interactionId='call-replay-'+crypto.randomUUID();
const cases=[
 ['Okay, give me the full details about Information Technology branch.','vce-it-overview'],
 ['Give me about the faculty and the HOD details if you have any.','vce-it-faculty'],
 ['Information Technology.','vce-it-faculty'],
 ['Okay can I get his contact number?','vce-it-hod-phone'],
 ['Okay could you give me the admission details about Information Technology branch?','vce-admission-process-btech'],
 ['Okay what information do you have about the college hostels and everything?','vce-hostel-facilities'],
 ['Okay could you give me any extra curricular activities that has been involved in Vardhaman like the student clubs and the other co-curricular things that currently Vardhaman is executing?','vce-student-clubs'],
 ["Okay don't Vardhaman have any student branches or anything?",'vce-student-chapters'],
 ['Okay give me the examination thing that how conducts in the Vardhaman branch.','vce-exam-process']
];
async function tool(operation,question){
 const response=await fetch(base+'/api/sarvam/tools',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.SARVAM_TOOL_TOKEN},body:JSON.stringify({operation,interactionId,language:'en',...(question?{question}:{})}),signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200,operation+' HTTP status');return response.json();
}
await tool('start');
try{for(const [question,source] of cases){const r=await tool('resolve',question);assert.equal(r.decision,'answer',source);assert.ok(r.sourceIds.includes(source),source);assert.equal(r.speakExactly,r.reply);console.log(JSON.stringify({source,reply:r.reply,latencyMs:r.latencyMs}));}console.log('9/9 live call turns returned the expected approved sources.');}
finally{await tool('end');}
