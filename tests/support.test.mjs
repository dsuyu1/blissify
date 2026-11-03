import {test} from 'node:test';import assert from 'node:assert/strict';
import {tasks,dependencyDepth,prerequisiteLabel} from '../dist/workflow.js';
import {validateRolePatch,mergeRoom} from '../server/room-state.js';
import {validSupportReport,reconcileSupportProgress} from '../dist/support-review.js';
test('website reporting follows approval, requires evidence, and belongs to Coordination',()=>{
const report={reason:'confidential',provider:'unverified',action:'declined'};
assert.equal(validSupportReport(report),true);assert.equal(validSupportReport({...report,provider:'trusted'}),false);
assert.ok(validateRolePatch({supportReported:true,supportReport:report},'VEN-01',{}));
assert.ok(validateRolePatch({supportReported:true,supportReport:report},'PLN-03',{approved:true}));
assert.ok(validateRolePatch({supportReported:true},'VEN-01',{approved:true}));
assert.equal(validateRolePatch({supportReported:true,supportReport:report},'VEN-01',{approved:true}),'');
const room=mergeRoom({revision:0,data:{approved:true},clocks:{}},{supportReported:true,supportReport:report},0);assert.equal(room.data.supportReported,true);
assert.equal(reconcileSupportProgress({...room.data,approved:false}).supportReported,false);
});
test('task order respects every dependency while prerequisite labels show actual counts',()=>{
for(const t of tasks)for(const d of t.deps){assert.ok(tasks.findIndex(x=>x.id===d)<tasks.indexOf(t));assert.ok(dependencyDepth(d)<dependencyDepth(t.id));}
assert.equal(prerequisiteLabel('injection'),'Independent start');assert.equal(prerequisiteLabel('planned'),'12 prerequisites');assert.equal(tasks.at(-1).id,'supportReported');
});
