import {taskReason,actionTasks,roleName} from './workflow.js';
export const roles=[
 {id:'VEN-01',name:'Coordination',task:'Verify the venue independently, then cross-check the planning team’s guest brief.',page:'inbox'},
 {id:'DAT-02',name:'Privacy',task:'Prepare the records and AI settings while the vendor verifies; then cross-check their account evidence.',page:'documents'},
 {id:'PLN-03',name:'Planning',task:'Collect the guest brief and inspect supplier instructions; then cross-check the prepared copy and calculate.',page:'assistant'},
 {id:'REV-04',name:'Finance',task:'Check the contract and deposit independently, cross-check source settings, then review and approve the plan.',page:'handoffs'}
];
export function taskBlock(action,state){
 if(action.startsWith('confirm-')&&action!=='confirm-input')return taskReason(action.slice(8),state);
 if(actionTasks[action])return taskReason(actionTasks[action],state);
 const role=action.startsWith('attach-')||['suggest-plan','new-chat','remove-attachment','preview-input','confirm-input','close-input'].includes(action)?'PLN-03':['report-message','send-report','mark-good','bank'].includes(action)?'VEN-01':null;
 return role&&role!==state.activeRole?`You do not have permission to access this task. Assigned to ${roleName(role)}.`:'';
}
