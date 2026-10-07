import {api} from './client';
import {PCMDecoder,TranscriptTurns,confirmationChoice,needsConfirmation} from './live-voice';
import {VoiceTurn} from './voice-turn';
import type {Language} from './policy';

type Events={state:(s:string)=>void;line:(role:string,text:string,result?:any)=>void;partial:(s:string)=>void;error:(s:string)=>void;latency:(n:number)=>void;changed:()=>void};
export class LiveVoiceClient {
 private callId:string|null=null;
 private mic:MediaStream|null=null;
 private context:AudioContext|null=null;
 private capture:AudioWorkletNode|null=null;
 private nodes=new Set<AudioBufferSourceNode>();
 private turn=new VoiceTurn();
 private transcripts=new TranscriptTurns();
 private closed=false;
 private ready=false;
 private collecting=false;
 private voiced=0;
 private started=0;
 private lastSpeech=0;
 private utterance=0;
 private captured:Uint8Array[]=[];
 private listening=new VoiceTurn();
 private preroll:Uint8Array[]=[];
 private pendingConfirmation='';
 private lastEnd=0;
 private waitTimer:ReturnType<typeof setTimeout>|null=null;
 private lifeTimer:ReturnType<typeof setTimeout>|null=null;
 private opening=new AbortController();
 private speaking=false;
 private events:Events;
 private language:Language;
 constructor(language:Language,events:Events){this.language=language;this.events=events;}
 private status(s:string){if(!this.closed)this.events.state(s);}
 private cancelSpeech(){this.turn.cancel();this.speaking=false;for(const n of this.nodes){n.onended=null;try{n.stop();}catch{}n.disconnect();}this.nodes.clear();}
 async start(){
  this.status('connecting');
  try{
   // Resume on the start-button gesture, before network awaits.
   const ctx=new AudioContext({sampleRate:16000});this.context=ctx;await ctx.resume();
   if(ctx.sampleRate!==16000)throw new Error('This device cannot capture 16 kHz audio. Use recorded voice.');
   const permission=navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   permission.then(m=>{if(this.closed)m.getTracks().forEach(t=>t.stop());}).catch(()=>{});
   const timeout=setTimeout(()=>this.fail('Microphone permission timed out. Please start again.'),15000);
   let mic:MediaStream;try{mic=await permission;}finally{clearTimeout(timeout);}
   if(this.closed){mic.getTracks().forEach(t=>t.stop());return;}this.mic=mic;
   // Let creation return its ID even if Stop is pressed, so the persisted call can be ended.
   const call=await api({action:'call.start',channel:'voice',language:this.language});
   if(this.closed){void api({action:'call.end',callId:call.id}).catch(()=>{});return;}this.callId=call.id;
   await ctx.audioWorklet.addModule('/voice-capture.js');if(this.closed)return;
   this.capture=new AudioWorkletNode(ctx,'campus-capture');ctx.createMediaStreamSource(mic).connect(this.capture);this.capture.connect(ctx.destination);
   this.capture.port.onmessage=e=>{try{this.chunk(new Uint8Array(e.data.pcm),e.data.rms);}catch(error){this.fail((error as Error).message);}};
   this.ready=true;void this.speak('hello');
   this.lifeTimer=setTimeout(()=>this.fail('The 15-minute test session ended. Start a new call to continue.'),15*60000);
  }catch(e){if(!this.closed)this.fail((e as Error).message||'Live voice could not start.');}
 }
 private acceptTranscript(text:string){
   if(!text||text.length>2000){void this.speak('repeat');return;}
   this.events.line('caller',text);this.events.partial('');
   const pending=this.pendingConfirmation;this.pendingConfirmation='';
   if(pending){const choice=confirmationChoice(text);if(choice==='yes'){void this.speak('question',pending);return;}if(choice==='no'){void this.speak('repeat');return;}}
   if(needsConfirmation(text)){this.pendingConfirmation=text;void this.speak('confirm',text);}
   else void this.speak('question',text);
 }
 private chunk(bytes:Uint8Array,rms:number){
  if(this.closed||!this.ready)return;
  const at=performance.now();this.preroll.push(bytes);if(this.preroll.length>4)this.preroll.shift();
  const voiced=rms>=(this.speaking?0.035:0.018);
  if(!this.collecting){
   this.voiced=voiced?this.voiced+bytes.length/32:0;
   if(this.voiced<160)return; // Reject brief clicks; echo cancellation remains device-dependent.
   this.cancelSpeech();if(this.waitTimer)clearTimeout(this.waitTimer);
   this.utterance=this.transcripts.begin();this.collecting=true;this.started=at;this.lastSpeech=at;
   this.status('listening');this.events.partial('');
   this.listening.cancel();this.captured=[...this.preroll];this.preroll=[];
   return;
  }
  this.captured.push(bytes);if(voiced)this.lastSpeech=at;
  if(at-this.lastSpeech>=800||at-this.started>=25000)this.finishQuestion();
 }
 finishQuestion(){
  if(!this.collecting||this.closed)return;
  this.lastEnd=this.lastSpeech;this.collecting=false;this.voiced=0;this.preroll=[];
  const chunks=this.captured;this.captured=[];const job=this.listening.begin();this.status('checking');
  void this.transcribeTurn(chunks,job);
 }
 private async transcribeTurn(chunks:Uint8Array[],job:{id:number;signal:AbortSignal}){
  try{
   const size=chunks.reduce((n,b)=>n+b.length,0),bytes=new Uint8Array(44+size),view=new DataView(bytes.buffer);
   const tag=(at:number,s:string)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
   tag(0,'RIFF');view.setUint32(4,36+size,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,'data');view.setUint32(40,size,true);
   let at=44;for(const b of chunks){bytes.set(b,at);at+=b.length;}
   const form=new FormData();form.set('callId',this.callId!);form.set('audio',new Blob([bytes],{type:'audio/wav'}),'question.wav');
   const r=await fetch('/api/listen',{method:'POST',body:form,signal:AbortSignal.any([job.signal,AbortSignal.timeout(18000)])});
   const data=await r.json() as {text:string;error?:string};if(!this.listening.current(job.id)||this.closed)return;
   if(!r.ok)throw new Error(data.error||'Transcription unavailable');this.acceptTranscript(data.text.trim());
  }catch(e){if(this.listening.current(job.id)&&!this.closed){this.events.error((e as Error).message);this.status('listening');}}
 }

