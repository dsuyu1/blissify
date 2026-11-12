import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.js';
import {adminSession,validAdminSession} from '../server/admin-rehearsal.js';
const secret='facilitator-test-secret', origin='https://workshop.example';

test('admin rehearsal requires facilitator authentication and allocates isolated rooms without touching live state',async()=>{
 const opened=[];
 const env={WORKSHOP_ACCESS_CODE:secret,ROOMS:{getByName(name){opened.push(name);return {fetch:request=>Response.json({role:request.headers.get('X-Station-Role')})}}}};
 const start=(headers={},from=origin)=>worker.fetch(new Request(origin+'/api/admin-rehearsal?room=live-team',{method:'POST',headers:{Origin:from,'X-Workshop-Client':'blissify',...headers}}),env);
 assert.equal((await start()).status,401);
 assert.equal((await start({'X-Workshop-Code':'wrong'})).status,401);
 assert.equal((await start({'X-Workshop-Code':secret},'https://other.example')).status,403);
 const login=await start({'X-Workshop-Code':secret});assert.equal(login.status,200);
 const first=await login.json();assert.match(first.room,/^test-[a-f0-9]{32}$/);
 assert.deepEqual(Object.keys(first.cards).sort(),['DAT-02','PLN-03','REV-04','VEN-01']);
 assert.equal((await start({'X-Station-Card':first.cards['DAT-02']})).status,401);
 const next=await (await start({'X-Admin-Rehearsal':first.token})).json();
 assert.notEqual(first.room,next.room);assert.equal(first.token,next.token);
 assert.notDeepEqual(first.cards,next.cards);
 assert.deepEqual(opened,[]);
 const check=async (room,role)=>worker.fetch(new Request(origin+'/api/room?room='+room,{headers:{'X-Workshop-Client':'blissify','X-Station-Card':first.cards[role]}}),env);
 for(const role of Object.keys(first.cards))assert.equal((await (await check(first.room,role)).json()).role,role);
 assert.equal((await check('live-team','DAT-02')).status,401);
 assert.ok(opened.every(name=>name===first.room));
});

test('admin renewal token expires and a tampered token is rejected',async()=>{
 const now=Date.now();
 const token=await adminSession(secret,now);
 assert.equal(await validAdminSession(secret,token,now),true);
 assert.equal(await validAdminSession(secret,token,now+8*3600*1000),false);
 assert.equal(await validAdminSession(secret,token.replace(/.$/,c=>c==='0'?'1':'0'),now),false);
});
