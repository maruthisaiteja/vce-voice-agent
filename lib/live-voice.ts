import type {Language} from './policy';

export const voicePhrases = {
 en: {hello:'Hello, I’m Vardhaman’s AI assistant. How can I help?',repeat:'Please say that again.',confirm:(s:string)=>`I heard: ${s} Is that right?`},
 te: {hello:'హలో, నేను వర్ధమాన్ AI అసిస్టెంట్. ఎలా సహాయం చేయాలి?',repeat:'దయచేసి మళ్లీ చెప్పండి.',confirm:(s:string)=>`మీరు చెప్పింది: ${s} సరేనా?`},
 hi: {hello:'नमस्ते, मैं वर्धमान की AI सहायक हूँ। कैसे मदद करूँ?',repeat:'कृपया दोबारा कहें।',confirm:(s:string)=>`मैंने सुना: ${s} क्या यह सही है?`},
};
export function needsConfirmation(text:string){return /\d|₹|name is|my name|పేరు|नाम|tomorrow|రేపు|कल/iu.test(text);}
export function confirmationChoice(text:string):'yes'|'no'|null {
 const s=text.toLowerCase().trim().replace(/[.!?।]+$/u,'');
 if(/^(yes|yes please|correct|that is correct|that's right|right|అవును|సరే|हाँ|हां|जी|सही है)$/.test(s))return 'yes';
 if(/^(no|nope|incorrect|that's wrong|కాదు|లేదు|नहीं|गलत)$/.test(s))return 'no';
 return null;
}
// Commits are acknowledged in socket order; transcription completions can arrive out of order.
// A new utterance invalidates old results before they can reach the answer resolver.
export class TranscriptTurns {
 private waiting:number[]=[];
 private items=new Map<string,number>();
 private latest=0;
 begin(){return ++this.latest;}
 commit(turn:number){this.waiting.push(turn);}
 acknowledged(item:string){const turn=this.waiting.shift();if(turn!==undefined)this.items.set(item,turn);}
 complete(item:string){const turn=this.items.get(item);this.items.delete(item);return turn!==undefined&&turn===this.latest;}
 reset(){this.waiting=[];this.items.clear();this.latest++;}
}

// PCM network chunks may split a 16-bit sample at any byte boundary.
export class PCMDecoder {
 private carry:number|null=null;
 decode(bytes:Uint8Array){
  const data=new Uint8Array(bytes.length+(this.carry===null?0:1));
  if(this.carry!==null){data[0]=this.carry;data.set(bytes,1);}else data.set(bytes);
  this.carry=data.length%2?data[data.length-1]:null;
  const out=new Float32Array(Math.floor(data.length/2));
  const view=new DataView(data.buffer);for(let i=0;i<out.length;i++)out[i]=view.getInt16(i*2,true)/32768;
  return out;
 }
 finish(){if(this.carry!==null)throw new Error('Incomplete speech sample');}
}
