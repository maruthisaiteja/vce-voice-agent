import {getActor} from '@/lib/store';
import crawl from '@/data/website-crawl.json';

export async function GET(req:Request){
 const actor=await getActor(req);if(!actor?.startsWith('staff:'))return Response.json({error:'Staff access required'},{status:401});
 const url=new URL(req.url),q=(url.searchParams.get('q')??'').slice(0,120).toLowerCase();
 const offset=Math.max(0,Math.min(10000,Number(url.searchParams.get('offset'))||0));
 const documents=crawl.documents.filter(d=>`${d.title} ${d.url} ${d.status} ${'excerpt' in d?d.excerpt:''}`.toLowerCase().includes(q));
 const {documents:_,...summary}=crawl;
 return Response.json({...summary,total:documents.length,documents:documents.slice(offset,offset+25)},{headers:{'Cache-Control':'no-store'}});
}
