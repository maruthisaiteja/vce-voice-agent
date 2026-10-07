"""Offline release inventory. Reports presence only; never calls providers or reads secret values into output."""
import argparse,json,os,re
from datetime import datetime,timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
KEYS=('SARVAM_API_KEY','DESK_SERVICE_TOKEN','DESK_PLATFORM_TOKEN','GATEWAY_ADMIN_TOKEN','SMTP_PASSWORD','PBX_ADAPTER_TOKEN','ERP_ADAPTER_TOKEN')
def present(root):
    values={k:bool(os.environ.get(k)) for k in KEYS}
    for name in ('.dev.vars','.env.local','.env','gateway/.env'):
        p=root/name
        if not p.is_file():continue
        for line in p.read_text(encoding='utf-8').splitlines():
            m=re.match(r'^\s*([A-Z_]+)\s*=\s*(.*?)\s*$',line)
            if m and m[1] in values:
                v=m[2].strip('"\'')
                values[m[1]] |= bool(v and not v.lower().startswith(('your_','replace','example','sk-your','<')))
    return values

def report(root):
    credentials=present(root)
    checks=[]
    def add(key,status,detail):checks.append({'check':key,'status':status,'detail':detail})
    add('voice_credential','configured_unverified' if credentials['SARVAM_API_KEY'] else 'blocked','Presence only; billing, model access and working audio need a live test.')
    for filename in ('integration-result.json','worker-result.json'):
        p=root/'tests'/filename
        try:
            data=json.loads(p.read_text(encoding='utf-8'));passed=data.get('passed',0);total=data.get('total',0)
            add(filename,'recorded_pass' if total and passed==total else 'blocked',f'{passed}/{total}; historical local report, not proof for current source or live providers.')
        except (OSError,ValueError):add(filename,'blocked','No readable test report.')
    try:
        crawl=json.loads((root/'data'/'website-crawl.json').read_text(encoding='utf-8'))
        add('website_evidence','review_required',f"{len(crawl['documents'])} URLs; {crawl['pendingCount']} pending; all crawl material is unreviewed.")
    except (OSError,ValueError,KeyError):add('website_evidence','blocked','Crawl report unavailable.')
    evidence=root/'.local'/'voice-benchmark-report.json'
    try:
        bench=json.loads(evidence.read_text(encoding='utf-8'))
        # An offline report is an evidence record, never automatic commissioning permission.
        add('acoustic_benchmark','review_required' if bench.get('passed') else 'blocked','Inspect recorded real-call measurements and reviewer attribution; do not equate simulation with acoustic evidence.')
    except (OSError,ValueError):add('acoustic_benchmark','blocked','No benchmark evidence. Run the supervised English/Telugu/Hindi and mixed-language plan.')
    for name,detail in {
        'carrier_pilot':'Separate test number, carrier account, signed media adapter, codec and interruption tests required. Legacy SIP acceptance is disabled.',
        'staff_handoff':'Verify each destination and prove staff acceptance, caller bridge and unavailable-office fallback.',
        'access_and_hosting':'Provision staging HTTPS/WSS, production authentication, access roles, secret storage, server session quotas and monitoring.',
        'college_approvals':'College owners approve source text/translations, contacts, pilot scope, retention and deployment.',
        'operations':'Prove backup restore, rollback, failover to staff, outage alerts and incident ownership.',
        'private_records':'Keep unavailable unless a college-approved ERP adapter and identity/guardian authorization are tested.'
    }.items():add(name,'owner_evidence_required',detail)
    return {'generatedAt':datetime.now(timezone.utc).isoformat(),'productionReady':False,'scope':'Offline inventory only. No live connectivity or approvals inferred.','credentialPresence':credentials,'checks':checks,'nextStep':'Configure the voice key locally, restart the preview and run the supervised voice benchmark. Then commission a separate carrier test number.'}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',default='.local/production-readiness.json');args=p.parse_args()
    output=(ROOT/args.output).resolve();output.relative_to(ROOT)
    data=report(ROOT);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(data,indent=2));raise SystemExit(2 if not data['productionReady'] else 0)
