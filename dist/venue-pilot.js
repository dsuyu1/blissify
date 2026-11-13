const names={'VEN-01':'Coordination','REV-04':'Finance','DAT-02':'Privacy','PLN-03':'Planning'};
const $=id=>document.getElementById(id);
const entry=$('entry'), dashboard=$('dashboard'), work=$('work');
let host=false,session=null,snapshot=null,pollBusy=false,acting=false,clockReceived=0,workKey='',pollError=false,mutation=0;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
entry.elements.room.value=new URL(location.href).searchParams.get('room')||'';

function message(text='',error=false){$('message').textContent=text;$('message').dataset.error=error;}
function toggleMode(){
 host=!host;
 $('credential-label').querySelector('span').textContent=host?'Facilitator workshop code':'Station code';
 $('join').textContent=host?'Open existing room':'Join station';
 $('create').hidden=!host;
 $('host-config').hidden=!host;
 $('toggle-mode').textContent=host?'Back to station sign-in':'Facilitator sign-in';
 message();
}
$('toggle-mode').addEventListener('click',toggleMode);
if(new URL(location.href).searchParams.has('host'))toggleMode();

async function api(body){
 const url='/api/venue-pilot?room='+encodeURIComponent(session.room);
 const result=await fetch(url,{headers:{'X-Workshop-Client':'blissify-venue',[session.host?'X-Workshop-Code':'X-Station-Card']:session.credential,...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 return {ok:result.ok,data:await result.json()};
}
const labels={lobby:'Waiting for the facilitator',running:'Countdown in progress',expired:'Time expired',debrief:'Debrief · timer stopped',secured:'Venue secured'};
function drawClock(){
 if(!snapshot||!$('clock'))return;
 const s=snapshot;
 const ms=s.status==='running'?Math.max(0,s.deadline-(s.serverNow+performance.now()-clockReceived)):s.status==='secured'&&s.result==='escaped-in-time'?Math.max(0,s.deadline-s.finishedAt):0;
 const seconds=Math.ceil(ms/1000);
 $('clock').textContent=s.status==='lobby'?'—':Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 $('clock').classList.toggle('urgent',s.status==='running'&&seconds<60);
}
function update(data){
 if(!data.status)return;
 if(data.cards)session.cards=data.cards;
 const previous=snapshot;
 if(previous&&data.round!==previous.round)message('New evidence has arrived at every station.');
 snapshot=data;clockReceived=performance.now();
 dashboard.hidden=work.hidden=false;
 const s=data;
 dashboard.innerHTML='<div class="status-line"><div><p class="muted">'+esc(labels[s.status])+'</p><h2>'+esc(s.title)+'</h2></div><strong id="clock" aria-label="Time remaining"></strong></div>'+
 '<p class="muted">'+(session.host?'Facilitator':esc(names[s.role]))+' · Room '+esc(session.room)+' · '+s.penalties+' time '+(s.penalties===1?'penalty':'penalties')+'</p>'+
 '<ul class="station-grid">'+Object.entries(s.team).map(([role,t])=>'<li data-done="'+t.done+'"><strong>'+esc(names[role])+'</strong><span>'+ (t.done?'Verified':t.needsReview?'Partner review needed':'Pending')+'</span></li>').join('')+'</ul>';
 drawClock();
 // Keep partially entered answers and keyboard focus while teammate status updates.
 const key=JSON.stringify([s.status,s.round,s.team[s.role],s.reviewFor,s.result,session.cards]);
 if(key===workKey)return;
 workKey=key;
 renderWork(s);
}
function renderWork(s){
 if(session.host){
  const playerUrl=new URL(location.pathname,location.origin);playerUrl.searchParams.set('room',session.room);
  work.innerHTML='<section class="card"><h2>Facilitator controls</h2><p>Give each player only their assigned station code. Start when all four are ready.</p><p><a href="'+esc(playerUrl.href)+'" target="_blank" rel="noopener">Open the player sign-in</a></p>'+
   (session.cards?'<ul class="station-grid">'+Object.entries(session.cards).map(([role,code])=>'<li><strong>'+esc(names[role])+'</strong><code>'+esc(code)+'</code></li>').join('')+'</ul>':'')+
   '<p></p><div class="actions">'+(s.status==='lobby'?'<button data-action="start">Start countdown</button>':s.status==='expired'?'<button data-action="debrief">Continue in debrief</button>':s.status==='secured'?'<strong>'+(s.result==='completed-in-debrief'?'Completed in debrief':'Escaped in time')+'</strong>':'')+'<button data-action="leave" class="secondary">Leave controls</button></div></section>';
  return;
 }
 const review=s.reviewFor.map(role=>'<section class="card"><h3>'+esc(names[role])+' needs your evidence</h3><p>Compare the source together. Reopen their decision once you’ve agreed on the reference.</p><button data-action="review" data-station="'+esc(role)+'">Reopen '+esc(names[role])+' decision</button></section>').join('');
 let body='';
 if(s.status==='lobby')body='<h2>Your station is ready</h2><p>The countdown starts when the facilitator begins.</p>';
 else if(s.status==='expired')body='<h2>Time expired</h2><p>The facilitator can reopen the investigation in debrief mode.</p>';
 else if(s.status==='secured')body='<h2>Venue secured</h2><p>The original payment details are verified, the unauthorized guest export is stopped, and the reviewed packet is ready. '+(s.result==='completed-in-debrief'?'Completed in debrief.':'Your team escaped in time.')+'</p>';
 else if(s.task){
  const t=s.task, mine=s.team[s.role];
  body='<p class="muted">Round '+s.round+' of 2</p><h2>'+esc(t.title)+'</h2><div class="evidence"><strong>'+esc(t.source)+'</strong>'+
   (t.url?'<p>'+esc(t.detail)+'</p><a class="button secondary" href="'+esc(t.url)+'" target="_blank" rel="noopener">Open your evidence</a>':(t.reference?'<p>Reference: <strong>'+esc(t.reference)+'</strong></p>':'')+'<p>'+esc(t.detail)+'</p>')+'</div>'+
   (mine.done?'<p>Your decision is verified. Stay available for your partner while the team finishes this round.</p>':mine.needsReview?'<p>'+esc(names[t.partner])+' must reopen your decision after you check their evidence together.</p>':
   '<form id="decision"><label>'+esc(t.field)+'<input name="reference" required maxlength="32" autocomplete="off" autocapitalize="characters"></label>'+
   '<label>Decision<select name="decision" required><option value="">Choose an action</option>'+t.choices.map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('')+'</select></label><button type="submit">Commit decision</button><p class="muted">An incorrect decision costs the team 30 seconds while the clock is running.</p></form>');
 }
 work.innerHTML=review+'<section class="card">'+body+'<button data-action="leave" class="secondary">Leave station</button></section>';
}
async function refresh(){
 if(!session||acting||pollBusy)return;
 const active=session,version=mutation;pollBusy=true;
 try{
  const {ok,data}=await api();
  if(active!==session||acting||version!==mutation)return;
  if(ok){if(pollError)message();pollError=false;update(data);}
  else {pollError=true;message(data.error||'Could not refresh room.',true);}
 }catch{if(active===session){pollError=true;message('Connection lost. Reconnecting…',true);}}
 finally{pollBusy=false;}
}
function leave(){
 session=null;snapshot=null;workKey='';pollError=false;entry.hidden=false;dashboard.hidden=work.hidden=true;entry.elements.credential.value='';message();entry.elements.credential.focus();
}
entry.addEventListener('submit',async event=>{
 event.preventDefault();if(acting)return;
 const form=new FormData(entry);
 session={host,room:String(form.get('room')).trim().toLowerCase(),credential:String(form.get('credential')).trim()};
 acting=true;message();
 try{
  const response=await api(event.submitter?.id==='create'?{action:'create',minutes:Number(form.get('minutes')),mode:form.get('mode')}:undefined);
  if(!response.ok)throw Error(response.data.error);
  if(event.submitter?.id==='create'){
   const created=await api();
   if(!created.ok)throw Error(created.data.error);
   update(created.data);
  }else update(response.data);
  entry.hidden=true;entry.elements.credential.value='';
  const url=new URL(location.href);url.searchParams.set('room',session.room);if(host)url.searchParams.set('host','');else url.searchParams.delete('host');history.replaceState(null,'',url);
 }catch(e){session=null;message(e.message||'Could not connect.',true);}
 finally{acting=false;}
});
async function perform(payload,button){
 if(!session||acting)return;
 acting=true;mutation+=1;button.disabled=true;
 try{
  const {ok,data}=await api(payload);update(data);
  message(ok?(payload.action==='commit'?'Decision verified.':payload.action==='review'?'Decision reopened.':''):((data.penaltyApplied?'−30 seconds. ':'')+(data.error||'Could not save.')),!ok);
  return true;
 }catch{message('Could not confirm the submission. Try again to check the same attempt.',true);return false;}
 finally{acting=false;button.disabled=false;}
}
let pending=null;
work.addEventListener('submit',async event=>{
 if(event.target.id!=='decision')return;
 event.preventDefault();if(acting)return;
 const form=new FormData(event.target),answer={action:'commit',round:snapshot.round,reference:form.get('reference'),decision:form.get('decision')};
 const key=JSON.stringify(answer);
 if(pending?.key!==key)pending={key,id:crypto.randomUUID()};
 if(await perform({...answer,id:pending.id},event.submitter))pending=null;
});
work.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');if(!button||acting)return;
 if(button.dataset.action==='leave'){pending=null;leave();return;}
 perform({action:button.dataset.action,station:button.dataset.station,round:snapshot.round},button);
});
setInterval(refresh,2000);
setInterval(drawClock,250);
