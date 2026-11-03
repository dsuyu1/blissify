import {test} from 'node:test';import assert from 'node:assert/strict';
import {helpTemplates,workshopHelp} from '../dist/workshop-help.js';import {taskBlock} from '../dist/roles.js';
test('workshop guidance is available before planning without bypassing final calculations',()=>{
 const s={activeRole:'PLN-03'};assert.equal(taskBlock('chat-send',s),'');assert.ok(taskBlock('ask',s));assert.ok(taskBlock('chat-send',{activeRole:'DAT-02'}));
 assert.match(workshopHelp('What can I work on now?',s),/guest brief/);assert.match(workshopHelp('Give me a hint',s),/Acknowledge/);
 assert.equal(workshopHelp('Calculate the total wedding budget',s),null);assert.ok(helpTemplates.length>=6);
 for(const [, ,prompt] of helpTemplates)assert.ok(workshopHelp(prompt,s)===null||typeof workshopHelp(prompt,s)==='string');
});
