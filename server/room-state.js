export const sharedKeys=['guestBrief','plannedBy','chatMessages','chatAttachments','documentEdits','reports','declinedDocuments','verified','redacted','injection','planned','reviewed','approved','incidents','reply','competitorDecision','safetyReady','aiSettings'];
export function mergeRoom(current,patch,baseRevision){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Invalid patch');
 const keys=Object.keys(patch);if(keys.some(k=>!sharedKeys.includes(k)))throw Error('Unknown field');
 if(keys.some(k=>(current.clocks[k]||0)>baseRevision))return null;
 const revision=current.revision+1;
 return {revision,data:{...current.data,...patch},clocks:{...current.clocks,...Object.fromEntries(keys.map(k=>[k,revision]))}};
}
