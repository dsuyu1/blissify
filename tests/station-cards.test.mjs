import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker, {WorkshopRoom} from '../server/worker.js';
import {visibleTasks} from '../dist/workflow.js';
import {guideTask} from '../dist/guide-content.js';
import {workshopHelp} from '../dist/workshop-help.js';

const origin='https://workshop.example';
const secret='test-facilitator-secret';

test('facilitator issues one card per role and the room enforces the card role',async()=>{
 let stored=null;
 const room=new WorkshopRoom({storage:{
  sql:{exec(sql,...values){
   if(sql.startsWith('INSERT'))stored=values[0];
   return {toArray:()=>stored?[{body:stored}]:[]};
  }},
  async setAlarm(){}
 }});
 const env={WORKSHOP_ACCESS_CODE:secret,ROOMS:{getByName:()=>room}};
 const request=(path,headers={},body)=>worker.fetch(new Request(origin+path,{
  method:body?'POST':'GET',headers:{Origin:origin,'X-Workshop-Client':'blissify',...headers},
  ...(body?{body:JSON.stringify(body)}:{})
 }),env);
 const access={'X-Workshop-Code':secret};
 const {cards}=await (await request('/api/station-cards?room=demo',access)).json();
 assert.equal(new Set(Object.values(cards)).size,4);
 assert.ok(Object.values(cards).every(code=>/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/.test(code)));
 const short=cards['DAT-02'].replace('-',' ').toLowerCase();
 assert.equal((await (await request('/api/room?room=demo',{'X-Station-Card':short})).json()).role,'DAT-02');
 const enc=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sig=new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(JSON.stringify(['blissify-station-v1','demo','REV-04']))));
 const legacy='REV-04-'+Buffer.from(sig.slice(0,10)).toString('hex').toUpperCase().match(/.{5}/g).join('-');
 assert.equal((await (await request('/api/room?room=demo',{'X-Station-Card':legacy})).json()).role,'REV-04');
 assert.equal((await request('/api/station-cards?room=demo',{'X-Station-Card':cards['PLN-03']})).status,401);
 assert.equal((await request('/api/room?room=demo',access)).status,401);
 const planning={'X-Station-Card':cards['PLN-03'],'X-Station-Role':'REV-04'};
 assert.equal((await request('/api/room?room=other',planning)).status,401);
 assert.equal((await (await request('/api/room?room=demo',planning)).json()).role,'PLN-03');
 assert.equal((await request('/api/room?room=demo',planning,{role:'VEN-01',revision:0,patch:{verified:true}})).status,403);
 const response=await request('/api/room?room=demo',planning,{revision:0,patch:{guestBrief:true}});
 assert.equal(response.status,200);
 assert.equal((await response.json()).data.guestBrief,true);
});

test('the hidden report stays out of ordinary task lists and guidance until completion',()=>{
 const state={activeRole:'VEN-01',approved:true};
 assert.ok(!visibleTasks(state).some(t=>t.id==='supportReported'));
 assert.notEqual(guideTask('inbox',state,'supportReported').id,'supportReported');
 assert.doesNotMatch(workshopHelp('Explain my role',state),/chatbot/i);
 assert.ok(visibleTasks({...state,supportReported:true}).some(t=>t.id==='supportReported'));
});
