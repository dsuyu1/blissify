import {roles,rounds} from './venue-cases.js';

const retention = 86_400_000;
const penalty = 30_000;
const retryLimit = 2;
const normalize = value => String(value ?? '').trim().toUpperCase();
const json = (data,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const stateOf = (data,now) => data.finishedAt ? 'secured' : data.debriefAt ? 'debrief' : !data.startedAt ? 'lobby' : data.deadline <= now ? 'expired' : 'running';
const progress = data => Object.fromEntries(Object.keys(roles).map(role=>[role,{
 done:!!data.done[role], needsReview:!!data.locks[role]
}]));

function roleSource(env,role){
 const key = {'VEN-01':'COORDINATION','REV-04':'FINANCE','DAT-02':'PRIVACY','PLN-03':'PLANNING'}[role];
 const raw = env['VENUE_'+key+'_URL'];
 try {
  const url=new URL(raw);
  if(url.protocol==='https:' && !url.username && !url.password &&
    (url.hostname.endsWith('.sharepoint.com') || ['outlook.office.com','outlook.office365.com','teams.microsoft.com'].includes(url.hostname)))return url.href;
 } catch {}
 return null;
}

function view(data,role,now,env){
 const round = rounds[data.round];
 const status = stateOf(data,now);
 const task = round?.tasks[role];
 const active = status==='running'||status==='debrief';
 const usesExternal=data.external&&data.round===0;
 const url=usesExternal&&task?roleSource(env,role):null;
 const taskView=task && active ? {
  source:task.source,title:task.title,reference:usesExternal?null:task.reference,detail:usesExternal?(url?'Use the linked record to find your station’s evidence. Share the relevant reference and finding with your teammates.':'Your evidence link is unavailable. Let the facilitator know.'):task.detail,
  field:task.field,choices:task.choices,partner:task.partner,url
 } : null;
 return {
  status,serverNow:now,deadline:data.deadline,startedAt:data.startedAt,finishedAt:data.finishedAt,
  penalties:data.penalties,round:data.round+1,title:round?.title??'Venue secured',
  team:progress(data),role,task:taskView,
  reviewFor:active&&role ? Object.entries(data.locks).filter(([_,reviewer])=>reviewer===role).map(([station])=>station) : [],
  result:data.finishedAt?(data.debriefAt?'completed-in-debrief':'escaped-in-time'):status==='expired'?'time-expired':null
 };
}

export async function venueRoom(request,storage,env,testNow){
 const role=request.headers.get('X-Station-Role');
 const host=request.headers.get('X-Venue-Host')==='1';
 if(!host&&!Object.hasOwn(roles,role))return json({error:'A station card is required.'},401);
 let input;
 if(request.method==='POST'){
  try {
   const reader=request.body?.getReader();
   if(!reader)throw Error();
   let size=0;const decoder=new TextDecoder();let raw='';
   while(true){
    const {value,done}=await reader.read();if(done)break;
    size+=value.byteLength;if(size>2048){await reader.cancel();return json({error:'Submission is too large.'},413);}
    raw+=decoder.decode(value,{stream:true});
   }
   input=JSON.parse(raw+decoder.decode());if(!input||typeof input!=='object'||Array.isArray(input))throw Error();
  } catch { return json({error:'Invalid submission.'},400); }
 }
 const now=testNow??Date.now();
 // Read and write synchronously after parsing so submissions cannot interleave.
 const raw=storage.sql.exec('SELECT body FROM venue_pilot WHERE id=1').toArray()[0]?.body;
 let data=raw?JSON.parse(raw):null;
 const reply=(error,status=200,penaltyApplied=false)=>json({...(data?view(data,host?null:role,now,env):{}),...(error?{error}:{}),...(penaltyApplied?{penaltyApplied:true}:{})},status);
 const persist=()=>{
  storage.sql.exec('INSERT OR REPLACE INTO venue_pilot (id,body) VALUES (1,?)',JSON.stringify(data));
  return storage.setAlarm(now+retention);
 };
 if(input?.action==='create'){
  if(!host)return reply('Only the facilitator can create a room.',403);
  if(data)return reply('This room already exists. Use a fresh ID for a clean playtest.',409);
  const external=input.mode==='external';
  if(external&&Object.keys(roles).some(r=>!roleSource(env,r)))return reply('Configure all four evidence links before enabling Microsoft 365 mode.',422);
  data={minutes:input.minutes===40?40:12,external,startedAt:null,deadline:null,debriefAt:null,finishedAt:null,round:0,penalties:0,done:{},misses:{},locks:{},last:{}};
  await persist();
  return reply(null,201);
 }
 if(!data)return reply('The facilitator hasn’t created this pilot room yet.',404);
 if(request.method==='GET')return reply();
 const status=stateOf(data,now);
 if(host){
  if(input.action==='start'&&status==='lobby'){
   data.startedAt=now;data.deadline=now+data.minutes*60_000;
  }else if(input.action==='debrief'&&status==='expired'){
   data.debriefAt=now;
  }else return reply('That facilitator action is not available right now.',409);
  await persist();
  return reply();
 }
 const prior=input.action==='commit'&&data.last[role]?.find(item=>item.id===input.id&&item.round===input.round);
 if(prior){
  return reply(prior.error,prior.error?422:200,prior.penaltyApplied);
 }
 if(status!=='running'&&status!=='debrief')return reply('This room is not accepting decisions right now.',409);
 if(input.round!==data.round+1)return reply('The team has moved to a different round.',409);
 if(input.action==='review'){
  if(!Object.hasOwn(roles,input.station)||data.locks[input.station]!==role)return reply('Only the assigned evidence partner can reopen this submission.',403);
  delete data.locks[input.station];delete data.misses[input.station];
  await persist();return reply();
 }
 if(input.action!=='commit'||typeof input.id!=='string'||!/^[a-f0-9-]{36}$/i.test(input.id))return reply('Invalid decision submission.',400);
 if(data.done[role])return reply('Your evidence is already verified.',409);
 if(data.locks[role])return reply('Ask your evidence partner to reopen this decision.',409);
 const task=rounds[data.round].tasks[role];
 const answer=typeof input.reference==='string'?normalize(input.reference):'';
 if(!/^[A-Z0-9-]{1,32}$/.test(answer)||!task.choices.some(([id])=>id===input.decision))return reply('Enter a reference and select a decision first.',400);
 const remember=attempt=>{data.last[role]=[...(data.last[role]??[]).slice(-127),attempt];};
 if(answer!==task.answer||input.decision!==task.decision){
  const charged=status==='running';
  if(charged){data.deadline-=penalty;data.penalties+=1;}
  const misses=data.misses[role]=(data.misses[role]??0)+1;
  if(misses>=retryLimit)data.locks[role]=task.partner;
  const error=data.locks[role]?'Decision rejected. Your evidence partner must reopen it.':'Decision rejected. Check both the reference and action with your evidence partner.';
  remember({id:input.id,round:input.round,error,penaltyApplied:charged});
  await persist();return reply(error,422,charged);
 }
 remember({id:input.id,round:input.round});
 data.done[role]=true;
 if(Object.keys(roles).every(r=>data.done[r])){
  if(data.round+1===rounds.length){data.finishedAt=now;}
  else{data.round+=1;data.done={};data.misses={};data.locks={};}
 }
 await persist();return reply();
}
