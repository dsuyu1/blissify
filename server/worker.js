import {issuePhoneInvite,readPhoneInvite,isMobileAgent} from './phone-invite.js';
import {stationCards} from './station-cards.js';
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
 if(path==='/api/phone-audit'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.headers.get('X-Workshop-Client')!=='blissify-phone'||(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin))return json({error:'Open the puzzle from the workshop QR code.'},403);
  if(!isMobileAgent(request.headers.get('User-Agent')))return json({error:'Scan the QR code with a phone to use VowPilot.'},403);
  if(!env.ROOMS||!env.WORKSHOP_ACCESS_CODE||env.WORKSHOP_ACCESS_CODE.length<12)return json({error:'Phone puzzles require a connected workshop room.'},503);
  const room=await readPhoneInvite(env.WORKSHOP_ACCESS_CODE,request.headers.get('X-Phone-Invite')||'');
  if(!room)return json({error:'This QR invitation is missing or expired. Generate a fresh one from the Privacy station.'},401);
  return env.ROOMS.getByName(room).fetch(request);
 }
 if(path==='/api/room'||path==='/api/station-cards'||path==='/api/phone-invite'){
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
  const card=(request.headers.get('X-Station-Card')||'').trim().toUpperCase();
  if(!/^[A-Z]{3}-[0-9]{2}(?:-[0-9A-F]{5}){4}$/.test(card))return json({error:'Enter the sign-in code printed on your team ID card.'},401);
  const role=card.slice(0,6);
  const expected=(await stationCards(env.WORKSHOP_ACCESS_CODE,room))[role];
  if(!expected||!await matches(card,expected))return json({error:'That team ID card does not match this room.'},401);
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
