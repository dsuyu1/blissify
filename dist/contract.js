export const contractReference='VENUE-4821';
export const canOpenContract=code=>String(code||'').trim().toUpperCase()===contractReference;
export function validContractSignature(e){
 if(!e||!canOpenContract(e.reference)||String(e.name||'').trim().length<2||e.name.length>80||Number(e.deposit)!==2000||e.account!=='4821')return false;
 if(e.method==='typed')return e.typedConsent===true&&String(e.typedName||'').trim()===e.name.trim();
 if(e.method!=='drawn'||!Array.isArray(e.strokes)||e.strokes.length>60)return false;
 const points=e.strokes.flat();if(points.length<8||points.length>1200||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>600||p.y<0||p.y>180))return false;
 return Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))>25&&Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))>8;
}
export function signaturePaths(strokes=[]){return strokes.map(points=>points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' '))}
export function reconcileContractProgress(state){return state.financeReady&&!validContractSignature(state.contractCoSign)?{...state,financeReady:false,planned:false,reviewed:false,approved:false}:state}
