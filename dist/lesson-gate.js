export const LESSON_VIEW_MS=15000;
export function advanceLesson(progress,elapsed,visible){return {...progress,elapsed:Math.min(LESSON_VIEW_MS,(progress.elapsed||0)+(visible?Math.max(0,Math.min(elapsed,1000)):0))}}
export function canAcknowledge(progress){return (progress.elapsed||0)>=LESSON_VIEW_MS}
export function acknowledgeLesson(progress){return canAcknowledge(progress)?{...progress,acknowledged:true}:progress}
