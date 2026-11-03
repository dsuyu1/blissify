import {tasks,roleName} from './workflow.js';
export const helpTemplates=[
 ['next','What can I work on now?','Show my available workshop tasks.'],
 ['role','Explain my role','What am I responsible for in this escape room?'],
 ['injection','Explain prompt injection','How can a supplier document try to manipulate an AI?'],
 ['privacy','Help me use AI safely','What information should I avoid sharing with the assistant?'],
 ['hint','Help me with a puzzle','How do I unlock a hint for my current task?'],
 ['plan','Calculate the wedding budget','Calculate the total wedding budget using the prepared files.']
];
export function workshopHelp(prompt,state){
 const text=prompt.toLowerCase();
 if(/calculat|total wedding|build.*plan|budget total/.test(text))return null;
 if(/hint|stuck|puzzle/.test(text))return 'Open the mascot’s Task guide on your task page. Read the AI security lesson, wait for the progress bar, then choose Acknowledge to unlock that task’s hint. I can explain the workshop, but I won’t skip that learning step or reveal prop codes.';
 if(/role|responsib|escape room/.test(text))return `Your role is ${roleName(state.activeRole)}. Your tasks are: ${tasks.filter(t=>t.role===state.activeRole).map(t=>t.title).join('; ')}. Use the Planner to see what is ready. Colleagues complete their own tasks and pass evidence to you.`;
 if(/inject|manipulat|supplier|instruction/.test(text))return 'Prompt injection happens when an untrusted document or message tries to give the AI instructions instead of providing facts. Treat external content as evidence, keep company rules in control, and inspect the source before using its data. The task guide explains why your specific check matters.';
 if(/privacy|safe|sharing|information|redact|confidential/.test(text))return 'Use only the prepared totals, quote facts and anonymous guest requirements needed for the task. Keep identifiers, full account details and personal guest records out of AI input. Inspect source instructions, limit connected sources, and review the input before sending a calculation.';
 const ready=tasks.filter(t=>t.role===state.activeRole&&!state[t.id]&&t.deps.every(id=>state[id]));
 const pending=tasks.filter(t=>t.role===state.activeRole&&!state[t.id]);
 return ready.length?'You can work on: '+ready.map(t=>t.title).join('; ')+'. Open these from your Planner. For puzzle-specific help, read and acknowledge the task’s AI lesson to unlock its hint.':pending.length?'Your remaining tasks need teammate handoffs. Open the Planner’s waiting information to see the unfinished dependencies. You can review source documents and read the task lessons while the team works.':'Your assigned tasks are complete. Check team progress and support your colleagues with the evidence you prepared.';
}
