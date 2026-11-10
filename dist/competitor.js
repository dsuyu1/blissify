import {installActionStyles} from './action-style.js';
import {chatbotTopics,validSupportReport} from './support-review.js';
const params=new URLSearchParams(location.search);
const room=(params.get('room')||'rehearsal').replace(/[^a-zA-Z0-9-]/g,'').slice(0,40)||'rehearsal';
const visit=params.get('visit')||'';
const canReport=/^[a-f0-9-]{36}$/i.test(visit)&&!params.has('inspect');
const requestKey=`blissify-support-request:${visit}`,ackKey=`blissify-support-ack:${visit}`;
const back=`index.html?room=${encodeURIComponent(room)}#debrief`;
for(const id of ['back','rival-report-back']){
 const link=document.getElementById(id);
 link.href=back;
 if(visit)link.addEventListener('click',event=>{
  event.preventDefault();
  window.close();
  document.getElementById('rival-report-feedback').textContent='Switch back to your original Blissify workspace tab.';
 });
}
const panel=document.getElementById('rival-chat'),toggle=document.getElementById('rival-chat-toggle'),conversation=document.getElementById('rival-conversation');
let topic='',pendingId='',reportTimer;
function open(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');document.getElementById('rival-chat-close').focus()}
toggle.addEventListener('click',()=>{if(panel.hidden)open();else{panel.hidden=true;toggle.setAttribute('aria-expanded','false')}});
document.querySelectorAll('[data-open-rival-chat]').forEach(el=>el.addEventListener('click',open));
document.getElementById('rival-chat-close').addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()});
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}});
for(const [id,item] of Object.entries(chatbotTopics)){const button=document.createElement('button');button.textContent=item.label;button.addEventListener('click',()=>{topic=id;conversation.replaceChildren();const user=document.createElement('p');user.className='rival-chat-user';user.textContent=item.label;const reply=document.createElement('p');reply.textContent=item.request;conversation.append(user,reply);document.getElementById('rival-report-form').hidden=!canReport;document.getElementById('rival-report-feedback').textContent='';document.getElementById('rival-report-send').disabled=false;});document.getElementById('rival-chat-options').append(button)}
document.getElementById('rival-report-send').addEventListener('click',()=>{
 if(!canReport)return;
 const report={topic,reason:document.getElementById('rival-report-reason').value,provider:'unverified',action:'declined'};
 const feedback=document.getElementById('rival-report-feedback');if(!validSupportReport(report)||!topic){feedback.textContent='That reason does not describe this request. Look at the confidential records it asks you to disclose, then try again.';return}
 pendingId=crypto.randomUUID();
 const button=document.getElementById('rival-report-send');
 try{
  localStorage.setItem(requestKey,JSON.stringify({id:pendingId,report}));
  button.disabled=true;
  feedback.textContent='Waiting for Blissify to save your report…';
  clearTimeout(reportTimer);
  reportTimer=setTimeout(()=>{
   feedback.textContent='Blissify did not confirm the report. Return to the Coordination tab and reopen Ever After from Mr. Planner.';
   button.disabled=false;
  },10000);
 }catch{feedback.textContent='Progress storage is unavailable. Open Blissify and try again.'}
});
window.addEventListener('storage',e=>{if(e.key!==ackKey)return;try{const ack=JSON.parse(e.newValue);if(ack.id!==pendingId)return;clearTimeout(reportTimer);document.getElementById('rival-report-feedback').textContent=ack.message;document.getElementById('rival-report-send').disabled=ack.ok}catch{}});

installActionStyles();
