import {test} from 'node:test';import assert from 'node:assert/strict';import {checkReportReason,expectedReasons} from '../dist/reporting.js';
test('report categories match each suspicious request and reject mismatches',()=>{for(const [id,reasons] of Object.entries(expectedReasons)){for(const r of reasons)assert.equal(checkReportReason(id,r).ok,true);assert.equal(checkReportReason(id,'other').ok,false);assert.match(checkReportReason(id,'other').message,/not been saved/)}assert.equal(checkReportReason(6,'code').ok,false);assert.equal(checkReportReason(5,'data').ok,false);assert.equal(checkReportReason(3,'').ok,false)});
test('routine contacts allow uncertainty reports without falsely confirming a phishing category',()=>{for(const id of [1,2,4,7]){assert.equal(checkReportReason(id,'other').ok,true);assert.equal(checkReportReason(id,'payment').ok,false)}});

import {reportIsFinal} from '../dist/reporting.js';
import {validateRolePatch} from '../server/room-state.js';
test('accepted reports lock across shared stations while incorrect reasons remain editable',()=>{
 const accepted={reason:'payment',notes:'Changed account',reportedAt:'2026-11-03'};
 assert.equal(reportIsFinal(accepted,3),true);
 assert.equal(reportIsFinal({reason:'other'},3),false);
 assert.equal(reportIsFinal(undefined,3),false);
 assert.equal(validateRolePatch({reports:{3:{...accepted,reason:'identity'}}},'VEN-01',{reports:{3:accepted}}),'Submitted reports cannot be changed.');
 assert.equal(validateRolePatch({reports:{}},'VEN-01',{reports:{3:accepted}}),'Submitted reports cannot be changed.');
 assert.equal(validateRolePatch({reports:{3:accepted,5:{reason:'code'}}},'VEN-01',{reports:{3:accepted}}),'');
 assert.equal(validateRolePatch({reports:{3:accepted}},'VEN-01',{reports:{3:{reason:'other'}}}),'');
});

import {checkGoodMessage} from '../dist/reporting.js';
import {taskBlock} from '../dist/roles.js';
test('good confirmations accept routine messages, reject phishing and lock the final decision',()=>{
 for(const id of [1,2,4,7]){assert.equal(checkGoodMessage(id).ok,true);assert.equal(reportIsFinal({disposition:'good'},id),true)}
 for(const id of [3,5,6,8,99]){assert.equal(checkGoodMessage(id).ok,false);assert.equal(reportIsFinal({disposition:'good'},id),false)}
 assert.equal(reportIsFinal({reason:'other'},1),false);
 assert.equal(validateRolePatch({reports:{3:{disposition:'good'}}},'VEN-01',{}),'This message cannot be confirmed good.');
 assert.equal(validateRolePatch({reports:{1:{disposition:'good'}}},'VEN-01',{}),'');
 assert.equal(validateRolePatch({reports:{}},'VEN-01',{reports:{1:{disposition:'good'}}}),'Submitted reports cannot be changed.');
 assert.equal(taskBlock('mark-good',{activeRole:'VEN-01'}),'');
 assert.match(taskBlock('mark-good',{activeRole:'DAT-02'}),/permission/);
});
