export const roleNames={'VEN-01':'Coordination','DAT-02':'Privacy','PLN-03':'Planning','REV-04':'Finance'};
export const roleName=id=>roleNames[id]||'Unassigned';
export const assignmentLabel=(id,currentRole)=>id&&id===currentRole?'Me':roleName(id);
// Acyclic dependencies with rotating peer reviews. Each station has an independent start.
export const tasks=[
 {id:'messagesReported',title:'Report the fraudulent voicemails',role:'VEN-01',level:1,page:'inbox',deps:[],note:'Identify and report all four fraudulent messages using the correct reasons.'},
 {id:'verified',title:'Verify the venue request',role:'VEN-01',level:1,page:'inbox',deps:[],note:'Use the saved vendor contact, not the incoming number.'},
 {id:'safetyReady',title:'Scope the assistant’s sources',role:'DAT-02',level:1,page:'safety',deps:[],note:'Use prepared files only; remove unnecessary sources.'},
 {id:'redacted',title:'Prepare the financial summary',role:'DAT-02',level:1,page:'documents',deps:[],note:'Apply redactions and save the prepared copy.'},
 {id:'guestBrief',title:'Collect the anonymous guest brief',role:'PLN-03',level:1,page:'office',deps:[],note:'Confirm the physical guest brief and required accommodations.'},
 {id:'financeReady',title:'Verify and co-sign the venue contract',role:'REV-04',level:1,page:'venue-contract',deps:[],note:'Find the physical contract, unlock its digital copy, verify the terms and co-sign.'},
 {id:'guestConfirmed',title:'Cross-check the planner’s guest brief',role:'VEN-01',level:2,page:'handoffs',deps:['guestBrief'],note:'Confirm the guest count and accommodations for the vendor team.'},
 {id:'venueConfirmed',title:'Cross-check the vendor’s verification',role:'DAT-02',level:2,page:'handoffs',deps:['verified'],note:'Confirm the verified account against the separate contract.'},
 {id:'privacyConfirmed',title:'Cross-check the privacy team’s prepared copy',role:'PLN-03',level:2,page:'handoffs',deps:['redacted'],note:'Check the minimized totals are useful without the client identifiers.'},
 {id:'sourcesConfirmed',title:'Cross-check the privacy team’s source settings',role:'REV-04',level:2,page:'source-settings-review',deps:['safetyReady'],note:'Confirm this task needs prepared files, not broad work-data or web access.'},
 {id:'paymentRejected',title:'Reject the unverified AI payment change',role:'REV-04',level:3,page:'review',deps:['injection','verified'],note:'Compare the proposed account with the saved contract and reject the change.'},
 {id:'injection',title:'Inspect and flag the supplier’s embedded instruction',role:'PLN-03',level:2,page:'assistant',deps:[],note:'Select the embedded instruction in the document and explain why it is unsafe.'},
 {id:'planned',title:'Calculate the wedding plan',role:'PLN-03',level:3,page:'assistant',deps:['messagesReported','verified','redacted','guestBrief','safetyReady','financeReady','guestConfirmed','venueConfirmed','privacyConfirmed','sourcesConfirmed','injection','paymentRejected'],note:'Combine the completed evidence and peer checks.'},
 {id:'reviewed',title:'Review sources and accommodations',role:'REV-04',level:4,page:'review',deps:['planned'],note:'Review the analyst’s output independently.'},
 {id:'supportReported',title:'Report the fraudulent support chatbot',role:'VEN-01',level:5,page:'inbox',deps:['approved'],note:'Inspect the support request, decline the disclosure and report the unauthorized provider.'},
 {id:'approved',title:'Approve the final arrangements',role:'REV-04',level:4,page:'budget',deps:['reviewed','injection','planned','verified','redacted'],note:'Use the separate finance approval card.'}
];
// Sort by dependency depth, then prerequisite count. Counts describe dependencies, not difficulty.
export const dependencyDepth=(id,seen=new Set())=>{const t=tasks.find(t=>t.id===id);if(!t||seen.has(id))return 0;return t.deps.length?1+Math.max(...t.deps.map(d=>dependencyDepth(d,new Set([...seen,id])))):0};
tasks.sort((a,b)=>dependencyDepth(a.id)-dependencyDepth(b.id)||a.deps.length-b.deps.length);
export const prerequisiteLabel=id=>{const n=tasks.find(t=>t.id===id)?.deps.length||0;return n===0?'Independent start':n+' prerequisite'+(n===1?'':'s')};
export const pageRoles={'venue-contract':['REV-04'],'source-settings-review':['REV-04'],inbox:['VEN-01'],documents:['DAT-02'],safety:['DAT-02'],assistant:['PLN-03'],review:['REV-04'],budget:['REV-04']};
export function pageReason(page,role){return pageRoles[page]&&!pageRoles[page].includes(role)?`You do not have permission to access this app. Assigned to ${pageRoles[page].map(roleName).join(', ')}.`:''}
export function taskReason(id,s){const t=tasks.find(t=>t.id===id);if(!t)return '';if(t.role!==s.activeRole)return `You do not have permission to access this task. Assigned to ${roleName(t.role)}.`;const missing=t.deps.filter(k=>!s[k]);return missing.length?'Waiting for: '+missing.map(k=>tasks.find(t=>t.id===k)?.title||k).join('; '):''}
export const actionTasks={'report-support':'supportReported','open-contract':'financeReady','clear-signature':'financeReady','sign-contract':'financeReady','flag-reason':'injection','inspect-text':'injection','run-attack':'injection','reject-payment':'paymentRejected','accept-payment':'paymentRejected',verify:'verified',unsafe:'verified','save-safety':'safetyReady','redact-tool':'redacted','mark-redaction':'redacted','undo-mark':'redacted','apply-redactions':'redacted','new-document':'redacted','share-document':'redacted','download-document':'redacted','preview-document':'redacted','decline-documents':'redacted','guest-brief':'guestBrief',injection:'injection',ask:'planned',review:'reviewed',approve:'approved'};
