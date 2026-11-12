import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{WorkshopRoom} from '../server/worker.js';
import {stationCards} from '../server/station-cards.js';
import {expectedSharePointLink,normalizeSharePointLink} from '../server/sharepoint-proof.js';
import {visibleTasks} from '../dist/workflow.js';
import {newMilestones} from '../dist/milestones.js';

test('the SharePoint proof checks the configured link and saves only the milestone',async()=>{
 const room='lab-team',rehearsal='test-'+'a'.repeat(32),origin='https://blissify.example';
 const link='https://contoso.sharepoint.com/:b:/s/WeddingLab/test-share?e=sample';
 const env={WORKSHOP_ACCESS_CODE:'test-workshop-code',SHAREPOINT_LAB_LINK:link};
 const records=new Map();
 env.ROOMS={getByName(name){
  if(!records.has(name)){
   let raw;
   const obj=new WorkshopRoom({storage:{sql:{exec(query,...args){
    if(query.startsWith('SELECT'))return {toArray:()=>raw?[{body:raw}]:[]};
    if(query.startsWith('INSERT'))raw=args[0];
   }},setAlarm:async()=>{}}},env);
   records.set(name,{fetch:request=>obj.fetch(request),stored:()=>raw});
  }
  return records.get(name);
 }};
 const hit=async (path,name,role,body,from=origin)=>{
  const cards=await stationCards(env.WORKSHOP_ACCESS_CODE,name);
  return worker.fetch(new Request(origin+'/api/'+path+'?room='+name,{
   method:body?'POST':'GET',headers:{'X-Workshop-Client':'blissify','X-Station-Card':cards[role],'Content-Type':'application/json',...(body?{Origin:from}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  }),env);
 };
 const before=await (await hit('room',room,'DAT-02')).json();
 assert.equal(before.data.sharepointReady,true);
 assert.equal(before.data.sharepointCleanup,undefined);
 assert.ok(visibleTasks(before.data,true).some(t=>t.id==='sharepointCleanup'));
 assert.equal((await hit('sharepoint-proof',room,'VEN-01',{link})).status,403);
 assert.equal((await hit('sharepoint-proof',room,'DAT-02',{link},'https://other.example')).status,403);
 assert.equal((await hit('sharepoint-proof',room,'DAT-02',{link:link.replace('sample','wrong')})).status,422);
 assert.equal((await hit('room',room,'DAT-02',{revision:0,patch:{sharepointCleanup:true}})).status,400);
 assert.equal((await hit('sharepoint-proof',room,'DAT-02',{link:' '+link+' '})).status,200);
 assert.equal((await hit('sharepoint-proof',room,'DAT-02',{link})).status,200);
 const after=await (await hit('room',room,'DAT-02')).json();
 assert.equal(after.revision,1);
 assert.deepEqual(newMilestones(before.data,after.data),['sharepointCleanup']);
 assert.ok(!records.get(room).stored().includes(link));
 delete env.SHAREPOINT_LAB_LINK;
 const fresh=await (await hit('room','unconfigured','DAT-02')).json();
 assert.equal(fresh.data.sharepointReady,false);
 assert.ok(!visibleTasks(fresh.data,true).some(t=>t.id==='sharepointCleanup'));
 assert.equal((await hit('sharepoint-proof','unconfigured','DAT-02',{link})).status,503);
 assert.equal((await hit('sharepoint-proof',rehearsal,'DAT-02',{link:expectedSharePointLink(rehearsal)})).status,200);
 assert.equal(normalizeSharePointLink('https://contoso.sharepoint.com.other.example/path'),null);
});

