import json
import pytest
from fastapi.testclient import TestClient
from gateway import main

@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(main,'STATE',tmp_path/'gateway.sqlite')
    monkeypatch.delenv('OPENAI_API_KEY',raising=False)
    monkeypatch.delenv('OPENAI_WEBHOOK_SECRET',raising=False)
    monkeypatch.setenv('GATEWAY_ADMIN_TOKEN','test-admin')
    with TestClient(main.app) as c:yield c

def test_no_credentials_no_call_accept(client):
    assert client.post('/webhooks/openai',json={}).status_code==503

def test_legacy_sip_stays_blocked_even_with_credentials(client,monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY','synthetic-not-a-real-key')
    monkeypatch.setenv('OPENAI_WEBHOOK_SECRET','synthetic-secret')
    r=client.post('/webhooks/openai',json={'type':'realtime.call.incoming'})
    assert r.status_code==503
    assert 'disabled' in r.json()['detail']
    assert client.get('/health').json()['live_configured'] is False
    assert not main.TASKS

def test_startup_does_not_resume_legacy_audio(tmp_path,monkeypatch):
    monkeypatch.setattr(main,'STATE',tmp_path/'gateway.sqlite')
    monkeypatch.setenv('OPENAI_API_KEY','synthetic-not-a-real-key')
    main.initialize()
    with main.connect() as db:db.execute("INSERT INTO sessions VALUES ('old-call','accepted',0)")
    with TestClient(main.app):
        assert not main.TASKS
        with main.connect() as db:assert db.execute("SELECT state FROM sessions WHERE call_id='old-call'").fetchone()['state']=='review_required'

def test_admin_routes_not_public(client):
    assert client.post('/identity/start',json={'callId':'x','studentId':'id123'}).status_code==403
    assert client.post('/transfer/warm',json={'callId':'x','department':'accounts','target':'tel:+919999999999','ticketId':'t','summary':'fee'}).status_code==403

def test_warm_adapter_falls_back_without_pbx(client,monkeypatch):
    monkeypatch.delenv('PBX_ADAPTER_URL',raising=False)
    r=client.post('/transfer/warm',headers={'Authorization':'Bearer test-admin'},json={'callId':'x','department':'accounts','target':'tel:+919999999999','ticketId':'t','summary':'fee'})
    assert r.json()['status']=='callback_requested'

def test_private_records_need_verified_token(client):
    r=client.get('/student/x/fee-status',headers={'Authorization':'Bearer test-admin'})
    assert r.status_code==403

def test_unsupported_private_resource(client):
    assert client.get('/student/x/all-students',headers={'Authorization':'Bearer test-admin'}).status_code==400

def test_durable_tool_claim_does_not_repeat_uncertain_side_effect(client):
    assert main.tools_claim('call:tool') is None
    assert 'uncertain' in main.tools_claim('call:tool')['error']
    with main.connect() as c:c.execute("UPDATE tools SET state='done',result=? WHERE id=?",(json.dumps({'status':'initiated'}),'call:tool'))
    assert main.tools_claim('call:tool')=={'status':'initiated'}

def test_document_is_unapproved(client):
    r=client.post('/documents/extract',headers={'Authorization':'Bearer test-admin'},files={'file':('notice.txt',b'Example unverified notice','text/plain')})
    assert r.status_code==200
    assert r.json()['status']=='unapproved'

def test_erp_url_requires_https(client,monkeypatch):
    monkeypatch.setenv('ERP_ADAPTER_URL','http://insecure.test')
    with pytest.raises(Exception):main.endpoint('ERP_ADAPTER_URL')


def test_email_requires_gateway_admin(client):
    assert client.post('/email/send',json={'id':'mail-1','to':'hod@example.com','subject':'Enquiry','body':'Please help'}).status_code==403

def mail(client,**change):
    data={'id':'mail-1','to':'hod@example.com','subject':'Enquiry','body':'Please help','replyTo':'caller@example.com'}
    data.update(change)
    return client.post('/email/send',json=data,headers={'Authorization':'Bearer test-admin','Idempotency-Key':data['id']})

def test_unconfigured_smtp_never_claims_sent(client,monkeypatch):
    monkeypatch.setenv('SMTP_ENABLED','false')
    assert mail(client).json()['status']=='not_configured'

def test_email_header_injection_is_rejected(client):
    assert mail(client,subject='Hello\nBcc: attacker@example.com').status_code==400
    assert mail(client,to='hod@example.com\r\nBcc: attacker@example.com').status_code==400

def smtp_fake(monkeypatch,fail=False):
    from gateway import smtp_delivery
    for key,value in {'SMTP_ENABLED':'true','SMTP_HOST':'smtp.gmail.com','SMTP_USERNAME':'sender@example.com','SMTP_PASSWORD':'synthetic-app-password','SMTP_ALLOWED_RECIPIENTS':'hod@example.com','SMTP_SECURITY':'ssl'}.items():monkeypatch.setenv(key,value)
    delivered=[]
    class FakeSMTP:
        def __init__(self,*args,**kwargs):pass
        def __enter__(self):return self
        def __exit__(self,*args):pass
        def ehlo(self):pass
        def login(self,*args):pass
        def send_message(self,msg):
            delivered.append(msg)
            if fail:raise TimeoutError('Synthetic disconnected DATA')
            return {}
    monkeypatch.setattr(smtp_delivery.smtplib,'SMTP_SSL',FakeSMTP)
    return delivered

def test_smtp_acceptance_is_durable_and_duplicate_safe(client,monkeypatch):
    delivered=smtp_fake(monkeypatch)
    assert mail(client).json()['status']=='sent'
    assert mail(client).json()['status']=='sent'
    assert len(delivered)==1
    assert delivered[0]['Reply-To']=='caller@example.com'
    assert mail(client,body='Changed body').json()['status']=='failed'
    assert len(delivered)==1

def test_ambiguous_smtp_submit_is_never_retried(client,monkeypatch):
    delivered=smtp_fake(monkeypatch,fail=True)
    assert mail(client).json()['status']=='uncertain'
    assert mail(client).json()['status']=='uncertain'
    assert len(delivered)==1

def test_recipient_allowlist_blocks_unverified_send(client,monkeypatch):
    delivered=smtp_fake(monkeypatch)
    assert mail(client,to='unknown@example.com').json()['status']=='failed'
    assert len(delivered)==0

def test_concurrent_smtp_claim_sends_once(client,monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    from gateway import smtp_delivery
    delivered=smtp_fake(monkeypatch)
    barrier=Barrier(2)
    payload={'id':'concurrent','to':'hod@example.com','subject':'Synthetic','body':'Test','replyTo':''}
    def send():
        barrier.wait()
        return smtp_delivery.deliver(payload,main.connect)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda _:send(),range(2)))
    assert len(delivered)==1
    assert all(r['status'] in ('sent','uncertain') for r in results)
    assert smtp_delivery.deliver(payload,main.connect)['status']=='sent'


def test_smtp_failed_attempt_is_not_retried(client,monkeypatch):
    from gateway import smtp_delivery
    delivered=smtp_fake(monkeypatch)
    def reject(*args):raise RuntimeError('Synthetic authentication failure')
    monkeypatch.setattr(smtp_delivery.smtplib.SMTP_SSL,'login',reject)
    assert mail(client).json()['status']=='failed'
    assert mail(client).json()['status']=='failed'
    assert len(delivered)==0
