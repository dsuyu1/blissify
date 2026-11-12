export const auditScenario={
 name:'VowPilot',
 assignment:'Draft a vendor update from the prepared wedding folder. A teammate will send it after review.',
 events:[
  {id:'draft',title:'Draft saved',detail:'The assistant saved a vendor update for review.'},
  {id:'share',title:'Share link created',detail:'The assistant made a link to the guest brief that anyone could open.'},
  {id:'read',title:'Quote read',detail:'The assistant opened a catering quote in the prepared wedding folder.'}
 ]
};

export function checkPhoneAudit(e){
 if(!e||e.event!=='share')return 'Look for an action that gave someone new access, rather than something the drafting task needed.';
 if(e.scope==='all')return 'The run opened an unrelated client file. Limit which folder the assistant can read.';
 if(e.scope!=='prepared')return 'The assistant could not read the quote it needs to draft the update.';
 if(e.send!==false||e.share!==false)return 'The draft was created, but the assistant can still send or share it without a reviewer.';
 return '';
}
