const SAMPLE='https://blissify-rehearsal.sharepoint.com/:b:/s/WeddingLab/sample-guest-brief-link';
export function normalizeSharePointLink(value){
 if(typeof value!=='string'||value.length>4096)return null;
 try{
  const url=new URL(value.trim());
  if(url.protocol!=='https:'||!url.hostname.endsWith('.sharepoint.com')||url.username||url.password||url.port||url.pathname==='/')return null;
  return url.href;
 }catch{return null}
}

export function expectedSharePointLink(room,configured){
 return /^test-[a-f0-9]{32}$/.test(room||'')?SAMPLE:normalizeSharePointLink(configured);
}
