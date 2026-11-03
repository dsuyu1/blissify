import {test} from 'node:test';import assert from 'node:assert/strict';import {planningContext,paymentDecision,supplierInstruction,attackExample} from '../dist/ai-security.js';import {preparePlanningInput} from '../dist/planning.js';import {documentFields} from '../dist/redaction.js';
test('recovery removes supplier instructions and preserves minimized pricing and arithmetic',()=>{const ids=documentFields.filter(f=>f.sensitive).map(f=>f.id);const {input}=preparePlanningInput({marked:ids,applied:ids},['summary','quote','requirements']);const before=planningContext(input,false),after=planningContext(input,true);assert.equal(before.supplierNote,supplierInstruction);assert.equal(after.supplierNote.includes('7719'),false);assert.deepEqual(before.documents,after.documents);assert.equal(after.calculator.total,15840);assert.equal(after.calculator.reserve,4160);for(const f of documentFields.filter(f=>f.sensitive))assert.equal(JSON.stringify(after).includes(f.value),false)});
test('payment lesson requires rejection plus independently verified account',()=>{assert.equal(attackExample.proposedAccount,'7719');assert.equal(paymentDecision('7719','reject'),false);assert.equal(paymentDecision('4821','approve'),false);assert.equal(paymentDecision('4821','reject'),true)});

import {reconcileSecurityProgress} from '../dist/ai-security.js';
test('legacy completion cannot show a flagged quote before source investigation',()=>{
 const stale={injection:true,attackObserved:false,planned:true,reviewed:true,approved:true,verified:true};
 const repaired=reconcileSecurityProgress(stale);
 assert.equal(repaired.injection,false);assert.equal(repaired.planned,false);assert.equal(repaired.reviewed,false);assert.equal(repaired.approved,false);assert.equal(repaired.verified,true);
 const valid={...stale,attackObserved:true};assert.deepEqual(reconcileSecurityProgress(valid),valid);
 assert.deepEqual(reconcileSecurityProgress(repaired),repaired);
});

import {inspectionCorrect} from '../dist/ai-security.js';
import {validateRolePatch} from '../server/room-state.js';
test('inspection awards the milestone only for the embedded instruction',()=>{
 for(const id of ['client','price','service','requirements',''])assert.equal(inspectionCorrect(id),false);
 assert.equal(inspectionCorrect('instruction'),true);
 assert.match(validateRolePatch({attackObserved:true},'PLN-03',{}),/Select/);
 assert.match(validateRolePatch({attackObserved:true,inspectionSelection:'price'},'PLN-03',{}),/Select/);
 assert.equal(validateRolePatch({attackObserved:true,inspectionSelection:'instruction'},'PLN-03',{}),'');
 assert.match(validateRolePatch({attackObserved:true,inspectionSelection:'instruction'},'REV-04',{}),/cannot/);
});
test('flagging requires selected evidence and a correct explanation',()=>{
 const current={attackObserved:true};
 assert.match(validateRolePatch({injection:true},'PLN-03',current),/explain/);
 assert.match(validateRolePatch({injection:true,flagSelection:'instruction',flagReason:'pricing'},'PLN-03',current),/explain/);
 assert.equal(validateRolePatch({injection:true,flagSelection:'instruction',flagReason:'override'},'PLN-03',current),'');
});
