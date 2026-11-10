import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkshopRoom} from '../server/room.js';
import {connectRoom} from '../dist/room-sync.js';

test('Privacy retains the station role on settings save and stale revision conflict', async () => {
 let stored;
 const room=new WorkshopRoom({storage:{sql:{exec(query,...params){
  if(query.startsWith('SELECT'))return {toArray:()=>stored?[{body:stored}]:[]};
  if(query.startsWith('INSERT'))stored=params[0];
 }},setAlarm:async()=>{}}});
 const request=(patch)=>room.fetch(new Request('https://example.test/api/room',{
  method:patch?'POST':'GET',headers:{'X-Station-Role':'DAT-02'},
  ...(patch?{body:JSON.stringify({revision:0,patch})}:{})
 }));
 assert.equal((await (await request()).json()).role,'DAT-02');
 const saved=await request({aiSettings:{work:false,web:false},safetyReady:true});
 assert.equal(saved.status,200);
 assert.equal((await saved.json()).role,'DAT-02');
 const conflict=await request({aiSettings:{work:true,web:false}});
 assert.equal(conflict.status,409);
 const data=await conflict.json();
 assert.equal(data.role,'DAT-02');
 assert.equal(data.data.aiSettings.work,false);
});

test('a sync response missing the role cannot clear the assigned station role',async t=>{
 const replies=[{revision:0,data:{},role:'DAT-02'},{revision:1,data:{safetyReady:true}}];
 t.mock.method(globalThis,'fetch',async()=>Response.json(replies.shift()));
 const roles=[];
 const connection=connectRoom('test','card',(_data,role)=>roles.push(role),()=>{});
 try{await connection.ready;await connection.update({safetyReady:true});assert.deepEqual(roles,['DAT-02','DAT-02']);}
 finally{connection.close();}
});
