const encoder=new TextEncoder();
const key=secret=>crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
const domain='blissify:phone-audit:v1:';
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));

export async function issuePhoneInvite(secret,room,now=Date.now()){
 const expires=Math.floor(now/1000)+900;
 const payload=room+'.'+expires;
 const sig=await crypto.subtle.sign('HMAC',await key(secret),encoder.encode(domain+payload));
 return {token:payload+'.'+encode(sig),expires:expires*1000};
}

export async function readPhoneInvite(secret,token,now=Date.now()){
 const match=/^([a-zA-Z0-9-]{1,40})\.(\d{10})\.([a-zA-Z0-9_-]{43})$/.exec(token);
 if(!match||Number(match[2])*1000<=now)return null;
 const valid=await crypto.subtle.verify('HMAC',await key(secret),decode(match[3]),encoder.encode(domain+match[1]+'.'+match[2]));
 return valid?match[1]:null;
}

export const isMobileAgent=value=>/Android|iPhone|iPad|iPod|Mobile/i.test(value||'');
