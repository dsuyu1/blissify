export const retryJob='VP-204';
export const matchesRetryJob=value=>typeof value==='string'&&value.trim().toUpperCase()===retryJob;

export function replayRetry(e){
 const retryBlocked=e?.retryPaused===true;
 const reminderRuns=e?.remindersPaused===false;
 return {retryBlocked,reminderRuns,ok:retryBlocked&&reminderRuns};
}

export function checkRetryEvidence(e){
 return matchesRetryJob(e?.job)&&e.observedRetry===true&&replayRetry(e).ok;
}
