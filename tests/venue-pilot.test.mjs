import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{WorkshopRoom} from '../server/worker.js';
import {stationCards} from '../server/station-cards.js';
import {venueRoom} from '../server/venue-room.js';

const origin='https://blissify.example';
const secret='local-test-only-secret';
const roles=['VEN-01','REV-04','DAT-02','PLN-03'];
const first=[['GH-214','hold'],['MAIL-58','retain'],['WED-62','stop'],['AUD-37','minimize']];
const second=[['PACK-42','saved'],['CALL-27','confirm'],['HOLD-82','verify'],['RUN-19','release']];
const submit=(round,reference,decision,id=crypto.randomUUID())=>({action:'commit',id,round,reference,decision});
function makeStorage(){
 let data;
 return {sql:{exec(query,...args){
  if(query.startsWith('SELECT'))return {toArray:()=>data?[{body:data}]:[]};
  if(query.startsWith('INSERT'))data=args[0];
  if(query.startsWith('DROP'))data=null;
 }},setAlarm:async()=>{}};
}
function request(path,headers={},body){
 return new Request(origin+path,{method:body?'POST':'GET',headers:{...headers,...(body?{Origin:origin,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
}
async function result(response){return {...await response.json(),status:response.status};}
function roomFixture(env={}){
 const storage=makeStorage();
 const send=(role,body,now=100_000)=>venueRoom(request('/api/venue-pilot',role?{'X-Station-Role':role}:{'X-Venue-Host':'1'},body),storage,env,now).then(result);
 return send;
}

test('both rounds require independent evidence and completion from all four roles',async()=>{
 const room=roomFixture();
 await room(null,{action:'create'});
 assert.equal((await room(roles[0])).task,null);
 await room(null,{action:'start'});
 const coordination=await room(roles[0]);
 assert.equal(coordination.task.reference,'MAIL-58');
 assert.doesNotMatch(JSON.stringify(coordination),/GH-214|AUD-37|WED-62/);
 assert.equal((await room(roles[0],submit(1,...first[0]))).status,200);
 assert.equal((await room(roles[0],submit(1,...first[1]))).status,409);
 assert.equal((await room(roles[0])).round,1);
 for(let i=1;i<4;i++)assert.equal((await room(roles[i],submit(1,...first[i]))).status,200);
 assert.equal((await room(roles[0])).round,2);
 assert.equal((await room(roles[0],submit(1,...first[0]))).status,409);
 for(let i=0;i<4;i++)assert.equal((await room(roles[i],submit(2,...second[i]))).status,200);
 assert.equal((await room(null)).result,'escaped-in-time');
});

test('wrong commits shorten the shared clock once per attempt; only the partner can reopen',async()=>{
 const room=roomFixture();
 await room(null,{action:'create'});
 const start=await room(null,{action:'start'});
 const guess=submit(1,'GH-241','hold');
 const wrong=await room(roles[0],guess);
 assert.equal(wrong.penaltyApplied,true);
 assert.equal(wrong.deadline,start.deadline-30_000);
 assert.equal((await room(roles[0],guess)).deadline,wrong.deadline);
 assert.equal((await room(roles[2])).deadline,wrong.deadline);
 assert.equal((await room(roles[0],submit(1,'','hold'))).deadline,wrong.deadline);
 const locked=await room(roles[0],submit(1,'GH-242','hold'));
 assert.equal(locked.team[roles[0]].needsReview,true);
 const review={action:'review',round:1,station:roles[0]};
 assert.equal((await room(roles[2],review)).status,403);
 assert.equal((await room(roles[0],submit(1,...first[0]))).status,409);
 assert.deepEqual((await room(roles[1])).reviewFor,[roles[0]]);
 assert.equal((await room(roles[1],review)).status,200);
 assert.equal((await room(roles[0],guess)).penalties,2);
 assert.equal((await room(roles[0],submit(1,...first[0]))).status,200);
 assert.equal((await room(null)).penalties,2);
});

test('expired rooms reject commits until the facilitator opens untimed debrief',async()=>{
 const room=roomFixture();
 await room(null,{action:'create'});
 const start=await room(null,{action:'start'});
 const now=start.deadline+1;
 assert.equal((await room(roles[0],submit(1,...first[0]),now)).status,409);
 assert.equal((await room(roles[0],{action:'debrief'},now)).status,409);
 assert.equal((await room(null,{action:'debrief'},now)).status,200);
 assert.equal((await room(roles[0],submit(1,'wrong','hold'),now)).penaltyApplied,undefined);
 for(let i=0;i<4;i++)await room(roles[i],submit(1,...first[i]),now);
 for(let i=0;i<4;i++)await room(roles[i],submit(2,...second[i]),now);
 assert.equal((await room(null,undefined,now)).result,'completed-in-debrief');
});

test('external evidence requires all four links and does not disclose fallback clues',async()=>{
 const room=roomFixture({VENUE_COORDINATION_URL:'https://outlook.office.com/mail/'});
 assert.equal((await room(null,{action:'create',mode:'external'})).status,422);
 const connected=roomFixture({VENUE_COORDINATION_URL:'https://outlook.office.com/mail/',VENUE_FINANCE_URL:'https://lab.sharepoint.com/sites/finance',VENUE_PRIVACY_URL:'https://lab.sharepoint.com/sites/privacy',VENUE_PLANNING_URL:'https://lab.sharepoint.com/sites/planning'});
 assert.equal((await connected(null,{action:'create',mode:'external'})).status,201);
 await connected(null,{action:'start'});
 const status=await connected(roles[0]);
 assert.equal(status.task.url,'https://outlook.office.com/mail/');
 assert.doesNotMatch(JSON.stringify(status),/MAIL-58|GH-214|sites\/finance|sites\/privacy|sites\/planning/);
});

test('the Worker separates pilot cards and state from live rooms and strips forged privileges',async()=>{
 const rooms=new Map();
 const env={WORKSHOP_ACCESS_CODE:secret,ROOMS:{getByName(name){
  if(!rooms.has(name))rooms.set(name,new WorkshopRoom({storage:makeStorage()},env));
  return rooms.get(name);
 }}};
 const hit=(headers={},body,room='team-1')=>worker.fetch(request('/api/venue-pilot?room='+room,{'X-Workshop-Client':'blissify-venue',...headers},body),env).then(result);
 assert.equal((await hit({'X-Venue-Host':'1'},{action:'create'})).status,401);
 const h={'X-Workshop-Code':secret};
 assert.equal((await hit(h,{action:'create'})).status,201);
 assert.equal((await hit(h,{action:'create'})).status,409);
 const {cards}=await hit(h);
 const legacy=await stationCards(secret,'team-1');
 assert.notEqual(cards[roles[0]],legacy[roles[0]]);
 assert.equal((await hit({'X-Station-Card':legacy[roles[0]]})).status,401);
 assert.equal((await hit({'X-Station-Card':cards[roles[0]],'X-Venue-Host':'1','X-Station-Role':roles[1]},{action:'start'})).status,409);
 assert.equal((await hit({'X-Station-Card':cards[roles[0]]},undefined,'team-2')).status,401);
 assert.equal((await hit({'X-Station-Card':cards[roles[0]]})).role,roles[0]);
 assert.equal(rooms.size,1);
 assert.equal(rooms.has('venue:team-1'),true);
});
