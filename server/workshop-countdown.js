export const workshopDuration=50*60_000;

export function countdownView(timer,now=Date.now()){
 if(!timer)return null;
 // Base the deadline on the first join, including rooms from the earlier timer rollout.
 const deadline=timer.startedAt+workshopDuration;
 const remaining=Math.max(0,deadline-(timer.finishedAt??now));
 return {
  startedAt:timer.startedAt,remaining,
  status:timer.finishedAt?'complete':remaining?'running':'expired',
  inTime:timer.finishedAt?timer.finishedAt<deadline:null
 };
}
