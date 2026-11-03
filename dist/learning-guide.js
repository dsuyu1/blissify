import {tasks,roleName} from './workflow.js';
import {guideTask,lessons} from './guide-content.js';
export function createLearningGuide(onChoose){
 const root=document.createElement('aside');root.id='learning-guide';root.hidden=true;
 root.innerHTML='<section id="learning-guide-panel" role="region" aria-label="Task learning guide" hidden><header><span>AI SECURITY · TASK GUIDE</span><button type="button" data-guide-close aria-label="Close task guide">×</button></header><label for="guide-task">Current task</label><select id="guide-task"></select><p id="guide-status"></p><h2>Why this matters</h2><p id="guide-why"></p><button type="button" id="guide-hint-toggle" aria-expanded="false" aria-controls="guide-hint">Show a hint</button><p id="guide-hint" hidden></p></section><button type="button" id="guide-toggle" aria-expanded="false" aria-controls="learning-guide-panel"><span aria-hidden="true">i</span><span>Why this matters</span></button>';
 document.body.append(root);
 const panel=root.querySelector('section'),toggle=root.querySelector('#guide-toggle'),hint=root.querySelector('#guide-hint'),hintToggle=root.querySelector('#guide-hint-toggle'),select=root.querySelector('select');
 let pinned=false,opened=false,current='',animation=null,ignoreFocus=false;const shownHints=new Set();
 try{pinned=localStorage.getItem('blissify-guide-pinned')==='1'}catch{}
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const remember=()=>{try{localStorage.setItem('blissify-guide-pinned',pinned?'1':'0')}catch{}};
 function setOpen(open){
  if(opened===open)return;opened=open;toggle.setAttribute('aria-expanded',String(open));animation?.kill();
  if(open){panel.hidden=false;if(window.gsap&&!reduced())animation=window.gsap.fromTo(panel,{opacity:0,y:14,scale:.88},{opacity:1,y:0,scale:1,duration:.55,ease:'back.out(1.6)',clearProps:'transform,opacity'});else{panel.style.opacity='';panel.style.transform=''}}
  else{if(window.gsap&&!reduced())animation=window.gsap.to(panel,{opacity:0,y:8,scale:.96,duration:.16,ease:'power2.in',onComplete:()=>{panel.hidden=true;panel.style.opacity='';panel.style.transform=''}});else panel.hidden=true}
 }
 toggle.addEventListener('click',()=>{pinned=!pinned;remember();setOpen(pinned)});
 root.querySelector('[data-guide-close]').addEventListener('click',()=>{pinned=false;remember();setOpen(false);ignoreFocus=true;toggle.focus();ignoreFocus=false});
 root.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')setOpen(true)});
 root.addEventListener('pointerleave',()=>{if(!pinned&&!root.contains(document.activeElement))setOpen(false)});
 toggle.addEventListener('focus',()=>{if(!ignoreFocus)setOpen(true)});
 root.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!pinned&&!root.contains(document.activeElement))setOpen(false)}));
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pinned=false;remember();setOpen(false);ignoreFocus=true;toggle.focus();ignoreFocus=false}});
 select.addEventListener('change',()=>onChoose(select.value));
 hintToggle.addEventListener('click',()=>{if(shownHints.has(current))shownHints.delete(current);else shownHints.add(current);hint.hidden=!shownHints.has(current);hintToggle.setAttribute('aria-expanded',String(!hint.hidden));hintToggle.textContent=hint.hidden?'Show a hint':'Hide hint'});
 return {update({page,state,preferred,portal}){
  if(root.parentElement!==(portal||document.body))(portal||document.body).append(root);
  const task=guideTask(page,state,preferred);root.hidden=!state.open||!task;if(root.hidden)return;
  root.dataset.app=page==='assistant'?'assistant':'portal';
  const options=tasks.filter(t=>t.role===state.activeRole||t.id===task.id);
  if(current!==task.id||select.dataset.role!==state.activeRole){current=task.id;select.replaceChildren(...options.map(t=>{const option=document.createElement('option');option.value=t.id;option.textContent=t.title;return option}));select.value=task.id;select.dataset.role=state.activeRole;root.querySelector('#guide-why').textContent=lessons[task.id].why;hint.textContent=lessons[task.id].hint;hint.hidden=!shownHints.has(current);hintToggle.setAttribute('aria-expanded',String(!hint.hidden));hintToggle.textContent=hint.hidden?'Show a hint':'Hide hint'}
  const missing=task.deps.filter(id=>!state[id]);root.querySelector('#guide-status').textContent=roleName(task.role)+' · '+(state[task.id]?'Completed':missing.length?'Waiting for '+missing.map(id=>tasks.find(t=>t.id===id)?.title||id).join('; '):'Ready to work on');
  if(pinned)setOpen(true);
 }};
}
