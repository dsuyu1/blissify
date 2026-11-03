import {test} from 'node:test';import assert from 'node:assert/strict';
import {advanceLesson,canAcknowledge,acknowledgeLesson} from '../dist/lesson-gate.js';
test('hints require ten visible seconds and an explicit acknowledgment',()=>{
 let p={elapsed:0,acknowledged:false};
 for(let i=0;i<39;i++)p=advanceLesson(p,250,true);
 assert.equal(canAcknowledge(p),false);assert.equal(acknowledgeLesson(p).acknowledged,false);
 p=advanceLesson(p,250,false);assert.equal(p.elapsed,9750);
 p=advanceLesson(p,250,true);assert.equal(canAcknowledge(p),true);assert.equal(p.acknowledged,false);
 assert.equal(acknowledgeLesson(p).acknowledged,true);
});
test('hidden time and long background intervals cannot unlock hints',()=>{
 assert.equal(advanceLesson({elapsed:0},15000,false).elapsed,0);
 assert.equal(advanceLesson({elapsed:0},15000,true).elapsed,1000);
});
