"""Validate human-reviewed acoustic measurements. Does not generate or invent evidence."""
import argparse,json,math
from collections import Counter
from pathlib import Path

GROUPS=('en','te','hi','te-en')
SCENARIOS=('fee','deadline','name','correction','interruption','unknown','private','outage','goodbye','noisy')
def percentile(values,p):
    ordered=sorted(values);return ordered[max(0,math.ceil(len(ordered)*p)-1)] if ordered else None
def evaluate(rows,min_per_group=20):
    errors=[];seen=set();counts=Counter();latencies=[];interruptions=[];scenarios=set()
    for i,r in enumerate(rows):
        label=f'row {i+1}'
        required=('id','call_id','language','scenario','source','reviewer','evidence_ref','consented','correct','critical_error','pronunciation_ok','stale_audio','useful_audio_ms')
        if any(k not in r for k in required):errors.append(label+': missing evidence fields');continue
        if not isinstance(r['id'],str) or not r['id'] or r['id'] in seen:errors.append(label+': duplicate/empty ID');continue
        seen.add(r['id'])
        if r['source']!='acoustic_live':errors.append(label+': simulations and UI scheduling estimates are not acoustic evidence')
        if r['language'] not in GROUPS:errors.append(label+': unsupported language group')
        for name in ('consented','correct','pronunciation_ok'):
            if r[name] is not True:errors.append(label+': '+name+' must be reviewed true')
        for name in ('critical_error','stale_audio'):
            if r[name] is not False:errors.append(label+': '+name+' must be reviewed false')
        for name in ('reviewer','evidence_ref','call_id'):
            if not isinstance(r[name],str) or not r[name].strip():errors.append(label+': '+name+' required')
        duration=r['useful_audio_ms']
        if type(duration) not in (int,float) or not math.isfinite(duration) or not 0<duration<=60000:errors.append(label+': invalid acoustic latency')
        else:latencies.append(duration)
        counts[r['language']]+=1;scenarios.add(r['scenario'])
        if r['scenario']=='interruption':
            delay=r.get('interrupt_stop_ms')
            if type(delay) not in (int,float) or not math.isfinite(delay) or not 0<=delay<=60000:errors.append(label+': interruption measurement required')
            else:interruptions.append(delay)
    by_group={}
    for group in GROUPS:
        calls={r.get('call_id') for r in rows if r.get('language')==group and r.get('call_id')}
        if len(calls)<min_per_group:errors.append(f'{group}: needs {min_per_group} distinct consented calls; found {len(calls)}')
        sample=[r for r in rows if r.get('language')==group]
        for scenario in SCENARIOS:
            if not any(r.get('scenario')==scenario for r in sample):errors.append(f'{group}: missing scenario {scenario}')
        durations=[r['useful_audio_ms'] for r in sample if type(r.get('useful_audio_ms')) in (int,float) and math.isfinite(r['useful_audio_ms']) and r['useful_audio_ms']>0]
        stops=[r['interrupt_stop_ms'] for r in sample if r.get('scenario')=='interruption' and type(r.get('interrupt_stop_ms')) in (int,float) and math.isfinite(r['interrupt_stop_ms']) and r['interrupt_stop_ms']>=0]
        by_group[group]={'calls':len(calls),'usefulAudioP95Ms':percentile(durations,.95),'interruptionP95Ms':percentile(stops,.95)}
        if not durations or percentile(durations,.95)>1800:errors.append(group+': p95 audio latency exceeds target or is missing')
        if not stops or percentile(stops,.95)>250:errors.append(group+': p95 interruption exceeds target or is missing')
    for scenario in SCENARIOS:
        if scenario not in scenarios:errors.append('Missing scenario: '+scenario)
    p95=percentile(latencies,.95);stop=percentile(interruptions,.95)
    if p95 is None or p95>1800:errors.append('p95 useful-audio latency exceeds 1800 ms or is missing')
    if stop is None or stop>250:errors.append('p95 interruption stop exceeds 250 ms or is missing')
    return {'passed':not errors,'scope':'Human-entered acoustic evidence; independently review before release. Not a production authorization.','rows':len(rows),'groups':dict(counts),'byLanguage':by_group,'usefulAudioP50Ms':percentile(latencies,.5),'usefulAudioP95Ms':p95,'interruptionP95Ms':stop,'errors':errors}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('measurements');parser.add_argument('--output',default='.local/voice-benchmark-report.json');args=parser.parse_args()
    rows=[json.loads(line) for line in Path(args.measurements).read_text(encoding='utf-8').splitlines() if line.strip()]
    result=evaluate(rows);out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2));raise SystemExit(0 if result['passed'] else 2)
