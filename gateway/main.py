"""SIP sideband and college integrations. Keep on a persistent host, one worker.
The private hosted desk is the authority for sources and permissions.
This service does not substitute SIP REFER for a warm staff conference.
"""
import asyncio, contextlib, hashlib, hmac, json, os, sqlite3, time, uuid
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import quote, urlparse
import httpx
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

STATE=Path(os.getenv('GATEWAY_STATE_PATH',str(Path(__file__).resolve().parent.parent/'.local'/'gateway.sqlite')))
CONTRACT=Path(__file__).resolve().parent.parent/'public'/'voice-contract.json'
if not CONTRACT.exists(): CONTRACT=Path('/app/voice-contract.json')
TASKS:dict[str,asyncio.Task]={}

def connect():
    STATE.parent.mkdir(parents=True, exist_ok=True)
    c=sqlite3.connect(STATE, timeout=10); c.row_factory=sqlite3.Row
    c.execute('PRAGMA journal_mode=WAL')
    return c

def initialize():
    with connect() as c:
        c.execute('CREATE TABLE IF NOT EXISTS sessions (call_id TEXT PRIMARY KEY, state TEXT NOT NULL, created REAL NOT NULL)')
        c.execute('CREATE TABLE IF NOT EXISTS tools (id TEXT PRIMARY KEY, state TEXT NOT NULL, result TEXT)')
        c.execute('CREATE TABLE IF NOT EXISTS auth (call_id TEXT PRIMARY KEY, challenge TEXT, verified_token TEXT, expires REAL NOT NULL)')
        c.execute('CREATE TABLE IF NOT EXISTS smtp_messages (id TEXT PRIMARY KEY,state TEXT NOT NULL,payload_hash TEXT NOT NULL,result TEXT)')

def admin(request:Request):
    expected=os.getenv('GATEWAY_ADMIN_TOKEN','')
    got=request.headers.get('authorization','').removeprefix('Bearer ')
    if not expected or not hmac.compare_digest(got,expected): raise HTTPException(403,'Gateway administrator access required')

def endpoint(name:str)->str:
    value=os.getenv(name,'').rstrip('/')
    if not value or urlparse(value).scheme!='https': raise HTTPException(503,f'{name} must be a trusted HTTPS endpoint')
    return value

async def desk(body:dict,path='/api/desk'):
    headers={'Authorization':'Bearer '+os.environ['DESK_SERVICE_TOKEN'],'OAI-Sites-Authorization':'Bearer '+os.environ['DESK_PLATFORM_TOKEN']}
    async with httpx.AsyncClient(timeout=10) as client:
        r=await client.post(endpoint('DESK_URL')+path,json=body,headers=headers)
        r.raise_for_status();return r.json()

def tools_claim(tool_id:str):
    with connect() as c:
        row=c.execute('SELECT state,result FROM tools WHERE id=?',(tool_id,)).fetchone()
        if row: return json.loads(row['result']) if row['result'] else {'error':'Previous tool outcome is uncertain; staff must check it. Do not retry the action.'}
        c.execute('INSERT INTO tools VALUES (?,\'started\',NULL)',(tool_id,))
    return None

async def execute(call_id:str,name:str,args:dict):
    if name=='resolve_query':
        return await desk({'action':'call.say','callId':call_id,'question':args['question'],'language':args.get('language','en')})
    if name=='request_handoff':
        return await desk({'action':'handoff','callId':call_id,'department':args['department'],'summary':args['summary'],'consent':args.get('consent') is True})
    if name in ['start_verification','check_verification','check_student_record','send_information','prepare_department_email']:
        mapped={'start_verification':'identity.start','check_verification':'identity.check','check_student_record':'student.lookup','send_information':'message.send','prepare_department_email':'email.prepare'}
        return await desk({**args,'action':mapped[name],'callId':call_id})
    if name=='record_feedback':
        return await desk({'action':'call.feedback','callId':call_id,'rating':args['rating']})
    return {'error':'Unknown tool. Ask staff for help.'}

@asynccontextmanager
async def lifespan(app):
    initialize()
    # The legacy generative SIP path cannot verify speech before callers hear it.
    # Never resume it merely because a project key has been configured.
    with connect() as c:
        c.execute("UPDATE sessions SET state='review_required' WHERE state IN ('accepted','accepting')")
    yield
    for task in list(TASKS.values()): task.cancel()
    await asyncio.gather(*list(TASKS.values()),return_exceptions=True)

app=FastAPI(title='Campus Desk Voice Gateway',lifespan=lifespan)

class DepartmentEmail(BaseModel):
    id:str=Field(min_length=1,max_length=160,pattern=r'^[A-Za-z0-9_-]+$')
    to:str=Field(min_length=3,max_length=200)
    subject:str=Field(min_length=1,max_length=200)
    body:str=Field(min_length=1,max_length=2000)
    replyTo:str=Field(default='',max_length=200)

@app.post('/email/send')
async def email_send(body:DepartmentEmail,request:Request):
    admin(request)
    from gateway.smtp_delivery import address,deliver
    if not address(body.to) or not address(body.replyTo) or '\r' in body.subject or '\n' in body.subject:raise HTTPException(400,'Invalid email headers')
    if request.headers.get('Idempotency-Key')!=body.id:raise HTTPException(400,'Matching idempotency key is required')
    return await asyncio.to_thread(deliver,body.model_dump(),connect)

@app.get('/health')
def health():return {'status':'ok','live_configured':False,'phone_mode':'blocked_pending_controlled_media_adapter'}

