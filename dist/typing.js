// Reveal only a newly generated reply. Saved history always renders in full.
export function revealReply(element,text,{reduced=false}={}){
 if(!element||reduced||!text)return ()=>{};
 const chars=Array.from(text),duration=Math.min(4200,Math.max(450,chars.length*5));
 let frame,start;const thread=element.closest('[role="log"]');
 element.textContent='';element.classList.add('reply-typing');thread?.setAttribute('aria-busy','true');
 function finish(){cancelAnimationFrame(frame);element.textContent=text;element.classList.remove('reply-typing');thread?.removeAttribute('aria-busy')}
 function tick(now){if(!element.isConnected){finish();return}start??=now;const count=Math.min(chars.length,Math.ceil(chars.length*(now-start)/duration));element.textContent=chars.slice(0,count).join('');const scroller=element.closest('.ai-thread');if(scroller&&scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<120)scroller.scrollTop=scroller.scrollHeight;if(count<chars.length)frame=requestAnimationFrame(tick);else finish()}
 frame=requestAnimationFrame(tick);return finish;
}
