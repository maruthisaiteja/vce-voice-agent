import {database} from './store';
import {loadCall} from './desk';

export class VoiceLimit extends Error {status:number;constructor(message:string,status=429){super(message);this.status=status;}}
// Atomic, shared D1 counters. Failed or cancelled provider attempts still consume a slot.
// This bounds our API requests; direct provider sockets need a server relay to enforce duration.
export async function admitVoice(actor:string,callId:string,operation:'listen'|'speech'|'audio'|'transcribe',at=Date.now()){
 const call=await loadCall(callId);
 if(call.status!=='active')throw new VoiceLimit('This conversation has ended.',409);
 const started=Date.parse(String(call.started_at));
 if(!Number.isFinite(started)||at-started>15*60000)throw new VoiceLimit('The voice session expired. Start a new conversation.',409);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(actor));
 const owner=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const minute=Math.floor(at/60000),day=Math.floor(at/86400000),expiry=new Date(at+2*86400000).toISOString();
 const limits:[string,number][]=[
  [`actor:${owner}:${operation}:${minute}`,operation==='listen'?6:30],
  [`call:${callId}:${operation}`,operation==='listen'?4:80],
  [`pilot:${operation}:${day}`,operation==='listen'?250:2000]
 ];
 for(const [id,limit] of limits){
  const slot=await database().prepare('INSERT INTO voice_budgets (id,uses,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET uses=uses+1 WHERE uses<? RETURNING uses').bind(id,expiry,limit).first();
  if(!slot)throw new VoiceLimit('Voice usage limit reached. Please wait or ask the administrator.');
 }
 await database().prepare('DELETE FROM voice_budgets WHERE expires_at<?').bind(new Date(at).toISOString()).run();
}
