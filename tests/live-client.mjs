import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const moduleUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const protocol=moduleUrl(compile('lib/live-voice.ts')),turn=moduleUrl(compile('lib/voice-turn.ts'));
const source=compile('lib/live-voice-client.ts').replace("'./client'",JSON.stringify(moduleUrl('export async function api(){return {id:"synthetic-call"}}'))).replace("'./live-voice'",JSON.stringify(protocol)).replace("'./voice-turn'",JSON.stringify(turn));
const {LiveVoiceClient}=await import(moduleUrl(source));
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
function setup(){
 const sent=[],states=[],lines=[],errors=[],nodes=[];
 const c=new LiveVoiceClient('en',{state:s=>states.push(s),line:(...x)=>lines.push(x),partial:()=>{},error:e=>errors.push(e),latency:()=>{},changed:()=>{}});
 c.callId='synthetic-call';c.ready=true;c.socket={readyState:1,bufferedAmount:0,send:s=>sent.push(JSON.parse(s)),close(){}};
 c.context={currentTime:0,createBuffer:()=>({duration:0.001,copyToChannel(){}}),createBufferSource(){const n={connect(){},disconnect(){},start(){},stop(){this.stopped=true},stopped:false};nodes.push(n);return n;},close:async()=>{}};
 return {c,sent,states,lines,errors,nodes};
}
test('speech detection stops all scheduled audio and commits only after the pause',async t=>{
 let at=0;t.mock.method(performance,'now',()=>at);
 const {c}=setup();let submitted=0;c.transcribeTurn=async()=>{submitted++};let stopped=0;c.nodes.add({stop(){stopped++},disconnect(){}});c.speaking=true;
 const bytes=new Uint8Array(4096);
 at=85;c.chunk(bytes,.05);assert.equal(stopped,0);
 at=170;c.chunk(bytes,.05);assert.equal(stopped,1);assert.equal(c.collecting,true);
 for(at=255;at<970;at+=85)c.chunk(bytes,0);
 assert.equal(submitted,0);
 at=1020;c.chunk(bytes,0);assert.equal(submitted,1);
 await c.close();
});
test('interrupted streamed answer stops playback and ignores trailing chunks',async t=>{
 let controller,cancelled=false;
 t.mock.method(globalThis,'fetch',async()=>new Response(new ReadableStream({start(c){controller=c;c.enqueue(new TextEncoder().encode(JSON.stringify({type:'answer',reply:'Verified reply',result:{}})+'\n'+JSON.stringify({type:'audio',pcm:'AAAAAA=='})+'\n'));},cancel(){cancelled=true}})));
 const {c,nodes,lines}=setup();const pending=c.speak('question','Question');await tick();assert.equal(nodes.length,1);assert.equal(lines.length,1);
 c.interrupt();assert.equal(nodes[0].stopped,true);
 controller.enqueue(new TextEncoder().encode(JSON.stringify({type:'audio',pcm:'AAAAAA=='})+'\n'));await pending;
 assert.equal(nodes.length,1);assert.equal(cancelled,true);await c.close();
});
test('spoken yes confirms the pending transcript rather than querying yes',async()=>{
 const {c}=setup(),calls=[];c.speak=async(...args)=>calls.push(args);c.pendingConfirmation='Is the amount 140000?';
 c.acceptTranscript('Yes.');
 assert.deepEqual(calls,[['question','Is the amount 140000?']]);await c.close();
});
test('obsolete transcription completion never starts a factual answer',async t=>{
 let complete;t.mock.method(globalThis,'fetch',()=>new Promise(resolve=>{complete=resolve}));
 const {c}=setup(),calls=[];c.speak=async(...args)=>calls.push(args);
 const job=c.listening.begin(),pending=c.transcribeTurn([new Uint8Array(512)],job);c.interrupt();
 complete(Response.json({text:'CSE HOD'}));await pending;assert.deepEqual(calls,[]);await c.close();
});
test('a verified goodbye closes only after its audio finishes',async t=>{
 const events=[{type:'answer',reply:'Thank you. Have a good day.',result:{reason:'Conversational close'}},{type:'audio',pcm:'AAAAAA=='},{type:'done'}];
 t.mock.method(globalThis,'fetch',async()=>new Response(events.map(e=>JSON.stringify(e)).join('\n')+'\n'));
 const {c,nodes}=setup(),pending=c.speak('question','Goodbye');await tick();assert.equal(c.closed,false);
 nodes[0].onended();await pending;assert.equal(c.closed,true);
});
