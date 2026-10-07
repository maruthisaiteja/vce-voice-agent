import {getActor,sameOrigin} from '@/lib/store';
// Transcript review happens after Realtime audio has already reached the caller.
// Fail closed until a pre-playback authority gate is implemented and benchmarked.
export async function POST(req:Request){
 const actor=await getActor(req);
 if(!actor?.startsWith('staff:'))return Response.json({error:'Staff access required'},{status:401});
 if(!sameOrigin(req,actor))return Response.json({error:'Invalid request origin'},{status:403});
 return Response.json({error:'Realtime caller playback is paused: generated speech cannot yet be checked before playback. Use Verified voice. Live Realtime benchmarking needs an isolated evaluation harness.'},{status:409});
}
