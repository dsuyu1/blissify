export function validSupportReport(r){return r?.reason==='confidential'&&r?.provider==='unverified'&&r?.action==='declined'}
export function reconcileSupportProgress(s){return s.supportReported&&(!s.approved||!validSupportReport(s.supportReport))?{...s,supportReported:false}:s}
