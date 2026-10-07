import test from 'node:test';
import assert from 'node:assert/strict';
import {EndOfTurn,VoiceTurn} from '../lib/voice-turn.ts';

test('silence produces no question and expires after ten seconds',()=>{
 const v=new EndOfTurn(0);assert.equal(v.sample(0,9000),null);assert.equal(v.sample(0,10000),'empty');
});
test('brief click cannot authorize a speech turn',()=>{
 const v=new EndOfTurn(0);v.sample(0.5,50);assert.equal(v.sample(0,2000),null);assert.equal(v.sample(0,10000),'empty');
});
test('speech finishes only after the full silence window',()=>{
 const v=new EndOfTurn(0);for(let t=50;t<=500;t+=50)assert.equal(v.sample(0.03,t),null);
 assert.equal(v.sample(0,1500),null);assert.equal(v.sample(0,1600),'finish');
});
test('speech resuming in the pause resets the silence deadline',()=>{
 const v=new EndOfTurn(0);for(let t=50;t<=500;t+=50)v.sample(0.03,t);
 v.sample(0,1200);v.sample(0.03,1400);assert.equal(v.sample(0,2000),null);assert.equal(v.sample(0,2500),'finish');
});
test('continuous energy cannot exceed thirty seconds',()=>{
 const v=new EndOfTurn(0);for(let t=100;t<30000;t+=100)assert.equal(v.sample(0.03,t),null);assert.equal(v.sample(0.03,30000),'finish');
});
test('interrupt aborts pending requests and rejects their late results',async()=>{
 const turns=new VoiceTurn(),first=turns.begin();let deliver;
 const delayed=new Promise(resolve=>deliver=resolve);const result=delayed.then(()=>turns.current(first.id));
 const second=turns.begin();assert.equal(first.signal.aborted,true);deliver();assert.equal(await result,false);assert.equal(turns.current(second.id),true);
 turns.cancel();assert.equal(second.signal.aborted,true);assert.equal(turns.current(second.id),false);
});
