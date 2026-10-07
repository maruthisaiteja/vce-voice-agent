import {getActor,sameOrigin,runtime} from '@/lib/store';
import {config,loadCall} from '@/lib/desk';
import {transcribe} from '@/lib/sarvam';
import {admitVoice,VoiceLimit} from '@/lib/voice-budget';

// Completed microphone utterance only. The provider key never reaches the browser.
export async function POST(req:Request){
 const actor=await getActor(req);
 if(!actor?.startsWith('staff:'))return Response.json({error:'Staff access required'},{status:401});
 if(!sameOrigin(req,actor))return Response.json({error:'Invalid request origin'},{status:403});
 if(!(await config()).voiceEnabled||!runtime().SARVAM_API_KEY)return Response.json({error:'Configure SARVAM_API_KEY and enable live voice.'},{status:503});
 if(Number(req.headers.get('content-length')??0)>850000)return Response.json({error:'Question too long'},{status:413});
 try{
  const body=await req.formData(),callId=String(body.get('callId')??''),audio=body.get('audio');
  if(!(audio instanceof File)||audio.type!=='audio/wav'||audio.size<200||audio.size>820000)return Response.json({error:'Invalid voice audio'},{status:400});
  const call=await loadCall(callId);
  if(call.status!=='active'||call.channel!=='voice')return Response.json({error:'An active voice conversation is required'},{status:409});
  await admitVoice(actor,callId,'transcribe');
  const text=await transcribe(audio,AbortSignal.any([req.signal,AbortSignal.timeout(15000)]));
  req.signal.throwIfAborted();if((await loadCall(callId)).status!=='active')return Response.json({error:'Conversation ended'},{status:409});
  return Response.json({text},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof VoiceLimit)return Response.json({error:e.message},{status:e.status,headers:{'Retry-After':'60'}});return Response.json({error:'Sarvam could not transcribe this question. Please try again.'},{status:502});}
}
