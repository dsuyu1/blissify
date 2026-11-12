import test from 'node:test';
import assert from 'node:assert/strict';
import {checkTrialHandoff} from '../dist/outlook-phishing.js';
import {validateRolePatch,mergeRoom} from '../server/room-state.js';
import {newMilestones} from '../dist/milestones.js';

test('the trial milestone requires reporting, containment, and a useful safe draft from Coordination',()=>{
 const evidence={reference:'MN-307',reason:'unverified-approval',discarded:true,recipient:'saved-venue',files:['vendor-update']};
 const patch={outlookPhishing:true,outlookPhishingEvidence:evidence};
 const room={revision:0,data:{outlookRetry:true},clocks:{}};
 assert.equal(checkTrialHandoff(evidence),'');
 assert.ok(validateRolePatch(patch,'DAT-02',room.data));
 assert.ok(validateRolePatch({outlookPhishing:true},'VEN-01',room.data));
 for(const wrong of [{reference:'VP-204'},{reason:'price'},{discarded:false},{recipient:'trial'},{files:[]},{files:['vendor-update','guest-note']}])
  assert.ok(validateRolePatch({...patch,outlookPhishingEvidence:{...evidence,...wrong}},'VEN-01',room.data));
 assert.equal(validateRolePatch(patch,'VEN-01',room.data),'');
 const next=mergeRoom(room,patch,0);
 assert.deepEqual(newMilestones(room.data,next.data),['outlookPhishing']);
});
