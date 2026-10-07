import test from 'node:test';
import assert from 'node:assert/strict';
import {TranscriptTurns,PCMDecoder,confirmationChoice,needsConfirmation} from '../lib/live-voice.ts';

test('a late transcription cannot answer over the next caller turn',()=>{
 const t=new TranscriptTurns(),first=t.begin();t.commit(first);t.acknowledged('first');
 const next=t.begin();t.commit(next);t.acknowledged('next');
 assert.equal(t.complete('next'),true);assert.equal(t.complete('first'),false);assert.equal(t.complete('next'),false);
});
test('commit acknowledgements arriving after an interrupt remain associated with their original turn',()=>{
 const t=new TranscriptTurns();t.commit(t.begin());const next=t.begin();t.commit(next);
 t.acknowledged('old');t.acknowledged('current');assert.equal(t.complete('old'),false);assert.equal(t.complete('current'),true);
});
test('unexpected transcription IDs and closed session results are ignored',()=>{
 const t=new TranscriptTurns();assert.equal(t.complete('unknown'),false);t.commit(t.begin());t.acknowledged('old');t.reset();assert.equal(t.complete('old'),false);
});
test('PCM decoder preserves signed samples split across network chunks',()=>{
 const d=new PCMDecoder();assert.deepEqual([...d.decode(new Uint8Array([0]))],[]);
 assert.deepEqual([...d.decode(new Uint8Array([128,255,127,0]))],[-1,32767/32768]);
 assert.deepEqual([...d.decode(new Uint8Array([0]))],[0]);d.finish();
});
test('truncated PCM is not treated as successful playback',()=>{const d=new PCMDecoder();d.decode(new Uint8Array([0]));assert.throws(()=>d.finish());});
test('spoken confirmation handles explicit multilingual yes/no without treating corrections as consent',()=>{
 for(const s of ['Yes.','అవును','हाँ'])assert.equal(confirmationChoice(s),'yes');
 for(const s of ['No!','కాదు','नहीं'])assert.equal(confirmationChoice(s),'no');
 assert.equal(confirmationChoice('Yes, but change the amount'),null);assert.equal(needsConfirmation('Is it 140000?'),true);assert.equal(needsConfirmation('Who is the CSE HOD?'),false);
});
