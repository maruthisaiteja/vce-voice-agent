import {transcribe,speechWav} from '@/lib/sarvam';
import {getActor,sameOrigin,runtime,database} from '@/lib/store';
import {config,loadCall,resolveQuery} from '@/lib/desk';
import type {Language} from '@/lib/policy';
import {admitVoice,VoiceLimit} from '@/lib/voice-budget';
// Chained audio: transcription -> authorised exact answer -> speech of that answer.
// No speech language model is asked to compose college facts.
export async function POST(req:Request){
 const actor=await getActor(req);if(!actor?.startsWith('staff:'))return Response.json({error:'Staff access required'},{status:401});
 if(!sameOrigin(req,actor))return Response.json({error:'Invalid request origin'},{status:403});
 const cfg=await config();if(!cfg.voiceEnabled||!runtime().SARVAM_API_KEY)return Response.json({error:'Premium voice needs the API key and the Enable live voice setting.'},{status:503});
 if(Number(req.headers.get('content-length')??0)>4_300_000)return Response.json({error:'Use an audio turn shorter than 30 seconds.'},{status:413});
 let stage='validation',heard='';let verified:Awaited<ReturnType<typeof resolveQuery>>|undefined;
 try{
 const form=await req.formData(),file=form.get('audio'),callId=String(form.get('callId')??''),language=String(form.get('language')??'en') as Language;
 const confirmed=String(form.get('confirmedTranscript')??'').trim();
 if(!confirmed&&(!(file instanceof File)||file.size<200||file.size>4_000_000||!['en','te','hi'].includes(language)||!/^audio\/(webm|mp4|ogg|mpeg|wav)/.test(file.type)))return Response.json({error:'Invalid audio turn. Use a supported microphone recording.'},{status:400});
 if(confirmed&&(confirmed.length>2000||!['en','te','hi'].includes(language)))return Response.json({error:'Invalid confirmed question'},{status:400});
 const c=await loadCall(callId);if(c.status!=='active')return Response.json({error:'This conversation has ended.'},{status:409});
 await admitVoice(actor,callId,'audio');
 const count=await database().prepare("SELECT COUNT(*) AS n FROM turns WHERE call_id=? AND role='caller'").bind(callId).first<{n:number}>();if((count?.n??0)>=60)return Response.json({error:'Start a new voice conversation.'},{status:429});
 let transcript:{text?:string}={text:confirmed};
 if(!confirmed){
 stage='transcription';transcript={text:await transcribe(file as File,AbortSignal.any([req.signal,AbortSignal.timeout(20000)]))};if(!transcript.text?.trim()||transcript.text.length>2000)return Response.json({error:'I couldn’t hear a clear question. Please try again.'},{status:422});
 if(/\d|₹|name is|my name|పేరు|नाम|tomorrow|రేపు|कल/iu.test(transcript.text!))return Response.json({transcript:transcript.text,confirmationRequired:true},{headers:{'Cache-Control':'no-store'}});
 }
 req.signal.throwIfAborted();
 stage='answer';heard=transcript.text!;const result=await resolveQuery(callId,transcript.text!,language,actor,req.signal);verified=result;
 req.signal.throwIfAborted();stage='speech';const audio=await speechWav(result.reply,AbortSignal.any([req.signal,AbortSignal.timeout(20000)]),result.language??language);
 return Response.json({transcript:transcript.text,result,audio,audioMime:'audio/wav'}, {headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof VoiceLimit)return Response.json({error:e.message},{status:e.status,headers:{'Retry-After':'60'}});console.error('Audio turn failed',stage,e instanceof Error?e.name:'Unknown');if(verified)return Response.json({transcript:heard,result:verified,audio:null,audioError:'Speech playback is unavailable. The verified text answer is shown.'},{headers:{'Cache-Control':'no-store'}});return Response.json({error:'The voice turn could not complete. Please retry or use the text test.'},{status:502});}
}
