import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{WorkshopRoom} from '../server/worker.js';
import {stationCards} from '../server/station-cards.js';
import {issuePhoneInvite,readPhoneInvite} from '../server/phone-invite.js';
import {visibleTasks} from '../dist/workflow.js';
import {newMilestones} from '../dist/milestones.js';
const secret='exercise-only-secret';

test('phone invite is signed for a single room and expires',async()=>{
 const now=1764000000000;
 const {token,expires}=await issuePhoneInvite(secret,'team-a',now);
 assert.equal(await readPhoneInvite(secret,token,now),'team-a');
 assert.equal(await readPhoneInvite(secret,token.replace('team-a','team-b'),now),null);
 assert.equal(await readPhoneInvite(secret,token,expires),null);
 assert.equal(await readPhoneInvite('other-exercise-secret',token,now),null);
});

test('Privacy QR opens a phone-only exercise, and a verified replay awards one shared point',async()=>{
 const origin='https://blissify.example',room='team-a',cards=await stationCards(secret,room);
 const rooms=new Map();
 const env={WORKSHOP_ACCESS_CODE:secret,ROOMS:{getByName(roomName){
  if(!rooms.has(roomName)){
   let data;
   const ctx={storage:{sql:{exec(sql,...args){if(sql.startsWith('SELECT'))return {toArray:()=>data?[{body:data}]:[]};if(sql.startsWith('INSERT'))data=args[0]}},setAlarm:async()=>{}}};
   const obj=new WorkshopRoom(ctx);
   rooms.set(roomName,{fetch:request=>obj.fetch(request)});
  }
  return rooms.get(roomName);
 }}};
 const hit=(path,headers,body,from=origin)=>worker.fetch(new Request(origin+path,{method:body?'POST':'GET',headers:{...headers,...(body?{Origin:from}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
 const station=(role)=>({'X-Workshop-Client':'blissify','X-Station-Card':cards[role]});
 const privacy=station('DAT-02'),invitePath='/api/phone-invite?room='+room,roomPath='/api/room?room='+room;
 assert.equal((await hit(invitePath,station('PLN-03'))).status,403);
 const bad={...privacy,'X-Station-Card':cards['DAT-02'].replace(/.$/,(c)=>c==='0'?'1':'0')};
 assert.equal((await hit(invitePath,bad)).status,401);
 const {token}=await (await hit(invitePath,privacy)).json();
 const headers={'X-Workshop-Client':'blissify-phone','X-Phone-Invite':token,'User-Agent':'iPhone'};
 const phone='/api/phone-audit';
 assert.equal((await hit(phone,{...headers,'User-Agent':'Desktop'})).status,403);
 assert.equal((await hit(phone,{...headers,'X-Phone-Invite':''})).status,401);
 assert.equal((await (await hit(phone,headers)).json()).scenario.name,'VowPilot');
 const good={event:'share',scope:'prepared',send:false,share:false};
 assert.equal((await hit(phone,headers,good,'https://other.example')).status,403);
 for(const wrong of [{event:'draft'},{scope:'all'},{scope:'none'},{send:true},{share:true}]){
  assert.equal((await hit(phone,headers,{...good,...wrong})).status,422);
 }
 assert.equal((await hit(roomPath,privacy,{revision:0,patch:{phoneAudit:true}})).status,400);
 const before=await (await hit(roomPath,privacy)).json();
 assert.equal(before.revision,0);
 assert.equal((await hit(phone,headers,good)).status,200);
 const after=await (await hit(roomPath,privacy)).json();
 assert.equal(after.data.phoneAudit,true);
 assert.equal(after.revision,1);
 assert.deepEqual(newMilestones(before.data,after.data),['phoneAudit']);
 assert.equal((await hit(phone,headers,good)).status,200);
 assert.equal((await (await hit(roomPath,privacy)).json()).revision,1);
 const second=await stationCards(secret,'team-b');
 assert.equal((await (await hit('/api/room?room=team-b',{'X-Workshop-Client':'blissify','X-Station-Card':second['DAT-02']})).json()).data.phoneAudit,undefined);
 assert.equal(visibleTasks({},true).some(x=>x.id==='phoneAudit'),true);
 assert.equal(visibleTasks({}).some(x=>x.id==='phoneAudit'),false);
});
