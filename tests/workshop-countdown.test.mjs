import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{WorkshopRoom} from '../server/worker.js';
import {stationCards} from '../server/station-cards.js';
import {countdownView,workshopDuration} from '../server/workshop-countdown.js';

test('only a valid station join starts one shared 50-minute timer, without penalties',async()=>{
 const origin='https://blissify.example',room='countdown-test',secret='test-facilitator-code',link='https://tenant.sharepoint.com/:w:/s/site/example';
 const cards=await stationCards(secret,room);
 let raw;const env={WORKSHOP_ACCESS_CODE:secret,SHAREPOINT_LAB_LINK:link};
 const obj=new WorkshopRoom({storage:{sql:{exec(query,...args){
  if(query.startsWith('SELECT'))return {toArray:()=>raw?[{body:raw}]:[]};
  if(query.startsWith('INSERT'))raw=args[0];
 }},setAlarm:async()=>{}}},env);
 env.ROOMS={getByName:()=>({fetch:r=>obj.fetch(r)})};
 const hit=async(path,role,body,join=false)=>{
  const r=await worker.fetch(new Request(origin+'/api/'+path+'?room='+room,{method:body?'POST':'GET',headers:{'X-Station-Card':cards[role]??'invalid','X-Workshop-Client':'blissify',...(join?{'X-Workshop-Join':'1'}:{}),...(body?{Origin:origin,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
  return {...await r.json(),http:r.status};
 };
 assert.equal((await hit('room','invalid',null,true)).http,401);
 assert.equal(raw,undefined);
 assert.equal((await hit('room','DAT-02')).timer,null);
 const [a,b]=await Promise.all(['DAT-02','VEN-01'].map(role=>hit('room',role,null,true)));
 assert.equal(a.timer.startedAt,b.timer.startedAt);
 assert.ok(a.timer.remaining>2_999_000&&a.timer.remaining<=3_000_000);
 assert.equal((await hit('sharepoint-proof','DAT-02',{link:link+'-wrong'})).http,422);
 assert.equal((await hit('room-penalty','VEN-01',{id:crypto.randomUUID(),action:'venue-reference'})).http,404);
 assert.equal((await hit('sharepoint-proof','DAT-02',{link})).completed,true);
 const progress=await hit('room','VEN-01');
 assert.equal(progress.data.sharepointCleanup,true);
 assert.equal(progress.timer.startedAt,a.timer.startedAt);
 const saved=await hit('room','VEN-01',{revision:progress.revision,patch:{verified:true}});
 assert.equal(saved.timer.startedAt,a.timer.startedAt);
 const previous=JSON.parse(raw);previous.data.approved=true;raw=JSON.stringify(previous);
 const final=await hit('room','VEN-01',{revision:saved.revision,patch:{supportReported:true,supportReport:{topic:'qa',reason:'confidential',provider:'unverified',action:'declined'}}});
 assert.equal(final.timer.status,'complete');
 assert.equal(final.timer.inTime,true);
 assert.equal((await hit('room','DAT-02',null,true)).timer.remaining,final.timer.remaining);
});

test('existing timed rooms use the original join time and ignore old deductions',()=>{
 const startedAt=100;
 assert.equal(countdownView({startedAt,deadline:startedAt+workshopDuration-30_000,penalties:1},startedAt).remaining,3_000_000);
 assert.equal(countdownView({startedAt},startedAt+workshopDuration).status,'expired');
 assert.equal(countdownView({startedAt,finishedAt:startedAt+workshopDuration+1}).inTime,false);
});
