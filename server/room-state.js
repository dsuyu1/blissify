import {validSupportReport} from '../dist/support-review.js';
import {validContractSignature} from '../dist/contract.js';
import {reviewKeys,reviewOwners,checkPeerReview} from '../dist/peer-review.js';
import {inspectionCorrect} from '../dist/ai-security.js';
import {reportIsFinal,checkGoodMessage,fraudReportsComplete} from '../dist/reporting.js';
import {tasks} from '../dist/workflow.js';
export const sharedKeys=['supportReported','supportReport','contractCoSign','guestReview','venueReview','privacyReview','sourcesReview','flagSelection','flagReason','inspectionSelection','messagesReported','attackObserved','paymentRejected','financeReady','guestConfirmed','venueConfirmed','privacyConfirmed','sourcesConfirmed','guestBrief','plannedBy','chatMessages','chatAttachments','documentEdits','reports','declinedDocuments','verified','redacted','injection','planned','reviewed','approved','incidents','reply','competitorDecision','safetyReady','aiSettings'];
export function mergeRoom(current,patch,baseRevision){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Invalid patch');
 const keys=Object.keys(patch);if(keys.some(k=>!sharedKeys.includes(k)))throw Error('Unknown field');
 if(keys.some(k=>(current.clocks[k]||0)>baseRevision))return null;
 const revision=current.revision+1;
 return {revision,data:{...current.data,...patch,messagesReported:fraudReportsComplete(patch.reports||current.data.reports)},clocks:{...current.clocks,...Object.fromEntries(keys.map(k=>[k,revision]))}};
}

export function validateRolePatch(patch,role,current){
 if(!['VEN-01','DAT-02','PLN-03','REV-04'].includes(role))return 'Select a station role before updating tasks.';
 if('reports' in patch){if(!patch.reports||typeof patch.reports!=='object'||Array.isArray(patch.reports))return 'Invalid reports.';for(const [id,report] of Object.entries(patch.reports)){if(report?.disposition==='good'&&!checkGoodMessage(id).ok)return 'This message cannot be confirmed good.';}for(const [id,report] of Object.entries(current.reports||{})){if(reportIsFinal(report,id)&&JSON.stringify(patch.reports[id])!==JSON.stringify(report))return 'Submitted reports cannot be changed.';}}
 if('messagesReported' in patch&&patch.messagesReported!==fraudReportsComplete(patch.reports||current.reports))return 'Report all fraudulent messages with correct reasons first.';
 if(patch.attackObserved===true&&!inspectionCorrect(patch.inspectionSelection||current.inspectionSelection))return 'Select the embedded instruction in the document first.';
 if(patch.injection===true&&(!inspectionCorrect(patch.flagSelection||current.flagSelection)||(patch.flagReason||current.flagReason)!=='override'))return 'Select the instruction and explain why it is unsafe first.';
 for(const [taskId,key] of Object.entries(reviewKeys)){if(patch[taskId]===true||key in patch){const result=checkPeerReview(taskId,patch[key]||current[key],{...current,...patch});if(!result.ok)return result.message;}}
 if((patch.financeReady===true||'contractCoSign' in patch)&&!validContractSignature(patch.contractCoSign||current.contractCoSign))return 'Verify and co-sign the venue contract first.';
 if(patch.supportReported===true&&!validSupportReport(patch.supportReport||current.supportReport))return 'Identify the confidential data request and unverified provider first.';
 const owners={supportReport:'VEN-01',competitorDecision:'VEN-01',contractCoSign:'REV-04',...reviewOwners,attackObserved:'PLN-03',flagSelection:'PLN-03',flagReason:'PLN-03',inspectionSelection:'PLN-03',documentEdits:'DAT-02',aiSettings:'DAT-02',declinedDocuments:'DAT-02',chatMessages:'PLN-03',chatAttachments:'PLN-03',reply:'PLN-03',plannedBy:'PLN-03',reports:'VEN-01'};
 const derived=['planned','reviewed','approved','privacyConfirmed','reply','chatMessages','chatAttachments'];
 for(const [key,value] of Object.entries(patch)){
  const task=tasks.find(t=>t.id===key);const owner=task?.role||owners[key];
  const invalidation=derived.includes(key)&&(value===false||value===''||(Array.isArray(value)&&value.length===0));
  if(owner&&owner!==role&&!invalidation)return 'This role cannot update '+key;
  if(task&&value===true&&task.deps.some(d=>!current[d]))return 'Required handoff missing for '+key;
 }
 return '';
}
