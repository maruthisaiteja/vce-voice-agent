import {runtime} from './store';
import type {Language} from './policy';

export const sarvamHeaders=()=>({'api-subscription-key':runtime().SARVAM_API_KEY??''});
export function base64(bytes:Uint8Array){let value='';for(let i=0;i<bytes.length;i+=12000)value+=String.fromCharCode(...bytes.subarray(i,i+12000));return btoa(value);}
export async function transcribe(file:File,signal:AbortSignal){
 const body=new FormData();body.set('file',file,file.name);body.set('model',runtime().SARVAM_TRANSCRIBE_MODEL??'saaras:v4');body.set('mode','codemix');
 const r=await fetch('https://api.sarvam.ai/speech-to-text',{method:'POST',headers:sarvamHeaders(),body,signal});
 if(!r.ok)throw new Error('Sarvam transcription unavailable');const data:any=await r.json();
 if(typeof data.transcript!=='string'||data.transcript.length>2000)throw new Error('Invalid transcription');return data.transcript;
}
export function speechRequest(text:string,language:Language,stream:boolean){return {text,language_code:`${language}-IN`,model:runtime().SARVAM_TTS_MODEL??'bulbul:v3',speaker:runtime().SARVAM_VOICE??'ritu',pace:1.05,temperature:0.3,speech_sample_rate:24000,output_audio_codec:stream?'linear16':'wav',...(runtime().SARVAM_DICTIONARY_ID?{dict_id:runtime().SARVAM_DICTIONARY_ID}:{})};}
export async function speechWav(text:string,signal:AbortSignal,language:Language='en'){
 const r=await fetch('https://api.sarvam.ai/text-to-speech',{method:'POST',headers:{...sarvamHeaders(),'Content-Type':'application/json'},body:JSON.stringify(speechRequest(text,language,false)),signal});
 if(!r.ok)throw new Error('Sarvam speech unavailable');const data:any=await r.json();
 if(!Array.isArray(data.audios)||data.audios.length!==1||typeof data.audios[0]!=='string'||data.audios[0].length>4_000_000)throw new Error('Invalid speech response');
 const audio=data.audios[0],header=atob(audio.slice(0,64));if(!header.startsWith('RIFF')||header.slice(8,12)!=='WAVE')throw new Error('Invalid WAV audio');return audio as string;
}
export async function* speechPCM(text:string,signal:AbortSignal,language:Language='en'):AsyncGenerator<Uint8Array>{
 const r=await fetch('https://api.sarvam.ai/text-to-speech/stream',{method:'POST',headers:{...sarvamHeaders(),'Content-Type':'application/json'},body:JSON.stringify(speechRequest(text,language,true)),signal});
 if(!r.ok||!r.body||r.headers.get('content-type')?.includes('json'))throw new Error('Sarvam speech unavailable');
 const reader=r.body.getReader();let size=0;
 try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3_000_000)throw new Error('Speech limit');yield value;}if(!size||size%2)throw new Error('Incomplete PCM audio');}
 finally{await reader.cancel().catch(()=>{});}
}
