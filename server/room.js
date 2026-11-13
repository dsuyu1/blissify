import {countdownView} from './workshop-countdown.js';
import {expectedSharePointLink,normalizeSharePointLink} from './sharepoint-proof.js';
import {reconcileSupportProgress} from '../dist/support-review.js';
import {reconcileContractProgress} from '../dist/contract.js';
import {reconcilePeerProgress} from '../dist/peer-review.js';
import {reconcileSecurityProgress} from '../dist/ai-security.js';
import {fraudReportsComplete} from '../dist/reporting.js';
import {auditScenario,checkPhoneAudit} from './phone-audit.js';
import {mergeRoom,validateRolePatch} from './room-state.js';
export class WorkshopRoom {
 constructor(ctx,env={}){this.ctx=ctx;this.env=env;ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY, body TEXT)');}
 async fetch(request){
 const headers={'Cache-Control':'no-store'};
 const role=request.headers.get('X-Station-Role');
 const url=new URL(request.url);
 const expected=expectedSharePointLink(url.searchParams.get('room'),this.env.SHAREPOINT_LAB_LINK);
 const responseRoom=room=>({...room,data:{...room.data,sharepointReady:!!expected},role,timer:countdownView(room.timer)});
 const load=()=>{const room=JSON.parse(this.ctx.storage.sql.exec('SELECT body FROM room WHERE id=1').toArray()[0]?.body||'{"revision":0,"data":{},"clocks":{}}');room.data=reconcileContractProgress(reconcilePeerProgress(reconcileSecurityProgress(room.data)));room.data=reconcileSupportProgress(room.data);room.data.messagesReported=fraudReportsComplete(room.data.reports);return room;};
 if(url.pathname==='/api/sharepoint-proof'){
  if(request.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405,headers});
  if(role!=='DAT-02')return Response.json({error:'Privacy completes the SharePoint puzzle.'},{status:403,headers});
  if(!expected)return Response.json({error:'The facilitator has not configured a SharePoint lab link yet.'},{status:503,headers});
  let submitted;
  try{
   const raw=await request.text();
   if(raw.length>8192)throw Error();
   submitted=normalizeSharePointLink(JSON.parse(raw)?.link);
  }catch{return Response.json({error:'Invalid link submission.'},{status:400,headers})}
  if(!submitted||submitted!==expected)return Response.json({error:'That is not the lab sharing link. Copy it from Manage access → Links, rather than the browser address bar.'},{status:422,headers});
  const current=load();
  if(!current.data.sharepointCleanup){
   const revision=current.revision+1;
   const next={...current,revision,data:{...current.data,sharepointCleanup:true},clocks:{...current.clocks,sharepointCleanup:revision}};
   this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(next));
   await this.ctx.storage.setAlarm(Date.now()+86400000);
  }
  return Response.json({completed:true},{headers});
 }
 if(url.pathname==='/api/phone-audit'){
  if(request.method==='GET')return Response.json({scenario:auditScenario,completed:!!load().data.phoneAudit},{headers});
  if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405,headers});
  if(Number(request.headers.get('Content-Length'))>2048)return Response.json({error:'Request too large'},{status:413,headers});
  let answer;try{const raw=await request.text();if(raw.length>2048)throw Error();answer=JSON.parse(raw)}catch{return Response.json({error:'Invalid puzzle response.'},{status:400,headers})}
  const current=load();
  if(current.data.phoneAudit)return Response.json({completed:true},{headers});
  const error=checkPhoneAudit(answer);
  if(error)return Response.json({error},{status:422,headers});
  const revision=current.revision+1;
  const next={...current,revision,data:{...current.data,phoneAudit:true},clocks:{...current.clocks,phoneAudit:revision}};
  this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(next));
  await this.ctx.storage.setAlarm(Date.now()+86400000);
  return Response.json({completed:true},{headers});
 }
 if(request.method==='GET'){
  const current=load();
  if(role&&!current.timer&&!current.data.supportReported&&request.headers.get('X-Workshop-Join')==='1'){
   current.timer={startedAt:Date.now()};
   this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(current));
   await this.ctx.storage.setAlarm(Date.now()+86400000);
  }
  return Response.json(responseRoom(current),{headers});
 }
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 let text=await request.text();if(text.length>65000)return new Response('Request too large',{status:413});
 let body,next;try{body=JSON.parse(text);if(!Number.isInteger(body.revision)||body.revision<0)throw Error();const current=load();const denied=validateRolePatch(body.patch,role,current.data);if(denied)return Response.json({error:denied},{status:403});next=mergeRoom(current,body.patch,body.revision);if(next&&current.timer){
  const {startedAt,finishedAt}=current.timer;
  next.timer={startedAt,finishedAt:finishedAt??(next.data.supportReported?Date.now():undefined)};
 }}catch{return new Response('Invalid room update',{status:400})}
 if(!next)return Response.json(responseRoom(load()),{status:409,headers});
 this.ctx.storage.sql.exec('INSERT OR REPLACE INTO room (id,body) VALUES (1,?)',JSON.stringify(next));
 await this.ctx.storage.setAlarm(Date.now()+86400000);
 return Response.json(responseRoom(next),{headers});
 }
 async alarm(){this.ctx.storage.sql.exec('DELETE FROM room')}
}
