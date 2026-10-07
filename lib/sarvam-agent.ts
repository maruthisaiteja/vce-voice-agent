import {z} from 'zod';
import {runtime,database,now,redact} from './store';
import {action,config,loadCall,startCall,resolveQuery} from './desk';
import {admitVoice,VoiceLimit} from './voice-budget';

// HTTP template editors may serialize typed arguments as JSON strings. Accept
// only exact boolean spellings; truthiness coercion would make "false" consent.
const toolBoolean=z.preprocess(value=>value==='true'?true:value==='false'?false:value,z.boolean().default(false));
const requestSchema=z.object({interactionId:z.string().min(1).max(160),operation:z.enum(['start','resolve','prepare_email','request_staff','end']),language:z.enum(['en','te','hi']).default('en'),question:z.string().trim().min(1).max(2000).optional(),requestId:z.string().min(1).max(90).optional(),department:z.string().max(80).optional(),summary:z.string().trim().min(1).max(500).optional(),replyTo:z.string().max(200).default(''),consent:toolBoolean,confirmed:toolBoolean}).strict();
async function digest(s:string){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));}
export async function sarvamToolAuthorized(req:Request){
 const secret=runtime().SARVAM_TOOL_TOKEN,supplied=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!secret||!supplied)return false;
 const a=await digest(secret),b=await digest(supplied);let delta=0;for(let i=0;i<a.length;i++)delta|=a[i]^b[i];return delta===0;
}
// Scope every call to provider interaction identity. Never trust a model-supplied Campus Desk call ID.
export async function sarvamAgentTool(raw:unknown,signal?:AbortSignal){
 const b=requestSchema.parse(raw),actor='service:sarvam';
 if(!(await config()).voiceEnabled)throw new VoiceLimit('Voice is disabled',503);
 const hash=Array.from(await digest(b.interactionId),n=>n.toString(16).padStart(2,'0')).join(''),callId='sarvam-'+hash;
 if(b.operation==='start'){
  const existing=await database().prepare('SELECT id FROM calls WHERE id=?').bind(callId).first();
  if(!existing){
   const bucket='sarvam-start:'+Math.floor(Date.now()/86400000);
   const slot=await database().prepare('INSERT INTO voice_budgets (id,uses,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET uses=uses+1 WHERE uses<250 RETURNING uses').bind(bucket,new Date(Date.now()+2*86400000).toISOString()).first();
   if(!slot)throw new VoiceLimit('Pilot daily call limit reached');
   try{await startCall(b.language,'voice',actor,callId);}catch(e){if(!await database().prepare('SELECT id FROM calls WHERE id=?').bind(callId).first())throw e;}
  }
  const call=await loadCall(callId);return {status:call.status,reply:'',recordingEnabled:false};
 }
 const call=await loadCall(callId);
 if(b.operation==='end'){
  // Preserve original end timestamp on duplicate lifecycle hooks.
  if(call.status==='active')await action({action:'call.end',callId},actor,signal);
  return {status:'completed',reply:''};
 }
 await admitVoice(actor,callId,'speech');
 if(b.operation==='resolve'){
  if(!b.question)throw new Error('Question required');
  const result=await resolveQuery(callId,b.question,b.language,actor,signal);
  return {...result,speakExactly:result.reply,actionCompleted:false};
 }
 if(!b.requestId||!b.department||!b.summary)throw new Error('Draft details required');
 if(b.operation==='request_staff'){
  if(!b.consent||!b.confirmed)throw new Error('Confirm and obtain consent first');
  if(!await database().prepare('SELECT id FROM departments WHERE id=?').bind(b.department).first())throw new Error('Unknown department');
  const id='sarvam-'+hash+'-'+b.requestId,summary=redact(b.summary);
  await database().prepare("INSERT INTO tickets (id,call_id,department,category,summary,status,created_at,updated_at,callback_at,contact,priority) VALUES (?,?,?,'handoff',?,'open',?,?,NULL,'','normal') ON CONFLICT(id) DO NOTHING").bind(id,callId,b.department,summary,now(),now()).run();
  const saved=await database().prepare('SELECT department,summary FROM tickets WHERE id=?').bind(id).first();
  if(saved?.department!==b.department||saved?.summary!==summary)throw new Error('Request ID reused with different details');
  const reply={en:'Your request is saved for the office. A callback time has not been confirmed.',te:'మీ అభ్యర్థన ఆఫీసు కోసం సేవ్ అయింది. తిరిగి కాల్ చేసే సమయం ఇంకా నిర్ధారించలేదు.',hi:'आपका अनुरोध कार्यालय के लिए सहेजा गया है। वापस कॉल करने का समय तय नहीं हुआ है।'}[b.language];
  return {status:'callback_requested',ticketId:id,reply,speakExactly:reply,connected:false};
 }
 const result:any=await action({action:'email.prepare',requestId:hash+'-'+b.requestId.slice(0,90),callId,department:b.department,summary:b.summary,replyTo:b.replyTo,consent:b.consent,confirmed:b.confirmed},actor,signal);
 if(!['draft','recipient_needed'].includes(result.status))throw new Error('This email has an existing delivery outcome; staff review required');
 const reply={en:'Your email draft is saved for staff review. It has not been sent.',te:'మీ ఈమెయిల్ ముసాయిదా సిబ్బంది సమీక్ష కోసం సేవ్ అయింది. ఇంకా పంపలేదు.',hi:'आपका ईमेल ड्राफ्ट कर्मचारी समीक्षा के लिए सहेजा गया है। अभी भेजा नहीं गया है।'}[b.language];
 return {id:result.id,status:result.status,reply,speakExactly:reply,sent:false};
}
