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
 if(path==='/api/room'){
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
  if(request.headers.get('X-Workshop-Client')!=='blissify'||(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin))return json({error:'Use the workshop website'},403);
  const code=request.headers.get('X-Workshop-Code')||'';
  if(!env.ROOMS||!env.WORKSHOP_ACCESS_CODE||env.WORKSHOP_ACCESS_CODE.length<12)return json({error:'Shared rooms need the WORKSHOP_ACCESS_CODE secret and room binding.'},503);
  if(code.length>200||!await matches(code,env.WORKSHOP_ACCESS_CODE))return json({error:'Incorrect workshop code'},401);
  const room=new URL(request.url).searchParams.get('room');if(!room||!/^[a-zA-Z0-9-]{1,40}$/.test(room))return json({error:'Invalid room'},400);
  return env.ROOMS.getByName(room).fetch(request);
 }
 if(path.startsWith('/api/'))return json({error:'Not found.'},404);
 return env.ASSETS.fetch(request);
}};
