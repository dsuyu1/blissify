import {reconcileSupportProgress} from '../dist/support-review.js';
import {reconcileContractProgress} from '../dist/contract.js';
import {reconcilePeerProgress} from '../dist/peer-review.js';
import {reconcileSecurityProgress} from '../dist/ai-security.js';
import {fraudReportsComplete} from '../dist/reporting.js';
import {auditScenario,checkPhoneAudit} from './phone-audit.js';
import {mergeRoom,validateRolePatch} from './room-state.js';
export class WorkshopRoom {
 constructor(ctx){this.ctx=ctx;ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, body TEXT)');}
 async fetch(request){
 const headers={'Cache-Control':'no-store'};
 const role=request.headers.get('X-Station-Role');
 const load=()=>{const room=JSON.parse(this.ctx.storage.sql.exec('SELECT body FROM room WHERE id=1').toArray()[0]?.body||'{"revision":0,"data":{},"clocks":{}}');room.data=reconcileContractProgress(reconcilePeerProgress(reconcileSecurityProgress(room.data)));room.data=reconcileSupportProgress(room.data);room.data.messagesReported=fraudReportsComplete(room.data.reports);return room;};
 if(new URL(request.url).pathname==='/api/phone-audit'){
  if(request.method==='GET')return Response.json({scenario:auditScenario,completed:!!load().data.phoneAudit},{headers});
  if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers});
  if(Number(request.headers.get('Content-Length'))>2048)return Response.json({error:'Request too large'},{status:413,headers});
  let answer;try{const raw=await request.text();if(raw.length>2048)throw Error();answer=JSON.parse(raw)}catch{return Response.json({error:'Invalid puzzle response.'},{status:400,headers})}
  const current=load();
  if(current.data.phoneAudit)return Response.json({completed:true},{headers});
  const error=checkPhoneAudit(answer);
  if(error)return Response.json({error},{status:422,headers});
  const revision=current.revision+1;
  const next={revision,data:{...current.data,phoneAudit:true},clocks:{...current.clocks,phoneAudit:revision}};
  this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(next));
  await this.ctx.storage.setAlarm(Date.now()+86400000);
  return Response.json({completed:true},{headers});
 }
 if(request.method==='GET')return Response.json({...load(),role},{headers});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 let text=await request.text();if(text.length>65000)return new Response('Request too large',{status:413});
 let body,next;try{body=JSON.parse(text);if(!Number.isInteger(body.revision)||body.revision<0)throw Error();const current=load();const denied=validateRolePatch(body.patch,role,current.data);if(denied)return Response.json({error:denied},{status:403});next=mergeRoom(current,body.patch,body.revision)}catch{return new Response('Invalid room update',{status:400})}
 if(!next)return Response.json({...load(),role},{status:409,headers});
 this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(next));
 await this.ctx.storage.setAlarm(Date.now()+86400000);
 return Response.json({...next,role},{headers});
 }
 async alarm(){this.ctx.storage.sql.exec('DELETE FROM room')}
}
