import { env } from 'cloudflare:workers';
export const runtime=()=>env as Cloudflare.Env;
export function database(){const db=runtime().DB;if(!db)throw new Error('The college database is temporarily unavailable. Please try again.');return db;}
export const uid=()=>crypto.randomUUID();
export const now=()=>new Date().toISOString();
export const redact=(s:string)=>s.replace(/\b\d{10,16}\b/g,'[number redacted]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email redacted]').replace(/\b(?:otp|pin|password)\s*(?:is|:|=)?\s*\S+/gi,'[credential redacted]');
export async function log(actor:string,action:string,id:string,detail:string){await database().prepare('INSERT INTO audit (id,actor,action,entity_id,detail,created_at) VALUES (?,?,?,?,?,?)').bind(uid(),actor,action,id,redact(detail),now()).run();}
export async function getActor(req:Request){
 const user=req.headers.get('oai-authenticated-user-id');if(user)return `staff:${user}`;
 const token=runtime().DESK_SERVICE_TOKEN;const supplied=req.headers.get('authorization')?.replace(/^Bearer /,'');
 if(token&&supplied){const a=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(supplied)));let n=0;for(let i=0;i<a.length;i++)n|=a[i]^b[i];if(!n)return 'service:voice';}
 return null;
}
export function sameOrigin(req:Request,actor:string){if(actor.startsWith('service:'))return true;const origin=req.headers.get('origin');return !origin||origin===new URL(req.url).origin;}
