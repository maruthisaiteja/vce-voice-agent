import {sarvamToolAuthorized,sarvamAgentTool} from '@/lib/sarvam-agent';
import {VoiceLimit} from '@/lib/voice-budget';
import {ZodError} from 'zod';
export async function POST(req:Request){
 if(!await sarvamToolAuthorized(req))return Response.json({error:'Invalid tool credential'},{status:401});
 const raw=await req.text();if(raw.length>12000)return Response.json({error:'Request too large'},{status:413});
 try{return Response.json(await sarvamAgentTool(JSON.parse(raw),req.signal),{headers:{'Cache-Control':'no-store'}});}
 catch(e){
  // Field/type diagnostics contain no caller values or credentials. They let
  // integration owners distinguish a malformed provider template from an outage.
  const fields=e instanceof ZodError?e.issues.map(issue=>({field:issue.path.join('.'),code:issue.code,...(issue.code==='invalid_type'?{expected:issue.expected,received:issue.received}:{})})):undefined;
  console.warn('sarvam_tool_rejected',JSON.stringify({kind:e instanceof ZodError?'validation':e instanceof SyntaxError?'json':e instanceof VoiceLimit?'limit':'operation',fields}));
  return Response.json({error:'The college tool could not complete. Do not claim success.',fields},{status:e instanceof VoiceLimit?e.status:400,headers:{'Cache-Control':'no-store'}});
 }
}
