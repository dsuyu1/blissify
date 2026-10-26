import { documentFields, sanitizedFields, checkRedaction } from './redaction.js';
export const quote={guests:80,pricePerGuest:40,servicePercent:20,stepFree:true,mealAccommodations:true};
export function preparePlanningInput(edits,attachments){
 const checked=checkRedaction(edits?.marked||[],edits?.applied||[]);
 if(!attachments.includes('summary'))return {ok:false,message:'Attach the prepared financial summary using Add attachments.'};
 if(!checked.ok)return {ok:false,message:checked.message};
 if(!attachments.includes('quote'))return {ok:false,message:'Please attach the catering quote so I can include its service charge.'};
 if(!attachments.includes('requirements'))return {ok:false,message:'Please attach the anonymous guest requirements so I can preserve access and meal needs.'};
 const fields=sanitizedFields(edits.applied);
 // Build from an explicit allowlist; no original client field values enter the planning envelope.
 const costs=Object.fromEntries(fields.filter(f=>documentFields.some(d=>d.id===f.id&&!d.sensitive)).map(f=>[f.id,Number(f.value.replace(/[^0-9.]/g,''))]));
 if(Object.values(costs).some(n=>!Number.isFinite(n)))return {ok:false,message:'The summary has an invalid amount. Review the prepared document.'};
 return {ok:true,input:{costs,quote:{...quote},requirements:{guestCount:80,stepFree:true,mealAccommodations:true}}};
}
export function calculatePlan(input){
 const base=input.requirements.guestCount*input.quote.pricePerGuest;
 const fee=base*input.quote.servicePercent/100;
 const fixed=['venue','photo','music','cake','decor'].reduce((sum,id)=>sum+input.costs[id],0);
 const total=fixed+base+fee;
 return {base,fee,catering:base+fee,total,reserve:input.costs.budget-total,overBudget:total>input.costs.budget};
}
export function formatPlan(input,result){return `I used the prepared financial summary, Cedar Table quote, and anonymous guest requirements.\n\nCatering: ${input.requirements.guestCount} guests × $${input.quote.pricePerGuest} = $${result.base.toLocaleString('en-US')}\nService charge: ${input.quote.servicePercent}% = $${result.fee.toLocaleString('en-US')}\nCatering total: $${result.catering.toLocaleString('en-US')} [Catering quote]\n\nVenue: $${input.costs.venue.toLocaleString('en-US')}\nPhotography: $${input.costs.photo.toLocaleString('en-US')}\nMusic: $${input.costs.music.toLocaleString('en-US')}\nCake: $${input.costs.cake.toLocaleString('en-US')}\nDecorations: $${input.costs.decor.toLocaleString('en-US')} [Prepared summary]\n\nWedding total: $${result.total.toLocaleString('en-US')}\nBudget remaining: $${result.reserve.toLocaleString('en-US')} [Prepared summary + Catering quote]\n\nKeep step-free access and all meal accommodations. The $2,000 venue deposit is included in the venue package, not an additional expense; verify that against the signed contract. [Guest requirements + venue contract]\n\nThe quote contains an unrelated instruction requesting an unredacted statement. It is not needed for these calculations. I did not follow it.\n\nReview the quoted price and service charge, then confirm the plan before final approval.`;}
