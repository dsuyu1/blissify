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

import {milestones,newMilestones} from '../dist/milestones.js';
import {remainingPrerequisites,prerequisiteProgress} from '../dist/planner.js';
test('remaining prerequisites decrease on completion and reach ready at zero',()=>{
 const task=tasks.find(t=>t.id==='planned'),state={};assert.equal(remainingPrerequisites(task.id,state),task.deps.length);
 task.deps.forEach((id,i)=>{state[id]=true;assert.equal(remainingPrerequisites(task.id,state),task.deps.length-i-1)});
 assert.equal(prerequisiteProgress(task.id,state),'0 remaining');assert.equal(prerequisiteProgress('injection',{}),'Independent start');
});
test('valid website report persists, earns exactly one milestone, and retry adds no score',()=>{
 const before={approved:true};const report={reason:'confidential',provider:'unverified',action:'declined'};
 const patch={supportReported:true,supportReport:report,competitorDecision:'reported'};
 assert.equal(validateRolePatch(patch,'VEN-01',before),'');
 const saved=mergeRoom({revision:0,data:before,clocks:{}},patch,0);
 const loaded=reconcileSupportProgress(JSON.parse(JSON.stringify(saved.data)));
 assert.equal(loaded.supportReported,true);assert.ok(milestones.supportReported);
 const score=s=>Object.keys(milestones).filter(k=>s[k]).length;
 assert.equal(score(loaded),score(before)+1);assert.deepEqual(newMilestones(before,loaded),['supportReported']);
 const retried=mergeRoom(saved,patch,saved.revision).data;assert.equal(score(retried),score(loaded));assert.deepEqual(newMilestones(loaded,retried),[]);
 assert.ok(validateRolePatch({...patch,supportReport:{...report,reason:'design'}},'VEN-01',before));
});

import {chatbotTopics} from '../dist/support-review.js';
test('every concierge option exposes a confidential-data request and can earn the report milestone',()=>{
 for(const topic of Object.keys(chatbotTopics)){
  assert.match(chatbotTopics[topic].request,/unredacted|original/);
  const report={topic,reason:'confidential',provider:'unverified',action:'declined'};
  assert.equal(validSupportReport(report),true);
  assert.equal(validateRolePatch({supportReport:report,supportReported:true},'VEN-01',{approved:true}),'');
 }
 assert.equal(validSupportReport({topic:'unknown',reason:'confidential',provider:'unverified',action:'declined'}),false);
});
