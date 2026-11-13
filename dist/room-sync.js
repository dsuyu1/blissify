// Two-second polling; server revisions prevent stale writes from overwriting shared tasks.
export function connectRoom(room,card,onState,onStatus,onTimer=()=>{}){
 let revision=0,queue=Promise.resolve(),closed=false,initialized=false,stationRole;
 const headers={'Content-Type':'application/json','X-Station-Card':card,'X-Workshop-Client':'blissify'};
 async function request(patch,restore=false){if(closed)return;const r=await fetch('/api/room?room='+encodeURIComponent(room),{method:patch?'POST':'GET',headers:!initialized&&!patch?{...headers,'X-Workshop-Join':'1'}:headers,...(patch?{body:JSON.stringify({revision,patch})}:{})});if(!r.ok&&r.status!==409)throw Error((await r.json().catch(()=>({}))).error||'Room sync unavailable');const d=await r.json();if(closed)return d;if(!initialized){if(!d.role)throw Error('The server did not assign a station role. Sign in again.');stationRole=d.role}else if(d.role&&d.role!==stationRole){throw Error('Station role changed unexpectedly. Sign in again.')}const changed=d.revision!==revision||!initialized||restore;revision=d.revision;initialized=true;onTimer(d.timer??null);if(changed)onState(d.data,stationRole);onStatus(r.status===409?'Conflict: latest room state restored; repeat your last action.':'Connected · updates every 2 seconds');return d;}
 const ready=request();
 const timer=setInterval(()=>{if(!closed)queue=queue.then(()=>ready).then(()=>request()).catch(e=>onStatus('Disconnected · '+e.message))},2000);
 return {ready,update(patch){return queue=queue.then(()=>ready).then(()=>request(patch)).catch(e=>{onStatus('Not saved · '+e.message);return request(undefined,true).catch(()=>{}).then(()=>undefined)});},close(){closed=true;clearInterval(timer)}};
}
