export const roles=[
 {id:'VEN-01',name:'Vendor coordinator',task:'Check the saved contact directory, verify the venue request, and report suspicious calls.',page:'inbox'},
 {id:'DAT-02',name:'Privacy officer',task:'Apply redactions and save the prepared financial summary. Assess the competitor support request.',page:'documents'},
 {id:'PLN-03',name:'Planning analyst',task:'Collect the anonymous guest brief, attach the prepared files, and ask the assistant to calculate.',page:'assistant'},
 {id:'REV-04',name:'Finance reviewer',task:'Review source inputs and guest requirements, then approve with the physical finance card.',page:'budget'}
];
const scopes={verify:'VEN-01',unsafe:'VEN-01','redact-tool':'DAT-02','mark-redaction':'DAT-02','undo-mark':'DAT-02','apply-redactions':'DAT-02','new-document':'DAT-02','share-document':'DAT-02','download-document':'DAT-02','guest-brief':'PLN-03',ask:'PLN-03',review:'REV-04',approve:'REV-04'};
export function taskBlock(action,state){
 const required=scopes[action]||(action.startsWith('attach-')?'PLN-03':null);
 if(required&&state.activeRole!==required)return `Hand the laptop to ${roles.find(r=>r.id===required).name} (${required}) and select their role.`;
 if(['verify','share-document','guest-brief'].includes(action)&&!state.safetyReady)return 'Complete Level 1 AI source settings first.';
 if(action==='ask'&&(!state.verified||!state.redacted||!state.guestBrief))return 'Waiting for handoffs: verified venue, saved redacted summary, and anonymous guest brief.';
 if(action==='review'&&state.plannedBy===state.activeRole)return 'A different role must review the planning analyst’s work.';
 return '';
}
