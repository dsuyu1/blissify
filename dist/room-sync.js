// Two-second polling; server revisions prevent stale writes from overwriting shared tasks.
export function connectRoom(room,code,onState,onStatus){
 let revision=0,baseline={},queue=Promise.resolve(),closed=false,initialized=false;
 const headers={'Content-Type':'application/json','X-Workshop-Code':code,'X-Workshop-Client':'blissify'};
 async function request(patch,role){const r=await fetch('/api/room?room='+encodeURIComponent(room),{method:patch?'POST':'GET',headers,...(patch?{body:JSON.stringify({revision,patch,role})}:{})});if(!r.ok&&r.status!==409)throw Error((await r.json().catch(()=>({}))).error||'Room sync unavailable');const d=await r.json();const changed=d.revision!==revision||!initialized;revision=d.revision;baseline=d.data;initialized=true;if(changed)onState(d.data);onStatus(r.status===409?'Conflict: latest room state restored; repeat your last action.':'Connected · updates every 2 seconds');return d;}
 const ready=request();
 const timer=setInterval(()=>{if(!closed)queue=queue.then(()=>ready).then(()=>request()).catch(e=>onStatus('Disconnected · '+e.message))},2000);
 return {ready,update(patch,role){queue=queue.then(()=>ready).then(()=>request(patch,role)).catch(e=>{onStatus('Not saved · '+e.message);return request().catch(()=>{})});},close(){closed=true;clearInterval(timer)}};
}
