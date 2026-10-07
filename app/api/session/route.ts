import {createSession,equalSecret,sessionCookie} from '@/lib/session';
import {database} from '@/lib/store';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 if(!process.env.STAFF_LOGIN_KEY||process.env.STAFF_LOGIN_KEY.length<32||!process.env.SESSION_SECRET)return Response.json({error:'Staff sign-in is not configured yet.'},{status:503});
 try {
  const raw=await req.text();if(raw.length>1000)return Response.json({error:'Invalid request'},{status:413});
  // Global shared pilot limit, also prevents attackers from evading it with spoofed IPs.
  const bucket='staff-login:'+Math.floor(Date.now()/60000);
  const slot=await database().prepare('INSERT INTO voice_budgets (id,uses,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET uses=uses+1 WHERE uses<20 RETURNING uses').bind(bucket,new Date(Date.now()+86400000).toISOString()).first();
  if(!slot)return Response.json({error:'Too many attempts. Please wait a minute.'},{status:429});
  const value=JSON.parse(raw).key;if(typeof value!=='string'||!await equalSecret(value,process.env.STAFF_LOGIN_KEY))return Response.json({error:'Invalid access key.'},{status:401});
  const token=await createSession();return Response.json({ok:true},{headers:{'Set-Cookie':`${sessionCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`,'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Sign-in is unavailable. Please check deployment setup.'},{status:503});}
}
export async function DELETE(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)return new Response(null,{status:403});return Response.json({ok:true},{headers:{'Set-Cookie':`${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Secure`}});}
