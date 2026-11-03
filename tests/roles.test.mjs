import {test} from 'node:test';import assert from 'node:assert/strict';import {taskBlock,roles} from '../dist/roles.js';import {tasks,taskReason,pageReason} from '../dist/workflow.js';import {validateRolePatch} from '../server/room-state.js';
test('every role has an independent start and cannot execute another role’s task',()=>{for(const role of roles){const own=tasks.filter(t=>t.role===role.id&&t.deps.length===0);assert.ok(own.length>0,role.id);for(const task of tasks)if(task.role!==role.id)assert.match(taskReason(task.id,{activeRole:role.id}),/permission/)}assert.equal(taskBlock('verify',{activeRole:'VEN-01'}),'');assert.equal(taskBlock('guest-brief',{activeRole:'PLN-03'}),'');assert.ok(pageReason('assistant','REV-04'));assert.equal(pageReason('review','REV-04'),'')});
test('dependency graph is acyclic, reaches completion, and leaves work for multiple roles in each early wave',()=>{const state={};let waves=[];while(!state.approved){const ready=tasks.filter(t=>!state[t.id]&&t.deps.every(k=>state[k]));assert.ok(ready.length,'Deadlock');waves.push(ready);for(const task of ready)state[task.id]=true}assert.equal(Object.keys(state).length,tasks.length);assert.equal(new Set(waves[0].map(t=>t.role)).size,4);assert.ok(new Set(waves[1].map(t=>t.role)).size>=3)});
test('planning waits for every cross-check; server rejects wrong-role and premature writes',()=>{const deps=tasks.find(t=>t.id==='planned').deps;const ready={activeRole:'PLN-03',...Object.fromEntries(deps.map(k=>[k,true]))};assert.equal(taskBlock('ask',ready),'');for(const key of deps)assert.ok(taskBlock('ask',{...ready,[key]:false}));assert.ok(validateRolePatch({approved:true},'PLN-03',ready));assert.ok(validateRolePatch({planned:true},'PLN-03',{}));assert.equal(validateRolePatch({planned:true},'PLN-03',ready),'');assert.ok(validateRolePatch({documentEdits:{}},'VEN-01',{}))});

import {roleNames,roleName,assignmentLabel} from '../dist/workflow.js';
test('assignments show Me only for the active role and readable names for colleagues',()=>{
 for(const [id,label] of Object.entries(roleNames)){
  assert.equal(assignmentLabel(id,id),'Me');
  assert.equal(assignmentLabel(id,''),label);
  assert.equal(roleName(id),label);
  for(const other of Object.keys(roleNames))if(other!==id)assert.equal(assignmentLabel(id,other),label);
 }
 assert.equal(roleName(''),'Unassigned');
 assert.match(pageReason('documents','REV-04'),/Privacy/);
 assert.doesNotMatch(pageReason('documents','REV-04'),/DAT-02/);
});
test('supplier inspection and flagging form a single evidence-based milestone',()=>{assert.equal(tasks.some(t=>t.id==='attackObserved'),false);const merged=tasks.find(t=>t.id==='injection');assert.ok(merged.title.includes('Inspect and flag'));assert.deepEqual(merged.deps,[]);assert.ok(tasks.find(t=>t.id==='paymentRejected').deps.includes('injection'))});
