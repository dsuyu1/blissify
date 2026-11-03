import {tasks,taskReason} from './workflow.js';
export const planTasks=tasks.map(t=>[t.id,t.title,t.role,t.deps.length,t.page,t.note]);
export const levelNames=['Prepare in parallel','Cross-check handoffs','Build the plan','Review & approve'];
export function taskStatus(task,state){return taskReason(task[0],state)?task[2]!==state.activeRole?'No permission':'Waiting':state[task[0]]?'Completed':'Ready'}
