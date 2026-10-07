// The parent creates a 16 kHz context. Capture only; output stays silent.
class CampusCapture extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Int16Array(2048);this.index=0;this.energy=0;}
 process(inputs){
  const input=inputs[0]?.[0];if(!input)return true;
  for(const value of input){
   const v=Math.max(-1,Math.min(1,value));this.energy+=v*v;this.samples[this.index++]=v<0?v*32768:v*32767;
   if(this.index===this.samples.length){const samples=this.samples;this.port.postMessage({pcm:samples.buffer,rms:Math.sqrt(this.energy/samples.length)},[samples.buffer]);this.samples=new Int16Array(2048);this.index=0;this.energy=0;}
  }
  return true;
 }
}
registerProcessor('campus-capture',CampusCapture);
