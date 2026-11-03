// Reveal only a newly generated reply. Saved history always renders in full.
export function revealReply(element,text,{reduced=false}={}){
 if(!element||reduced||!text)return ()=>{};
 const chars=Array.from(text),duration=Math.min(9000,Math.max(800,chars.length*14));
 let frame,start;const thinkingMs=1000;const thread=element.closest('[role="log"]');
 element.textContent='Thinking…';element.classList.add('reply-thinking');thread?.setAttribute('aria-busy','true');
 function finish(){cancelAnimationFrame(frame);element.textContent=text;element.classList.remove('reply-typing','reply-thinking');thread?.removeAttribute('aria-busy')}
 function tick(now){if(!element.isConnected){finish();return}start??=now;if(now-start<thinkingMs){frame=requestAnimationFrame(tick);return}element.classList.remove('reply-thinking');element.classList.add('reply-typing');const count=Math.min(chars.length,Math.ceil(chars.length*(now-start-thinkingMs)/duration));element.textContent=chars.slice(0,count).join('');const scroller=element.closest('.ai-thread');if(scroller&&scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<120)scroller.scrollTop=scroller.scrollHeight;if(count<chars.length)frame=requestAnimationFrame(tick);else finish()}
 frame=requestAnimationFrame(tick);return finish;
}
