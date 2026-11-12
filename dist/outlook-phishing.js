export const trialReference='MN-307';
export const trialReportReason='unverified-approval';
export const matchesTrialReference=value=>typeof value==='string'&&value.trim().toUpperCase()===trialReference;

export function checkTrialHandoff(e){
 if(!matchesTrialReference(e?.reference))return 'Find the trial reference in Outlook.';
 if(e.reason!==trialReportReason)return 'Report the unsupported approval and request to forward the entire thread.';
 if(e.discarded!==true)return 'Discard the prepared forward before building the vendor update.';
 if(e.recipient!=='saved-venue')return 'Use the venue contact saved in Blissify, not the trial address.';
 if(!Array.isArray(e.files)||e.files.length!==1||e.files[0]!=='vendor-update')return 'The venue only needs the approved vendor update. Leave internal records out.';
 return '';
}
