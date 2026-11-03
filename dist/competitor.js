import {chatbotTopics,validSupportReport} from './support-review.js';
const room=(new URLSearchParams(location.search).get('room')||'rehearsal').replace(/[^a-zA-Z0-9-]/g,'').slice(0,40)||'rehearsal';
const requestKey=`blissify-support-request:${room}`,ackKey=`blissify-support-ack:${room}`;
const back=`index.html?room=${encodeURIComponent(room)}#inbox`;
document.getElementById('back').href=back;document.getElementById('rival-report-back').href=back;
const panel=document.getElementById('rival-chat'),toggle=document.getElementById('rival-chat-toggle'),conversation=document.getElementById('rival-conversation');
let topic='',pendingId='';
function open(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');document.getElementById('rival-chat-close').focus()}
toggle.addEventListener('click',()=>{if(panel.hidden)open();else{panel.hidden=true;toggle.setAttribute('aria-expanded','false')}});
document.querySelectorAll('[data-open-rival-chat]').forEach(el=>el.addEventListener('click',open));
document.getElementById('rival-chat-close').addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()});
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}});
for(const [id,item] of Object.entries(chatbotTopics)){const button=document.createElement('button');button.textContent=item.label;button.addEventListener('click',()=>{topic=id;conversation.replaceChildren();const user=document.createElement('p');user.className='rival-chat-user';user.textContent=item.label;const reply=document.createElement('p');reply.textContent=item.request;conversation.append(user,reply);document.getElementById('rival-report-form').hidden=false;document.getElementById('rival-report-feedback').textContent='';document.getElementById('rival-report-send').disabled=false;});document.getElementById('rival-chat-options').append(button)}
document.getElementById('rival-report-send').addEventListener('click',()=>{
 const report={topic,reason:document.getElementById('rival-report-reason').value,provider:'unverified',action:'declined'};
 const feedback=document.getElementById('rival-report-feedback');if(!validSupportReport(report)||!topic){feedback.textContent='That reason does not describe this request. Look at the confidential records it asks you to disclose, then try again.';return}
 pendingId=crypto.randomUUID();try{localStorage.setItem(requestKey,JSON.stringify({id:pendingId,report}));feedback.textContent='Report sent to your Blissify workspace. Keep the Coordination workspace open to record your score.';}catch{feedback.textContent='Progress storage is unavailable. Open Blissify and try again.'}
});
window.addEventListener('storage',e=>{if(e.key!==ackKey)return;try{const ack=JSON.parse(e.newValue);if(ack.id!==pendingId)return;document.getElementById('rival-report-feedback').textContent=ack.message;if(ack.ok)document.getElementById('rival-report-send').disabled=true}catch{}});
