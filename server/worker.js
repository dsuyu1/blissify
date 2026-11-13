import {adminSession,validAdminSession,rehearsalRoom} from './admin-rehearsal.js';
import {issuePhoneInvite,readPhoneInvite,isMobileAgent} from './phone-invite.js';
import {stationCards,stationRole} from './station-cards.js';
export { WorkshopRoom } from './room.js';

const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function matches(a,b){
 const enc=new TextEncoder();
 const [x,y]=await Promise.all([a,b].map(v=>crypto.subtle.digest('SHA-256',enc.encode(v))));
 const u=new Uint8Array(x),v=new Uint8Array(y);let difference=0;
 for(let i=0;i<u.length;i++)difference|=u[i]^v[i];
 return difference===0;
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==='/api/venue-pilot'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  const url=new URL(request.url);
  if(request.headers.get('X-Workshop-Client')!=='blissify-venue'||(request.method==='POST'&&request.headers.get('Origin')!==url.origin))return json({error:'Use the venue pilot website.'},403);
  const room=url.searchParams.get('room');
  if(!room||!/^[a-z0-9-]{3,24}$/.test(room))return json({error:'Enter a room ID with 3–24 letters, digits or dashes.'},400);
  const secret=env.WORKSHOP_ACCESS_CODE;
  if(!env.ROOMS||!secret||secret.length<12)return json({error:'The pilot needs a facilitator code and room binding.'},503);
  const roomKey='venue:'+room;
  const hostCode=request.headers.get('X-Workshop-Code')||'';
  const host=!!hostCode&&hostCode.length<=200&&await matches(hostCode,secret);
  const card=request.headers.get('X-Station-Card')||'';
  const role=host?null:await stationRole(secret,roomKey,card,matches);
  if(!host&&!role)return json({error:hostCode?'Incorrect facilitator code.':'That station card does not match this pilot room.'},401);
  const headers=new Headers(request.headers);
  for(const name of ['X-Workshop-Code','X-Station-Card','X-Venue-Host','X-Station-Role'])headers.delete(name);
  if(host)headers.set('X-Venue-Host','1');
  else headers.set('X-Station-Role',role);
  const response=await env.ROOMS.getByName(roomKey).fetch(new Request(request,{headers}));
  if(host&&response.ok&&request.method==='GET'){
   return json({...await response.json(),cards:await stationCards(secret,roomKey)});
  }
  return response;
 }
 if(path==='/api/admin-rehearsal'){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(request.headers.get('X-Workshop-Client')!=='blissify'||request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Use the workshop website'},403);
  const secret=env.WORKSHOP_ACCESS_CODE;
  if(!env.ROOMS||!secret||secret.length<12)return json({error:'Admin rehearsal needs the workshop access code and room binding.'},503);
  const code=request.headers.get('X-Workshop-Code')||'';
  let token=request.headers.get('X-Admin-Rehearsal')||'';
  if(token){
   if(token.length>120||!await validAdminSession(secret,token))return json({error:'Admin session expired. Sign in again.'},401);
  }else{
   if(!code||code.length>200||!await matches(code,secret))return json({error:'Incorrect facilitator code.'},401);
   token=await adminSession(secret);
  }
  return json(await rehearsalRoom(secret,token));
 }
 if(path==='/api/phone-audit'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.headers.get('X-Workshop-Client')!=='blissify-phone'||(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin))return json({error:'Open the puzzle from the workshop QR code.'},403);
  if(!isMobileAgent(request.headers.get('User-Agent')))return json({error:'Scan the QR code with a phone to use VowPilot.'},403);
  if(!env.ROOMS||!env.WORKSHOP_ACCESS_CODE||env.WORKSHOP_ACCESS_CODE.length<12)return json({error:'Phone puzzles require a connected workshop room.'},503);
  const room=await readPhoneInvite(env.WORKSHOP_ACCESS_CODE,request.headers.get('X-Phone-Invite')||'');
  if(!room)return json({error:'This QR invitation is missing or expired. Generate a fresh one from the Privacy station.'},401);
  return env.ROOMS.getByName(room).fetch(request);
 }
 if(path==='/api/room'||path==='/api/station-cards'||path==='/api/phone-invite'||path==='/api/sharepoint-proof'){
  if(path==='/api/sharepoint-proof'&&request.method!=='POST')return json({error:'Method not allowed'},405);
  const cardsRequested=path==='/api/station-cards',inviteRequested=path==='/api/phone-invite';
  if(!['GET','POST'].includes(request.method)||((cardsRequested||inviteRequested)&&request.method!=='GET'))return json({error:'Method not allowed'},405);
  if(request.headers.get('X-Workshop-Client')!=='blissify'||(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin))return json({error:'Use the workshop website'},403);
  if(!env.ROOMS||!env.WORKSHOP_ACCESS_CODE||env.WORKSHOP_ACCESS_CODE.length<12)return json({error:'Shared rooms need the WORKSHOP_ACCESS_CODE secret and room binding.'},503);
  const room=new URL(request.url).searchParams.get('room');
  if(!room||!/^[a-zA-Z0-9-]{1,40}$/.test(room))return json({error:'Invalid room'},400);
  if(cardsRequested){
   const code=request.headers.get('X-Workshop-Code')||'';
   if(code.length>200||!await matches(code,env.WORKSHOP_ACCESS_CODE))return json({error:'Incorrect facilitator code'},401);
   return json({cards:await stationCards(env.WORKSHOP_ACCESS_CODE,room)});
  }
  const card=request.headers.get('X-Station-Card')||'';
  if(!card.trim())return json({error:'Enter the station code printed on your team card.'},401);
  const role=await stationRole(env.WORKSHOP_ACCESS_CODE,room,card,matches);
  if(!role)return json({error:'That station code does not match this room.'},401);
  if(inviteRequested){
   if(role!=='DAT-02')return json({error:'Only the Privacy station can open this puzzle.'},403);
   return json(await issuePhoneInvite(env.WORKSHOP_ACCESS_CODE,room));
  }
  const headers=new Headers(request.headers);
  headers.delete('X-Station-Card');
  headers.set('X-Station-Role',role);
  return env.ROOMS.getByName(room).fetch(new Request(request,{headers}));
 }
 if(path.startsWith('/api/'))return json({error:'Not found.'},404);
 return env.ASSETS.fetch(request);
}};
