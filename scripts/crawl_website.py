"""Public, resumable Vardhaman crawl. Crawl evidence is NEVER answer approval."""
import argparse,asyncio,hashlib,io,json,re,time
from collections import Counter,deque
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlsplit,urlunsplit
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree
import httpx
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
AGENT='CampusDeskKnowledgeReview/1.0'
PRIVATE={'fees.vardhaman.org','studentscorner.vardhaman.org','login.vardhaman.org'}
ASSETS=re.compile(r'\.(?:png|jpe?g|gif|webp|svg|ico|mp[34]|mov|avi|zip|rar|css|js|woff2?|ttf|exe)(?:$|\?)',re.I)

def canonical(url,base='https://vardhaman.org/'):
    p=urlsplit(urljoin(base,url));host=(p.hostname or '').lower()
    if p.scheme not in ('http','https') or p.username or p.password or p.port not in (None,80,443):return None
    if not (host=='vardhaman.org' or host.endswith('.vardhaman.org')):return None
    if host in PRIVATE or re.search(r'/(?:wp-admin|wp-login|login|sign-in|cart|checkout|feed)(?:[/.]|$)',p.path,re.I):return None
    if ASSETS.search(p.path) or '/cdn-cgi/' in p.path or p.query:return None
    path=re.sub('/+','/',p.path or '/')
    return urlunsplit(('https',host,path,'',''))

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.stack=[];self.links=[];self.blocks=[];self.title=[];self.in_title=False
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and attrs.get('href'):self.links.append(attrs['href'])
        if tag in ('iframe','embed','object'):
            link=attrs.get('src') or attrs.get('data')
            if link:self.links.append(link)
        if tag=='title':self.in_title=True
        parent=self.stack[-1][1] if self.stack else False
        hidden=parent or tag in ('script','style','nav','header','footer','noscript','form','svg') or attrs.get('aria-hidden')=='true'
        if tag not in ('br','img','meta','link','input','hr','source','embed','wbr'):self.stack.append((tag,hidden))
        if tag in ('p','div','h1','h2','h3','h4','tr','li','br','section'):self.blocks.append('\n')
        if tag in ('td','th'):self.blocks.append(' | ')
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:self.stack=self.stack[:i];break
        if tag in ('p','div','h1','h2','h3','h4','tr','li','section'):self.blocks.append('\n')
    def handle_data(self,data):
        if self.in_title:self.title.append(data)
        elif not self.stack or not self.stack[-1][1]:self.blocks.append(data)
    def text(self):return '\n'.join(line for line in (re.sub(r'\s+',' ',x).strip() for x in ''.join(self.blocks).splitlines()) if line)

