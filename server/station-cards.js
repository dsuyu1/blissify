import {roleNames} from '../dist/workflow.js';

const encoder=new TextEncoder();
const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const importKey=secret=>crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const sign=async(key,version,room,role)=>new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(JSON.stringify([version,room,role]))));

function shortCode(signature){
 let code='';
 for(let i=0;i<50;i+=5){
  const offset=i>>3, shift=11-(i&7);
  code+=alphabet[((signature[offset]<<8|signature[offset+1])>>shift)&31];
 }
 return code;
}
const format=code=>code.slice(0,5)+'-'+code.slice(5);

export async function stationCards(secret,room){
 const key=await importKey(secret);
 return Object.fromEntries(await Promise.all(Object.keys(roleNames).map(async role=>[
  role,format(shortCode(await sign(key,'blissify-station-v2',room,role)))
 ])));
}

export async function stationRole(secret,room,input,matches){
 if(input.length>40)return null;
 const card=input.trim().toUpperCase();
 if(/^[A-Z]{3}-[0-9]{2}(?:-[0-9A-F]{5}){4}$/.test(card)){
  const role=card.slice(0,6);
  if(!Object.hasOwn(roleNames,role))return null;
  const signature=await sign(await importKey(secret),'blissify-station-v1',room,role);
  const code=Array.from(signature.slice(0,10),byte=>byte.toString(16).padStart(2,'0')).join('').toUpperCase();
  return await matches(card,role+'-'+code.match(/.{5}/g).join('-'))?role:null;
 }
 const normalized=card.replace(/[\s-]/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');
 if(!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(normalized))return null;
 const results=await Promise.all(Object.entries(await stationCards(secret,room)).map(async([role,expected])=>
  await matches(normalized,expected.replace('-',''))?role:null
 ));
 return results.filter(Boolean).length===1?results.find(Boolean):null;
}
