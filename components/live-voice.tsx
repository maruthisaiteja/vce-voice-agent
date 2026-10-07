'use client';
import {useEffect,useRef,useState} from 'react';
import {Mic,PhoneOff,Square} from 'lucide-react';
import {LiveVoiceClient} from '@/lib/live-voice-client';
import type {Language} from '@/lib/policy';

export default function LiveVoice({enabled,language,onChange}:{enabled:boolean;language:Language;onChange:()=>Promise<void>}){
 const engine=useRef<LiveVoiceClient|null>(null),mounted=useRef(true);
 const [state,setState]=useState('idle'),[error,setError]=useState(''),[latency,setLatency]=useState<number|null>(null),[consent,setConsent]=useState(false);
 const [lines,setLines]=useState<{role:string;text:string;result?:any}[]>([]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;void engine.current?.close();engine.current=null;};},[]);
 useEffect(()=>{void engine.current?.close();engine.current=null;setState('idle');},[language]);
 function start(){
  setError('');setLines([]);setLatency(null);
  const client=new LiveVoiceClient(language,{state:s=>{if(mounted.current&&engine.current===client)setState(s);},line:(role,text,result)=>{if(mounted.current&&engine.current===client)setLines(l=>[...l,{role,text,result}]);},partial:()=>{},error:e=>{if(mounted.current&&engine.current===client)setError(e);},latency:n=>{if(mounted.current&&engine.current===client)setLatency(n);},changed:()=>{void onChange().catch(()=>{});}});
  engine.current=client;void client.start();
 }
 return <div className="verified-voice">
  <h3>{({idle:'A real conversation, one question at a time.',connecting:'Connecting the microphone…',listening:'Listening — speak naturally',checking:'Checking the college source…',speaking:'Speaking — talk to interrupt',confirming:'Say yes, or tell me the correction'} as Record<string,string>)[state]}</h3>
  <p>Sarvam voice: short spoken answers in English, Telugu or Hindi. A pause finishes your question. You can talk over the answer to interrupt.</p>
  {state==='idle'&&<label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I agree to send microphone audio to the Sarvam during this test call.</label>}
  <div className="voice-mode">{state==='idle'?<button className="button" disabled={!enabled||!consent} onClick={start}><Mic size={17}/>Start voice call</button>:<><button className="button secondary" onClick={()=>engine.current?.interrupt()}>Interrupt</button><button className="button secondary" onClick={()=>engine.current?.finishQuestion()}><Square size={17}/>Finish question</button><button className="button" onClick={()=>void engine.current?.close()}><PhoneOff size={17}/>End call</button></>}</div>
  {!enabled&&<p className="notice">Add SARVAM_API_KEY locally and enable live voice in Settings to test this call.</p>}
  {error&&<p role="alert" className="notice">{error}</p>}
  <small>AI assistant · audio is not saved by Campus Desk · headset recommended for interruption accuracy · live device testing still required</small>
  {latency!==null&&<p>{latency} ms estimated end of speech → first scheduled answer audio. Hardware buffering is not measured.</p>}
  <div className="voice-lines">{lines.map((line,i)=><div className={`chat ${line.role}`} key={i}><span>{line.role==='caller'?'YOU':'CAMPUS DESK'}</span><p>{line.text}</p>{line.result?.sources?.map((s:any)=><small key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a></small>)}</div>)}</div>
 </div>;
}
