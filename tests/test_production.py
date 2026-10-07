import json
from scripts.production_readiness import report,KEYS
from scripts.voice_benchmark import evaluate

def test_readiness_never_echoes_keys_or_treats_presence_as_production(tmp_path,monkeypatch):
    for key in KEYS:monkeypatch.delenv(key,raising=False)
    (tmp_path/'.dev.vars').write_text('SARVAM_API_KEY=synthetic-secret-never-print\n')
    result=report(tmp_path)
    assert result['credentialPresence']['SARVAM_API_KEY'] is True
    assert 'synthetic-secret' not in json.dumps(result)
    assert result['productionReady'] is False

def test_empty_benchmark_cannot_pass():
    assert evaluate([])['passed'] is False

def rows():
    scenarios=['fee','deadline','name','correction','interruption','unknown','private','outage','goodbye','noisy']
    return [dict(id=f'{g}-{i}',call_id=f'{g}-call-{i}',language=g,scenario=scenarios[i%len(scenarios)],source='acoustic_live',reviewer='synthetic-reviewer',evidence_ref=f'local-test-fixture-{g}-{i}',consented=True,correct=True,critical_error=False,pronunciation_ok=True,stale_audio=False,useful_audio_ms=1200,interrupt_stop_ms=120) for g in ('en','te','hi','te-en') for i in range(20)]

def test_complete_fixture_passes_but_synthetic_label_or_critical_error_fails():
    data=rows();assert evaluate(data)['passed'] is True
    data[0]['source']='synthetic';assert evaluate(data)['passed'] is False
    data=rows();data[0]['critical_error']=True;assert evaluate(data)['passed'] is False

def test_reusing_one_call_does_not_satisfy_call_count():
    data=rows()
    for r in data:r['call_id']='one-call'
    assert evaluate(data)['passed'] is False

def test_slow_or_nan_evidence_fails():
    data=rows()
    for r in data:r['useful_audio_ms']=3000
    assert evaluate(data)['passed'] is False
    data=rows();data[0]['useful_audio_ms']=float('nan');assert evaluate(data)['passed'] is False
