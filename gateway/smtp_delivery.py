"""SMTP acceptance with durable idempotency. No automatic resend after ambiguity."""
import hashlib, json, os, re, smtplib, ssl
from email.message import EmailMessage
from email.utils import formatdate

def configured():
    return os.getenv('SMTP_ENABLED','false').lower()=='true' and all(os.getenv(k) for k in ['SMTP_HOST','SMTP_USERNAME','SMTP_PASSWORD','SMTP_ALLOWED_RECIPIENTS'])

def address(value):
    return not value or bool(re.fullmatch(r'[A-Za-z0-9.!#$%&\'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',value))

def deliver(payload, connect):
    if not configured(): return {'status':'not_configured'}
    allowed={x.strip().lower() for x in os.environ['SMTP_ALLOWED_RECIPIENTS'].split(',') if x.strip()}
    if payload['to'].lower() not in allowed: return {'status':'failed','detail':'Recipient is not on the administrator allowlist'}
    digest=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
    with connect() as c:
        # Serialize read + claim across threads/processes before any SMTP I/O.
        c.execute('BEGIN IMMEDIATE')
        row=c.execute('SELECT state,result,payload_hash FROM smtp_messages WHERE id=?',(payload['id'],)).fetchone()
        if row:
            if row['payload_hash']!=digest: return {'status':'failed','detail':'Message ID already belongs to different content'}
            return json.loads(row['result']) if row['result'] else {'status':'uncertain'}
        c.execute("INSERT INTO smtp_messages VALUES (?,'sending',?,NULL)",(payload['id'],digest))
    msg=EmailMessage();msg['From']=os.environ['SMTP_USERNAME'];msg['To']=payload['to'];msg['Subject']=payload['subject'];msg['Date']=formatdate(localtime=False)
    msg['Message-ID']='<'+hashlib.sha256(payload['id'].encode()).hexdigest()+'@campus-desk.invalid>'
    if payload.get('replyTo'):msg['Reply-To']=payload['replyTo']
    msg.set_content(payload['body'])
    outcome={'status':'failed'};data_started=False
    try:
        host=os.environ['SMTP_HOST'];mode=os.getenv('SMTP_SECURITY','ssl');port=int(os.getenv('SMTP_PORT','465' if mode=='ssl' else '587'))
        if mode not in ['ssl','starttls']: raise ValueError('TLS is mandatory')
        context=ssl.create_default_context()
        with (smtplib.SMTP_SSL(host,port,timeout=12,context=context) if mode=='ssl' else smtplib.SMTP(host,port,timeout=12)) as client:
            client.ehlo()
            if mode=='starttls':client.starttls(context=context);client.ehlo()
            client.login(os.environ['SMTP_USERNAME'],os.environ['SMTP_PASSWORD'])
            # Exceptions during DATA may mean the server accepted the email before disconnecting.
            data_started=True
            refused=client.send_message(msg)
            outcome={'status':'sent'} if not refused else {'status':'failed'}
    except Exception:
        outcome={'status':'uncertain' if data_started else 'failed'}
    with connect() as c:c.execute('UPDATE smtp_messages SET state=?,result=? WHERE id=?',(outcome['status'],json.dumps(outcome),payload['id']))
    return outcome
