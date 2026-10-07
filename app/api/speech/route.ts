import {speechPCM,base64} from '@/lib/sarvam';
import {getActor,sameOrigin,runtime,database} from '@/lib/store';
import {config,loadCall,resolveQuery} from '@/lib/desk';
import {voicePhrases} from '@/lib/live-voice';
import {admitVoice,VoiceLimit} from '@/lib/voice-budget';
import type {Language} from '@/lib/policy';

// Metadata and PCM are streamed in order. No client-supplied factual answer is spoken.
export async function POST(req:Request){
 const actor=await getActor(req);
 if(!actor?.startsWith('staff:'))return Response.json({error:'Staff access required'},{status:401});
 if(!sameOrigin(req,actor))return Response.json({error:'Invalid request origin'},{status:403});
 if(!(await config()).voiceEnabled||!runtime().SARVAM_API_KEY)return Response.json({error:'Configure the voice API key and enable live voice.'},{status:503});
 if(Number(req.headers.get('content-length')??0)>12000)return Response.json({error:'Voice request too large'},{status:413});
 try{
  const b=await req.json() as {callId:string;language:Language;kind:string;text?:string};
  if(!['en','te','hi'].includes(b.language)||!['question','hello','confirm','repeat'].includes(b.kind)||typeof b.callId!=='string'||(b.text!==undefined&&(typeof b.text!=='string'||b.text.length>2000)))return Response.json({error:'Invalid voice request'},{status:400});
  const call=await loadCall(b.callId);if(call.status!=='active')return Response.json({error:'Conversation ended'},{status:409});
  if(['question','confirm'].includes(b.kind)&&!b.text?.trim())return Response.json({error:'Question required'},{status:400});
  await admitVoice(actor,b.callId,'speech');
  const count=await database().prepare("SELECT COUNT(*) AS n FROM turns WHERE call_id=? AND role='caller'").bind(b.callId).first<{n:number}>();
  if((count?.n??0)>=60)return Response.json({error:'Start a new conversation'},{status:429});
  const result=b.kind==='question'?await resolveQuery(b.callId,b.text!,b.language,actor,req.signal):null;
  const phrases=voicePhrases[b.language];
  const reply=result?.reply??(b.kind==='confirm'?phrases.confirm(b.text!):b.kind==='hello'?phrases.hello:phrases.repeat);
  const stop=new AbortController(),signal=AbortSignal.any([req.signal,stop.signal,AbortSignal.timeout(25000)]),encoder=new TextEncoder();
  const stream=new ReadableStream<Uint8Array>({
   async start(controller){
    const send=(value:unknown)=>controller.enqueue(encoder.encode(JSON.stringify(value)+'\n'));
    try{
     signal.throwIfAborted();send({type:'answer',reply,result});
     for await(const bytes of speechPCM(reply,signal,result?.language??b.language)){for(let i=0;i<bytes.length;i+=12000)send({type:'audio',pcm:base64(bytes.subarray(i,i+12000))});}
     signal.throwIfAborted();send({type:'done'});controller.close();
    }catch{if(!signal.aborted){send({type:'error',error:'Speech unavailable. The verified answer is shown.'});controller.close();}else{try{controller.error(new Error('Voice turn cancelled'));}catch{}}}
   },cancel(){stop.abort();}
  });
  return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){if(e instanceof VoiceLimit)return Response.json({error:e.message},{status:e.status,headers:{'Retry-After':'60'}});return Response.json({error:'The question could not be checked. Please try again.'},{status:502});}
}
