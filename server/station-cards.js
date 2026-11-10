import {roleNames} from '../dist/workflow.js';

const encoder = new TextEncoder();

export async function stationCards(secret, room) {
 const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
 return Object.fromEntries(await Promise.all(Object.keys(roleNames).map(async role => {
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(['blissify-station-v1', room, role])));
  const code = Array.from(new Uint8Array(signature).slice(0, 10), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return [role, role + '-' + code.match(/.{5}/g).join('-')];
 })));
}
