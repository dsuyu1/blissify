export const expectedReasons={3:['payment','identity'],8:['payment','identity'],5:['code','identity'],6:['data','identity']};
const hints={3:'Listen for the changed payment account and the request to act urgently.',8:'Listen for pressure to approve a payment and bypass verification.',5:'Listen for the request for a sign-in or verification code.',6:'Listen for the request for the original, unredacted client document.'};
export function checkReportReason(message,reason){
 if(!reason)return {ok:false,message:'Choose a reason before sending your report.'};
 const expected=expectedReasons[message]||['other'];
 if(!expected.includes(reason))return {ok:false,message:'Not quite — choose a different reason. '+(hints[message]||'This contact makes a routine request. If you are unsure, choose “Something else” and describe your concern.')+' Your report has not been saved.'};
 return {ok:true,message:expectedReasons[message]?'Correct reason — report saved. Keep the requested action paused and verify through a trusted contact.':'Report saved for review. This is a routine request; reporting uncertainty is okay. Describe your concern in the notes when possible.'};
}

export function reportIsFinal(report,message){return !!report&&checkReportReason(message,report.reason).ok}