 interrupt(){if(this.closed||!this.ready)return;this.cancelSpeech();if(this.waitTimer)clearTimeout(this.waitTimer);this.transcripts.begin();this.listening.cancel();this.status('listening');}
 private async speak(kind:string,text?:string){
  this.cancelSpeech();const job=this.turn.begin();const ctx=this.context!;const decode=new PCMDecoder();let next=ctx.currentTime,started=false,done=false,endAfter=false;
  this.status(kind==='question'?'checking':'speaking');
  try{
   const r=await fetch('/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callId:this.callId,language:this.language,kind,text}),signal:AbortSignal.any([job.signal,AbortSignal.timeout(30000)])});
   if(!r.ok)throw new Error((await r.json() as {error:string}).error);if(!r.body)throw new Error('Speech stream missing');
   const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='';
   try{while(true){
    const packet=await reader.read();if(!this.turn.current(job.id))return;
    buffer+=decoder.decode(packet.value,{stream:!packet.done});
    let newline:number;
    while((newline=buffer.indexOf('\n'))>=0){
     const e=JSON.parse(buffer.slice(0,newline));buffer=buffer.slice(newline+1);
     if(e.type==='answer'){this.events.line('assistant',e.reply,e.result);endAfter=e.result?.reason==='Conversational close';if(e.result)this.events.changed();}
     if(e.type==='error')throw new Error(e.error);
     if(e.type==='done'){decode.finish();done=true;}
     if(e.type==='audio'){
      const samples=decode.decode(Uint8Array.from(atob(e.pcm),c=>c.charCodeAt(0)));if(!samples.length)continue;
      // Bound queued audio so a slow speaker cannot build a large playback backlog.
      while(next-ctx.currentTime>1.5){await new Promise(resolve=>setTimeout(resolve,30));if(!this.turn.current(job.id))return;}
      if(!this.turn.current(job.id))return;
      const audio=ctx.createBuffer(1,samples.length,24000);audio.copyToChannel(samples,0);
      const source=ctx.createBufferSource();source.buffer=audio;source.connect(ctx.destination);this.nodes.add(source);source.onended=()=>{this.nodes.delete(source);source.disconnect();};
      next=Math.max(next,ctx.currentTime+0.03);source.start(next);next+=audio.duration;
      this.speaking=true;this.status('speaking');
      if(!started){started=true;if(kind==='question'&&this.lastEnd)this.events.latency(Math.round(performance.now()-this.lastEnd+30));}
     }
    }
    if(packet.done)break;
   }}finally{await reader.cancel().catch(()=>{});}
   if(!done||!started)throw new Error('Speech stream ended early. The answer is shown.');
   while(this.nodes.size&&this.turn.current(job.id))await new Promise(resolve=>setTimeout(resolve,40));
   if(this.turn.current(job.id)){this.speaking=false;this.preroll=[];this.voiced=0;if(endAfter){await this.close();return;}this.status(this.pendingConfirmation?'confirming':'listening');}
  }catch(e){if(this.turn.current(job.id)&&!this.closed){this.cancelSpeech();this.events.error((e as Error).message);this.status('listening');}}
 }
 private fail(message:string){if(this.closed)return;this.events.error(message);void this.close();}
 async close(){
  if(this.closed)return;this.closed=true;this.ready=false;this.opening.abort();this.listening.cancel();this.captured=[];this.cancelSpeech();this.transcripts.reset();
  if(this.waitTimer)clearTimeout(this.waitTimer);if(this.lifeTimer)clearTimeout(this.lifeTimer);

  if(this.capture){this.capture.port.onmessage=null;this.capture.disconnect();this.capture=null;}
  this.mic?.getTracks().forEach(t=>t.stop());this.mic=null;void this.context?.close().catch(()=>{});this.context=null;
  this.events.state('idle');const id=this.callId;this.callId=null;
  if(id){try{await api({action:'call.end',callId:id});this.events.changed();}catch{this.events.error('Voice stopped, but call history could not be updated.');}}
 }
}
