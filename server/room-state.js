import {tasks} from '../dist/workflow.js';
export const sharedKeys=['financeReady','guestConfirmed','venueConfirmed','privacyConfirmed','sourcesConfirmed','guestBrief','plannedBy','chatMessages','chatAttachments','documentEdits','reports','declinedDocuments','verified','redacted','injection','planned','reviewed','approved','incidents','reply','competitorDecision','safetyReady','aiSettings'];
export function mergeRoom(current,patch,baseRevision){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Invalid patch');
 const keys=Object.keys(patch);if(keys.some(k=>!sharedKeys.includes(k)))throw Error('Unknown field');
 if(keys.some(k=>(current.clocks[k]||0)>baseRevision))return null;
 const revision=current.revision+1;
 return {revision,data:{...current.data,...patch},clocks:{...current.clocks,...Object.fromEntries(keys.map(k=>[k,revision]))}};
}

export function validateRolePatch(patch,role,current){
 if(!['VEN-01','DAT-02','PLN-03','REV-04'].includes(role))return 'Select a station role before updating tasks.';
 const owners={documentEdits:'DAT-02',aiSettings:'DAT-02',declinedDocuments:'DAT-02',chatMessages:'PLN-03',chatAttachments:'PLN-03',reply:'PLN-03',plannedBy:'PLN-03',reports:'VEN-01'};
 const derived=['planned','reviewed','approved','privacyConfirmed','reply','chatMessages','chatAttachments'];
 for(const [key,value] of Object.entries(patch)){
  const task=tasks.find(t=>t.id===key);const owner=task?.role||owners[key];
  const invalidation=derived.includes(key)&&(value===false||value===''||(Array.isArray(value)&&value.length===0));
  if(owner&&owner!==role&&!invalidation)return 'This role cannot update '+key;
  if(task&&value===true&&task.deps.some(d=>!current[d]))return 'Required handoff missing for '+key;
 }
 return '';
}
