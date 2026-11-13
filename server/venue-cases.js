// Fictional role records. Never bundle this module with public assets.
export const roles = {
 'VEN-01':'Coordination', 'REV-04':'Finance', 'DAT-02':'Privacy', 'PLN-03':'Planning'
};

export const rounds = [
 {
  title:'Verify the payment request',
  tasks:{
   'VEN-01':{
    source:'Outlook · Vendor mailbox', title:'Payment change for Maya & Alex', reference:'MAIL-58',
    detail:'Two requests claim to be from Garden House Events. MAIL-41 is an older, routine receipt. MAIL-58 asks to redirect today’s $2,000 deposit to 7719 and skip the callback. Send the current message reference to Finance. Ask Finance which signed invoice is attached to the real booking.',
    field:'Signed invoice reference from Finance', answer:'GH-214', choices:[['hold','Hold the replacement account and use the saved callback'],['pay','Approve the urgent payment change']],
    decision:'hold', partner:'REV-04'
   },
   'REV-04':{
    source:'Printed contract · Signed venue agreement', title:'Approved venue payment', reference:'GH-214',
    detail:'GH-241 is the rehearsal dinner. GH-214 is Maya & Alex’s reception: $7,000 package, $2,000 deposit included, account ending 4821. Tell Coordination the signed invoice reference and verified suffix. Ask them for the active email reference to record against the decision.',
    field:'Active Outlook message reference from Coordination', answer:'MAIL-58', choices:[['retain','Retain 4821; the $2,000 deposit is included'],['change','Replace the payee with 7719'],['double','Add $2,000 to the package total']],
    decision:'retain', partner:'VEN-01'
   },
   'DAT-02':{
    source:'VowPilot activity · Export receipt', title:'A draft became an external forward', reference:'AUD-37',
    detail:'Audit AUD-37 shows VowPilot queued the full guest brief for the new payment thread. The approved assignment only allowed a draft for internal review. Share the audit reference with Planning. Ask Planning for the current reception booking so you contain the correct export.',
    field:'Current reception booking from Planning', answer:'WED-62', choices:[['stop','Stop the unauthorized export; keep normal reminders'],['stop-all','Pause every vendor reminder'],['allow','Let the full guest brief go through']],
    decision:'stop', partner:'PLN-03'
   },
   'PLN-03':{
    source:'Venue walkthrough · Captioned briefing', title:'Guest arrival briefing', reference:'WED-62',
    detail:'The current reception is WED-62. WED-26 is an older booking. The north entrance is the step-free route; keep it available. Give Privacy the current booking and ask for the audit reference to attach to the corrected vendor draft.',
    field:'Export audit reference from Privacy', answer:'AUD-37', choices:[['minimize','Keep north access and share aggregate guest needs only'],['full','Share the full guest roster'],['old','Use the old booking and entrance']],
    decision:'minimize', partner:'DAT-02'
   }
  }
 },
 {
  title:'Verify the fix held',
  tasks:{
   'VEN-01':{
    source:'Outlook · Trusted callback', title:'Garden House confirms the hold', reference:'CALL-27',
    detail:'The saved venue contact confirms the booking is held. Their callback receipt is CALL-27. Tell Finance the receipt so they can close the payment hold. Ask Planning which vendor packet you can send after the review.',
    field:'Reviewed packet reference from Planning', answer:'PACK-42', choices:[['saved','Use the saved venue contact and the reviewed packet'],['reply','Reply to the urgent replacement-account email']],
    decision:'saved', partner:'PLN-03'
   },
   'REV-04':{
    source:'Finance · Payment hold ledger', title:'The bank record stayed unchanged', reference:'HOLD-82',
    detail:'Ledger receipt HOLD-82 shows no payment went to 7719. The $2,000 deposit remains tied to the saved account. Tell Privacy which hold is safe to retain in the incident record. Ask Coordination for the independent callback receipt.',
    field:'Trusted callback receipt from Coordination', answer:'CALL-27', choices:[['confirm','Confirm the hold against the trusted callback'],['release','Release the hold against the urgent email']],
    decision:'confirm', partner:'VEN-01'
   },
   'DAT-02':{
    source:'VowPilot · Replay log', title:'The export stopped; the reminder ran', reference:'RUN-19',
    detail:'Replay RUN-19 confirms the external export stayed stopped and normal vendor reminders continued. Give Planning the replay receipt before they release the packet. Ask Finance for the payment hold receipt; only that receipt belongs in the incident record.',
    field:'Payment hold receipt from Finance', answer:'HOLD-82', choices:[['verify','Record the targeted containment and preserve reminders'],['mute','Disable all reminders to be safe']],
    decision:'verify', partner:'REV-04'
   },
   'PLN-03':{
    source:'SharePoint · Prepared vendor packet', title:'Review the correct packet', reference:'PACK-42',
    detail:'PACK-42 contains the north entrance route, aggregate meal accommodations, and no private guest notes. Tell Coordination which packet they may use. Ask Privacy for evidence the unauthorized export stayed stopped.',
    field:'Containment replay receipt from Privacy', answer:'RUN-19', choices:[['release','Release the reviewed, minimized packet'],['original','Release the original guest brief instead']],
    decision:'release', partner:'DAT-02'
   }
  }
 }
];