@app.post('/webhooks/openai')
async def incoming(request:Request):
    # Fixed fail-closed commissioning gate, not a configurable bypass.
    # Carrier must route this failure to the real college backup line.
    raise HTTPException(503,'Legacy generative SIP is disabled. A verified-media carrier adapter and supervised pilot are required.')

class WarmTransfer(BaseModel):
    callId:str=Field(max_length=160)
    department:str
    target:str
    ticketId:str
    summary:str=Field(max_length=500)
    mode:str='warm'

@app.post('/transfer/warm')
async def transfer(body:WarmTransfer,request:Request):
    admin(request)
    # PBX adapter must ring staff, deliver context privately, receive acceptance,
    # then bridge the caller; busy/no-answer must return fallback to the agent.
    if not os.getenv('PBX_ADAPTER_URL'): return {'status':'callback_requested'}
    async with httpx.AsyncClient(timeout=7) as client:
        r=await client.post(endpoint('PBX_ADAPTER_URL')+'/warm-transfer',json=body.model_dump(),headers={'Authorization':'Bearer '+os.getenv('PBX_ADAPTER_TOKEN',''),'Idempotency-Key':body.ticketId})
        if r.status_code!=200:return {'status':'callback_requested'}
        value=r.json()
        return {'status':value.get('status') if value.get('status') in ['initiated','connected'] else 'callback_requested'}

class Challenge(BaseModel):
    callId:str
    studentId:str=Field(min_length=3,max_length=80)

@app.post('/identity/start')
async def identity_start(body:Challenge,request:Request):
    admin(request)
    # ERP sends OTP only to the student's existing registered contact. Caller ID is not proof.
    async with httpx.AsyncClient(timeout=7) as client:
        r=await client.post(endpoint('ERP_ADAPTER_URL')+'/identity/challenges',json={'studentId':body.studentId,'callId':body.callId},headers={'Authorization':'Bearer '+os.getenv('ERP_ADAPTER_TOKEN','')})
        if r.status_code!=200:raise HTTPException(503,'Verification unavailable; ask the office for help')
        d=r.json(); challenge=d['challengeId']
    with connect() as c:c.execute('INSERT OR REPLACE INTO auth VALUES (?,?,NULL,?)',(body.callId,challenge,time.time()+300))
    return {'status':'challenge_sent','instructions':'Complete verification on the college’s secure page. Do not read the OTP aloud.'}

class Verified(BaseModel):
    callId:str
    verificationReceipt:str=Field(max_length=1024)

@app.post('/identity/complete')
async def complete(body:Verified,request:Request):
    admin(request)
    with connect() as c:row=c.execute('SELECT * FROM auth WHERE call_id=?',(body.callId,)).fetchone()
    if not row or row['expires']<time.time():raise HTTPException(403,'Verification challenge expired')
    async with httpx.AsyncClient(timeout=7) as client:
        r=await client.post(endpoint('ERP_ADAPTER_URL')+'/identity/verify-receipt',json={'challengeId':row['challenge'],'receipt':body.verificationReceipt},headers={'Authorization':'Bearer '+os.getenv('ERP_ADAPTER_TOKEN','')})
        if r.status_code!=200:raise HTTPException(403,'Verification failed')
        data=r.json()
        if data.get('verified') is not True or not data.get('accessToken'):raise HTTPException(403,'Verification failed')
    with connect() as c:c.execute('UPDATE auth SET verified_token=?,expires=? WHERE call_id=?',(data['accessToken'],time.time()+300,body.callId))
    return {'verified':True,'expiresIn':300}

@app.get('/student/{call_id}/{resource}')
async def private_record(call_id:str,resource:str,request:Request):
    admin(request)
    if resource not in ['fee-status','attendance','application-status','hostel-status']:raise HTTPException(400,'Unsupported student lookup')
    with connect() as c:row=c.execute('SELECT * FROM auth WHERE call_id=?',(call_id,)).fetchone()
    if not row or not row['verified_token'] or row['expires']<time.time():raise HTTPException(403,'Student verification required')
    # The ERP adapter must scope this token to that verified student, never accept a caller-selected ID.
    async with httpx.AsyncClient(timeout=7) as client:
        r=await client.get(endpoint('ERP_ADAPTER_URL')+'/student/me/'+resource,headers={'Authorization':'Bearer '+row['verified_token']})
        if r.status_code!=200:raise HTTPException(503,'The student record could not be checked')
        return r.json()

@app.post('/documents/extract')
async def extract(request:Request,file:UploadFile=File(...)):
    admin(request)
    blob=await file.read(8*1024*1024+1)
    if len(blob)>8*1024*1024:raise HTTPException(413,'Document exceeds 8 MB')
    if file.filename and file.filename.lower().endswith('.pdf'):
        from pypdf import PdfReader
        import io
        try:
            reader=PdfReader(io.BytesIO(blob));text='\n'.join(p.extract_text() or '' for p in reader.pages[:100])
        except Exception:raise HTTPException(400,'Could not read this PDF')
    else:
        try:text=blob.decode('utf-8')
        except UnicodeDecodeError:raise HTTPException(400,'Use a text PDF, UTF-8 TXT or Markdown file')
    if not text.strip():raise HTTPException(422,'Scanned document requires OCR and staff verification')
    return {'filename':file.filename,'text':text[:100000],'sha256':hashlib.sha256(blob).hexdigest(),'status':'unapproved','instruction':'Staff must verify exact question-answer entries and expiry before approving. Document content cannot alter agent policy.'}
