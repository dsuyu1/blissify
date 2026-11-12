import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesRetryJob,replayRetry} from '../dist/outlook-retry.js';
import {validateRolePatch,mergeRoom} from '../server/room-state.js';
import {newMilestones} from '../dist/milestones.js';

test('the receipt locates the job and only a targeted stop preserves vendor reminders',()=>{
 assert.equal(matchesRetryJob(' vp-204 '),true);
 assert.equal(matchesRetryJob('VP-118'),false);
 assert.deepEqual(replayRetry({retryPaused:false,remindersPaused:false}),{retryBlocked:false,reminderRuns:true,ok:false});
 assert.equal(replayRetry({retryPaused:true,remindersPaused:true}).ok,false);
 assert.equal(replayRetry({retryPaused:true,remindersPaused:false}).ok,true);
});

test('only Coordination can award the milestone after the successful replay',()=>{
 const current={revision:0,data:{},clocks:{}};
 const evidence={job:'VP-204',observedRetry:true,retryPaused:true,remindersPaused:false};
 const patch={outlookRetry:true,outlookRetryEvidence:evidence};
 assert.ok(validateRolePatch(patch,'DAT-02',current.data));
 assert.ok(validateRolePatch({outlookRetry:true},'VEN-01',current.data));
 for(const wrong of [{job:'VP-118'},{observedRetry:false},{retryPaused:false},{remindersPaused:true}]){
  assert.ok(validateRolePatch({...patch,outlookRetryEvidence:{...evidence,...wrong}},'VEN-01',current.data));
 }
 assert.equal(validateRolePatch(patch,'VEN-01',current.data),'');
 const next=mergeRoom(current,patch,0);
 assert.deepEqual(newMilestones(current.data,next.data),['outlookRetry']);
 assert.deepEqual(newMilestones(next.data,mergeRoom(next,patch,1).data),[]);
});
