'use client';
import {useEffect,useState} from 'react';

export default function WebsiteReview({onDraft}:{onDraft:(value:Record<string,any>)=>void}){
 const [data,setData]=useState<any>(null),[search,setSearch]=useState(''),[offset,setOffset]=useState(0),[error,setError]=useState('');
 useEffect(()=>{const abort=new AbortController();const delay=setTimeout(()=>{
  void fetch(`/api/website?q=${encodeURIComponent(search)}&offset=${offset}`,{signal:abort.signal}).then(async r=>{if(!r.ok)throw new Error('Website evidence could not load');return r.json();}).then(d=>{setData(d);setError('');}).catch(e=>{if(!abort.signal.aborted)setError(e.message);});
 },200);return()=>{clearTimeout(delay);abort.abort();};},[search,offset]);
 return <section className="panel pad"><h2>Website evidence</h2><p>Search the public crawl before writing a short answer. Extracted pages are evidence to review; they are not automatically approved answers.</p>
  <input aria-label="Search website evidence" placeholder="Search department, topic, URL or extraction status" value={search} onChange={e=>{setSearch(e.target.value);setOffset(0);}}/>
  {error&&<p role="alert">{error}</p>}
  {data&&<><p>Fetched {new Date(data.generatedAt).toLocaleDateString('en-IN')} · {data.counts.html_extracted??0} pages · {data.counts.pdf_extracted??0} PDFs · {data.pendingCount} pending · {data.complete?'Discovered crawl completed':'Coverage has gaps; see extraction statuses'}</p>
   <details><summary>Extraction counts</summary><p>{Object.entries(data.counts).map(([status,count])=>`${status}: ${count}`).join(' · ')}</p></details>
   {data.documents.map((d:any)=><details key={d.url}><summary>{d.title||d.url} · {d.status.replaceAll('_',' ')}</summary><p><a href={d.url} target="_blank" rel="noreferrer">Open original college source ↗</a></p>{d.excerpt&&<p style={{whiteSpace:'pre-wrap'}}>{d.excerpt}</p>}<small>{d.characters} extracted characters · fetched {new Date(d.fetchedAt).toLocaleString('en-IN')}</small>{d.error&&<p>{d.error}</p>}{d.excerpt&&<p><button className="button secondary" onClick={()=>onDraft({title:d.title.slice(0,500),source:d.url,department:'general',topic:'website-review',access:'public',effectiveFrom:new Date().toISOString().slice(0,10),expiresOn:'',question:'',answer:'',answerTe:'',answerHi:''})}>Write a reviewed answer</button></p>}</details>)}
   <div className="voice-mode"><button className="button secondary" disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-25))}>Previous</button><span>{data.total?offset+1:0}–{Math.min(offset+25,data.total)} of {data.total}</span><button className="button secondary" disabled={offset+25>=data.total} onClick={()=>setOffset(offset+25)}>Next</button></div>
  </>}
 </section>;
}
