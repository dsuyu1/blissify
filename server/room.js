import {reconcileSecurityProgress} from '../dist/ai-security.js';
import {fraudReportsComplete} from '../dist/reporting.js';
import {mergeRoom,validateRolePatch} from './room-state.js';
export class WorkshopRoom {
 constructor(ctx){this.ctx=ctx;ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, body TEXT)');}
 async fetch(request){
 const headers={'Cache-Control':'no-store'};
 const load=()=>{const room=JSON.parse(this.ctx.storage.sql.exec('SELECT body FROM room WHERE id=1').toArray()[0]?.body||'{"revision":0,"data":{},"clocks":{}}');room.data=reconcileSecurityProgress(room.data);room.data.messagesReported=fraudReportsComplete(room.data.reports);return room;};
 if(request.method==='GET')return Response.json(load(),{headers});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 let text=await request.text();if(text.length>65000)return new Response('Request too large',{status:413});
 let body,next;try{body=JSON.parse(text);if(!Number.isInteger(body.revision)||body.revision<0)throw Error();const current=load();const denied=validateRolePatch(body.patch,body.role,current.data);if(denied)return Response.json({error:denied},{status:403});next=mergeRoom(current,body.patch,body.revision)}catch{return new Response('Invalid room update',{status:400})}
 if(!next)return Response.json(load(),{status:409,headers});
 this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(next));
 await this.ctx.storage.setAlarm(Date.now()+86400000);
 return Response.json(next,{headers});
 }
 async alarm(){this.ctx.storage.sql.exec('DELETE FROM room')}
}
