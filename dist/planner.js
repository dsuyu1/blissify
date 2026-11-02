export const planTasks=[
 ['safetyReady','Scope the assistant’s sources','DAT-02',1,'safety','Use prepared files only; remove unnecessary sources.'],
 ['verified','Verify the venue request','VEN-01',2,'inbox','Call the contact from the saved directory.'],
 ['redacted','Prepare the financial summary','DAT-02',2,'documents','Apply redactions and save the prepared copy.'],
 ['guestBrief','Collect the anonymous guest brief','PLN-03',2,'office','Confirm the brief from the physical guest card.'],
 ['injection','Flag the supplier’s embedded instruction','PLN-03',3,'assistant','Use the quote facts; reject the disclosure request.'],
 ['planned','Calculate the wedding plan','PLN-03',3,'assistant','Requires venue, prepared summary, and guest brief.'],
 ['reviewed','Review sources and accommodations','REV-04',4,'assistant','Check the analyst’s plan and preserve guest needs.'],
 ['approved','Approve the final arrangements','REV-04',4,'budget','Requires independent review and the finance card.']
];
export const levelNames=['Scope sources','Collect evidence','Build the plan','Review & approve'];
export function taskStatus(task,state,level){return state[task[0]]?'Completed':task[3]>level?'Locked':'Ready'}