class Crawl:
    def __init__(self,args):
        self.args=args;self.folder=ROOT/'.local'/'website';self.folder.mkdir(parents=True,exist_ok=True)
        self.manifest=self.folder/'manifest.json';self.rows={};self.frontier=deque();self.queued=set();self.robots={};self.robot_locks={};self.host_locks={};self.last={};self.rejected=set();self.pdf_count=0
        if self.manifest.exists() and not args.fresh:
            old=json.loads(self.manifest.read_text(encoding='utf-8'));self.rows={x['url']:x for x in old['documents']}
            self.rejected=set(old.get('excluded',[]))
            self.pdf_count=sum(1 for x in self.rows.values() if x['status'] in ('pdf_extracted','pdf_partial','ocr_needed'))
            if args.retry_errors:
                retry=[url for url,row in self.rows.items() if row['status'] in ('error','robots_blocked','pdf_limit')]
                for url in retry:del self.rows[url];self.add(url)
            for url in old.get('pending',[]):self.add(url)
        self.add('https://vardhaman.org/');self.add('https://vardhaman.org/sitemap.xml')
    def add(self,url,base='https://vardhaman.org/'):
        value=canonical(url,base)
        if not value:
            if url.startswith(('https://','http://')):self.rejected.add(url)
            return
        if value not in self.queued and value not in self.rows:self.queued.add(value);self.frontier.append(value)
    async def get(self,url,limit=12_000_000):
        for _ in range(5):
            host=urlsplit(url).netloc;lock=self.host_locks.setdefault(host,asyncio.Lock());dest=None
            async with lock:
                await asyncio.sleep(max(0,self.args.delay-(time.monotonic()-self.last.get(host,0))))
                self.last[host]=time.monotonic()
                async with self.client.stream('GET',url) as r:
                    if r.is_redirect:
                        dest=canonical(r.headers.get('location',''),url)
                        if not dest:raise ValueError('Redirect outside public crawl scope')
                    else:
                        data=bytearray()
                        async for chunk in r.aiter_bytes():
                            data.extend(chunk)
                            if len(data)>limit:raise ValueError('Document exceeds extraction byte limit')
                        return r.status_code,r.headers.get('content-type',''),bytes(data),url
            # No host lock held while fetching a new origin's robots file.
            if not url.endswith('/robots.txt') and not await self.allowed(dest):raise ValueError('Redirect disallowed by robots')
            url=dest
        raise ValueError('Redirect limit')
    async def allowed(self,url):
        origin='https://'+urlsplit(url).netloc
        async with self.robot_locks.setdefault(origin,asyncio.Lock()):
            if origin not in self.robots:
                rp=RobotFileParser();rp.parse(['User-agent: *','Disallow: /']);self.robots[origin]=rp
                try:
                    status,_,data,_=await self.get(origin+'/robots.txt',500_000)
                    if status==200:
                        rp=RobotFileParser();rp.parse(data.decode('utf-8','replace').splitlines())
                    elif status==404:
                        rp=RobotFileParser();rp.parse(['User-agent: *','Allow: /'])
                    else:return False
                    # urllib uses first-match order; prefer the most specific path rule.
                    for entry in [*rp.entries,*([rp.default_entry] if rp.default_entry else [])]:
                        entry.rulelines.sort(key=lambda rule:(len(rule.path),rule.allowance),reverse=True)
                    self.robots[origin]=rp
                    for sitemap in rp.site_maps() or []:self.add(sitemap)
                except Exception:return False
            return self.robots[origin].can_fetch(AGENT,url)
    async def process(self,url):
        row={'url':url,'fetchedAt':datetime.now(timezone.utc).isoformat(),'status':'error','approval':'unreviewed','title':'','textPath':'','sha256':'','characters':0}
        try:
            if not await self.allowed(url):row['status']='robots_blocked';return row
            status,kind,data,final=await self.get(url);row.update(httpStatus=status,finalUrl=final,contentType=kind)
            if status!=200:row['status']='http_error';return row
            if 'xml' in kind or urlsplit(final).path.endswith('.xml'):
                doc=ElementTree.fromstring(data)
                for node in doc.iter():
                    if node.tag.rsplit('}',1)[-1]=='loc' and node.text:self.add(node.text)
                row['status']='sitemap';return row
            if 'pdf' in kind or data.startswith(b'%PDF'):
                if self.pdf_count>=self.args.max_pdfs:row['status']='pdf_limit';return row
                self.pdf_count+=1;reader=PdfReader(io.BytesIO(data));row['pages']=len(reader.pages)
                text='\n\n'.join(f'[Page {i+1}]\n'+(page.extract_text() or '') for i,page in enumerate(reader.pages[:300]))
                row['title']=str((reader.metadata or {}).get('/Title') or urlsplit(final).path.rsplit('/',1)[-1]);row['status']='pdf_extracted' if len(re.sub(r'\[Page \d+\]|\s','',text))>80 else 'ocr_needed'
                if len(reader.pages)>300:row['status']='pdf_partial'
            elif 'html' in kind:
                page=Page();page.feed(data.decode('utf-8','replace'));text=page.text();row['title']=' '.join(page.title).strip();row['status']='html_extracted' if len(text)>80 else 'empty_or_dynamic'
                for link in page.links:self.add(link,final)
                if urlsplit(final).path=='/':self.add('/sitemap.xml',final)
            else:row['status']='unsupported_content';return row
            digest=hashlib.sha256(text.encode()).hexdigest();filename=hashlib.sha256(url.encode()).hexdigest()[:24]+'.txt'
            (self.folder/filename).write_text(text,encoding='utf-8');row.update(textPath=filename,sha256=digest,characters=len(text),excerpt=text[:900])
        except Exception as e:row['error']=type(e).__name__+': '+str(e)[:180]
        return row
    def save(self):
        counts=dict(Counter(x['status'] for x in self.rows.values()));pending=list(self.frontier)
        clean=all(x['status'] in ('sitemap','html_extracted','pdf_extracted') for x in self.rows.values())
        summary={'generatedAt':datetime.now(timezone.utc).isoformat(),'root':'https://vardhaman.org/','approval':'unreviewed','complete':not pending and clean,'discoveryExhausted':not pending,'counts':counts,'pendingCount':len(pending),'excludedCount':len(self.rejected),'limits':{'maxDocuments':self.args.max_documents,'maxPdfs':self.args.max_pdfs,'maxDocumentBytes':12000000},'documents':list(self.rows.values()),'pending':pending,'excluded':sorted(self.rejected)}
        temp=self.manifest.with_suffix('.tmp');temp.write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(self.manifest)
        (ROOT/'data').mkdir(exist_ok=True)
        # No raw HTML or PDFs in the app; expose provenance and a bounded review excerpt only.
        catalog={k:v for k,v in summary.items() if k not in ('pending','excluded')}
        catalog['documents']=[{k:v for k,v in row.items() if k!='textPath'} for row in summary['documents']]
        target=ROOT/'data'/'website-crawl.json';temp=target.with_suffix('.tmp');temp.write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf-8');temp.replace(target)
        print(json.dumps({'processed':len(self.rows),'pending':len(pending),'counts':counts}),flush=True)
    async def run(self):
        async with httpx.AsyncClient(timeout=20,headers={'User-Agent':AGENT},follow_redirects=False) as client:
            self.client=client
            # Prime main robots to avoid concurrent placeholder denial.
            await self.allowed('https://vardhaman.org/')
            while self.frontier and len(self.rows)<self.args.max_documents:
                batch=[self.frontier.popleft() for _ in range(min(self.args.concurrency,len(self.frontier),self.args.max_documents-len(self.rows)))]
                for row in await asyncio.gather(*(self.process(url) for url in batch)):self.rows[row['url']]=row
                if len(self.rows)%20<self.args.concurrency:self.save()
            self.save()

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--max-documents',type=int,default=1500);p.add_argument('--max-pdfs',type=int,default=300);p.add_argument('--delay',type=float,default=.4);p.add_argument('--concurrency',type=int,default=3);p.add_argument('--fresh',action='store_true');p.add_argument('--retry-errors',action='store_true')
    asyncio.run(Crawl(p.parse_args()).run())
