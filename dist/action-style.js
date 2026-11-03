// Keep navigation and tool toggles distinct from task action buttons.
export function styleActions(root=document){
 const excluded='.ai-sidebar,.profile-popover,.planner-toolbar,.pdf-toolbar,.pdf-page,.launcher-grid,#rival-chat-options,.ow-suggestions';
 const parents=new Set([...root.querySelectorAll('button')].filter(b=>!b.closest(excluded)&&!b.classList.contains('ow-icon')&&!b.hasAttribute('aria-label')&&!b.matches('[data-guide-close],#guide-toggle,#rival-chat-toggle,#rival-chat-close')).map(b=>b.parentElement));
 for(const parent of parents){
  const buttons=[...parent.children].filter(el=>el.tagName==='BUTTON'&&!el.closest(excluded)&&!el.hasAttribute('aria-label'));
  if(!buttons.length)continue;
  const primary=buttons.find(b=>b.classList.contains('primary')||b.matches('#guide-hint-toggle,#guide-acknowledge,#rival-report-send,[data-action="report-message"],[data-action="mark-good"]'))||buttons.find(b=>!b.disabled)||buttons[0];
  for(const button of buttons){button.classList.remove('action-primary','action-secondary','action-tertiary');button.classList.add(button===primary?'action-primary':'action-secondary')}
  // One supporting outlined action per group; further choices are quiet text actions.
  buttons.filter(b=>b!==primary).slice(1).forEach(b=>{b.classList.remove('action-secondary');b.classList.add('action-tertiary')});
 }
}
export function installActionStyles(){styleActions();new MutationObserver(()=>styleActions()).observe(document.body,{childList:true,subtree:true})}
