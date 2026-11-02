// Acyclic dependencies with rotating peer reviews. Each station has an independent start.
export const tasks=[
 {id:'verified',title:'Verify the venue request',role:'VEN-01',level:1,page:'inbox',deps:[],note:'Use the saved vendor contact, not the incoming number.'},
 {id:'safetyReady',title:'Scope the assistant’s sources',role:'DAT-02',level:1,page:'safety',deps:[],note:'Use prepared files only; remove unnecessary sources.'},
 {id:'redacted',title:'Prepare the financial summary',role:'DAT-02',level:1,page:'documents',deps:[],note:'Apply redactions and save the prepared copy.'},
 {id:'guestBrief',title:'Collect the anonymous guest brief',role:'PLN-03',level:1,page:'office',deps:[],note:'Confirm the physical guest brief and required accommodations.'},
 {id:'financeReady',title:'Check the venue contract and deposit',role:'REV-04',level:1,page:'handoffs',deps:[],note:'Check the physical contract: deposit is included, not an extra charge.'},
 {id:'guestConfirmed',title:'Cross-check the planner’s guest brief',role:'VEN-01',level:2,page:'handoffs',deps:['guestBrief'],note:'Confirm the guest count and accommodations for the vendor team.'},
 {id:'venueConfirmed',title:'Cross-check the vendor’s verification',role:'DAT-02',level:2,page:'handoffs',deps:['verified'],note:'Confirm the verified account against the separate contract.'},
 {id:'privacyConfirmed',title:'Cross-check the privacy team’s prepared copy',role:'PLN-03',level:2,page:'handoffs',deps:['redacted'],note:'Check the minimized totals are useful without the client identifiers.'},
 {id:'sourcesConfirmed',title:'Cross-check the privacy team’s source settings',role:'REV-04',level:2,page:'handoffs',deps:['safetyReady'],note:'Confirm this task needs prepared files, not broad work-data or web access.'},
 {id:'injection',title:'Flag the supplier’s embedded instruction',role:'PLN-03',level:3,page:'assistant',deps:[],note:'Inspect supplier instructions while your colleagues gather evidence.'},
 {id:'planned',title:'Calculate the wedding plan',role:'PLN-03',level:3,page:'assistant',deps:['verified','redacted','guestBrief','safetyReady','financeReady','guestConfirmed','venueConfirmed','privacyConfirmed','sourcesConfirmed'],note:'Combine the completed evidence and peer checks.'},
 {id:'reviewed',title:'Review sources and accommodations',role:'REV-04',level:4,page:'review',deps:['planned'],note:'Review the analyst’s output independently.'},
 {id:'approved',title:'Approve the final arrangements',role:'REV-04',level:4,page:'budget',deps:['reviewed','injection','planned','verified','redacted'],note:'Use the separate finance approval card.'}
];
export const pageRoles={inbox:['VEN-01'],documents:['DAT-02'],safety:['DAT-02'],assistant:['PLN-03'],review:['REV-04'],budget:['REV-04']};
export function pageReason(page,role){return pageRoles[page]&&!pageRoles[page].includes(role)?`You do not have permission to access this app. Assigned to ${pageRoles[page].join(', ')}.`:''}
export function taskReason(id,s){const t=tasks.find(t=>t.id===id);if(!t)return '';if(t.role!==s.activeRole)return `You do not have permission to access this task. Assigned to ${t.role}.`;const missing=t.deps.filter(k=>!s[k]);return missing.length?'Waiting for: '+missing.map(k=>tasks.find(t=>t.id===k)?.title||k).join('; '):''}
export const actionTasks={verify:'verified',unsafe:'verified','save-safety':'safetyReady','redact-tool':'redacted','mark-redaction':'redacted','undo-mark':'redacted','apply-redactions':'redacted','new-document':'redacted','share-document':'redacted','download-document':'redacted','preview-document':'redacted','decline-documents':'redacted','guest-brief':'guestBrief',injection:'injection',ask:'planned',review:'reviewed',approve:'approved'};
