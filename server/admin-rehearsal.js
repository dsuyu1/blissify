import {stationCards} from './station-cards.js';

const encoder=new TextEncoder();
const prefix='blissify:admin-rehearsal:v1:';
const key=secret=>crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');

export async function adminSession(secret,now=Date.now()){
 const payload=Math.floor(now/1000+8*3600)+'.'+crypto.randomUUID();
 const signed=await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(prefix+payload));
 return payload+'.'+hex(signed);
}

export async function validAdminSession(secret,token,now=Date.now()){
 const match=/^(\d{10}\.[0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(token);
 if(!match||Number(match[1].slice(0,10))*1000<=now)return false;
 const signature=Uint8Array.from(match[2].match(/../g),v=>parseInt(v,16));
 return crypto.subtle.verify('HMAC',await key(secret),signature,encoder.encode(prefix+match[1]));
}

export async function rehearsalRoom(secret,token){
 const room='test-'+crypto.randomUUID().replace(/-/g,'');
 return {room,token,cards:await stationCards(secret,room)};
}
