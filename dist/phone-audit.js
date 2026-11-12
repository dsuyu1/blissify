const form=document.querySelector('#audit-form');
const status=document.querySelector('#audit-status');
const feedback=document.querySelector('#audit-feedback');
const invite=location.hash.slice(1);
const headers={'X-Workshop-Client':'blissify-phone','X-Phone-Invite':invite,'Content-Type':'application/json'};
async function request(answer){
 const result=await fetch('/api/phone-audit',{headers,method:answer?'POST':'GET',...(answer?{body:JSON.stringify(answer)}:{})});
 const data=await result.json();
 if(!result.ok)throw Error(data.error||'Could not contact the workshop. Try again.');
 return data;
}
function complete(){
 form.hidden=true;
 status.hidden=true;
 const result=document.querySelector('#audit-complete');
 result.hidden=false;
 result.focus();
}
async function start(){
 if(!invite){status.textContent='Open the Planner on your Privacy station and scan the QR code with your phone.';return}
 try{
  const {scenario,completed}=await request();
  if(completed){complete();return}
  document.querySelector('#assignment').textContent=scenario.assignment;
  const events=document.querySelector('#audit-events');
  for(const event of scenario.events){
   const label=document.createElement('label'),input=document.createElement('input'),copy=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');
   input.type='radio';input.name='event';input.value=event.id;input.required=true;
   title.textContent=event.title;detail.textContent=event.detail;copy.append(title,detail);label.append(input,copy);events.append(label);
  }
  status.hidden=true;form.hidden=false;
 }catch(error){status.textContent=error.message}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const button=form.querySelector('button'),data=new FormData(form);
 button.disabled=true;feedback.textContent='Replaying with your permissions…';
 try{await request({event:data.get('event'),scope:data.get('scope'),send:data.has('send'),share:data.has('share')});complete()}
 catch(error){feedback.textContent=error.message}
 finally{button.disabled=false}
});
start();
