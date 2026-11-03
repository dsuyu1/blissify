import {sanitizedFields,checkRedaction} from './redaction.js';
export const reviewKeys={guestConfirmed:'guestReview',venueConfirmed:'venueReview',privacyConfirmed:'privacyReview',sourcesConfirmed:'sourcesReview'};
export const reviewOwners={guestReview:'VEN-01',venueReview:'DAT-02',privacyReview:'PLN-03',sourcesReview:'REV-04'};
const normalize=value=>String(value||'').toLowerCase().replace(/[\s,$]/g,'');
export function buildPeerReview(id,state){
 let title,owner,rows;
 if(id==='guestConfirmed'&&state.guestBrief){title='Saved anonymous guest brief';owner='Planning';rows=[['guests','Guests','80','75'],['access','Step-free access','Required','Not required'],['meals','Meal accommodations','Required','Not required']]}
 if(id==='venueConfirmed'&&state.verified){title='Saved independent venue callback';owner='Coordination';rows=[['account','Verified account ending','4821','7719'],['method','Verification method','Saved vendor contact','Incoming caller number'],['change','Account change authorized','No','Yes']]}
 if(id==='privacyConfirmed'&&state.redacted&&checkRedaction(state.documentEdits?.marked||[],state.documentEdits?.applied||[]).ok){title='Saved prepared financial summary';owner='Privacy';rows=sanitizedFields(state.documentEdits.applied).map(f=>[f.id,f.label,f.value,'$'+(Number(f.value.replace(/[^0-9.]/g,''))+500).toLocaleString('en-US')]);rows.push(['identifiers','Client identifiers','Excluded','Included'])}
 if(id==='sourcesConfirmed'&&state.safetyReady){title='Saved assistant source settings';owner='Privacy';rows=[['work','Work-data grounding',state.aiSettings?.work?'On':'Off',state.aiSettings?.work?'Off':'On'],['web','Web search',state.aiSettings?.web?'On':'Off',state.aiSettings?.web?'Off':'On'],['scope','Task source scope','Prepared files only','Web and work data']]}
 if(!rows)return null;
 const fingerprint=JSON.stringify(rows.map(r=>r.slice(0,3)));let hash=0;for(const c of fingerprint)hash=(hash*31+c.charCodeAt(0))>>>0;const index=hash%rows.length;
 return {title,owner,fingerprint,rows:rows.map(([id,label,value,wrong],i)=>({id,label,value,draft:i===index?wrong:value})),wrongField:rows[index][0],correction:rows[index][2]};
}
export function checkPeerReview(id,evidence,state){const review=buildPeerReview(id,state);if(!review)return {ok:false,message:'Wait for your colleague to save their evidence first.'};if(evidence?.fingerprint!==review.fingerprint)return {ok:false,message:'The source evidence changed. Compare the latest saved record again.'};if(evidence.field!==review.wrongField)return {ok:false,message:'That row matches the saved record. Compare each field and select the discrepancy.'};if(normalize(evidence.correction)!==normalize(review.correction))return {ok:false,message:'The correction does not match the saved source. Read the verified value and try again.'};return {ok:true,message:'Discrepancy corrected and peer review saved.'}}
export function reconcilePeerProgress(state){let next=state;for(const [id,key] of Object.entries(reviewKeys)){if(state[id]&&!checkPeerReview(id,state[key],state).ok){if(next===state)next={...state};next[id]=false;next.planned=false;next.reviewed=false;next.approved=false}}return next}
