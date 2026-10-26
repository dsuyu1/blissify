export const documentFields = [
  {id:'client',label:'Account holder',value:'Maya Rivera',sensitive:true},
  {id:'account',label:'Account number',value:'0000 1234 5678',sensitive:true},
  {id:'email',label:'Client contact',value:'maya@example.invalid',sensitive:true},
  {id:'clientId',label:'Internal client ID',value:'BR-204',sensitive:true},
  {id:'guest',label:'Guest note',value:'Guest G-12 · named client record · individual health and dietary details',sensitive:true},
  {id:'budget',label:'Approved wedding budget',value:'$20,000'},
  {id:'venue',label:'Venue package',value:'$7,000'},
  {id:'photo',label:'Photography',value:'$2,000'},
  {id:'music',label:'Music',value:'$1,000'},
  {id:'cake',label:'Cake',value:'$600'},
  {id:'decor',label:'Decorations',value:'$1,400'}
];
export function sanitizedFields(applied){const hidden=new Set(applied);return documentFields.filter(f=>!hidden.has(f.id)).map(({id,label,value})=>({id,label,value}));}
export function checkRedaction(marked,applied){
 if(marked.length!==applied.length||marked.some(id=>!applied.includes(id)))return {ok:false,message:'Marked areas are not applied yet. Apply redactions before sharing.'};
 const visible=sanitizedFields(applied);
 if(documentFields.some(f=>f.sensitive&&visible.some(v=>v.id===f.id)))return {ok:false,message:'The copy still contains unnecessary identifiers or individual guest information. Review the policy and remove those fields.'};
 if(documentFields.some(f=>!f.sensitive&&!visible.some(v=>v.id===f.id)))return {ok:false,message:'The assistant needs the budget and expense totals. Start a new copy and keep those figures readable.'};
 return {ok:true,message:'Approved: only the budget and relevant expense totals remain.'};
}
