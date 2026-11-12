# Stop the email that keeps coming back

Use a dedicated fictional workshop mailbox. Seed it with the Linux or PowerShell script below, or send the messages by hand. The only required message is the delivery receipt; the other messages give the inbox a realistic background. Use an authorized test sender, and keep the fictional recipients in the message text only. The QR in each Outlook puzzle opens Outlook on the web and does not carry credentials. Put the workshop mailbox credentials in the physical safe and use the physical puzzle to provide its combination.

In a shared room, Coordination opens the task from Planner. Admin rehearsal includes a sample receipt so you can run the puzzle without Outlook. None of the actions in the game send email. There is no new dependency on the existing wedding puzzles.

## Seed from Linux

Download [seed-blissify-inbox.py](../scripts/seed-blissify-inbox.py). It runs on Python 3 without additional packages.

```bash
python3 seed-blissify-inbox.py --to team01@yourlab.onmicrosoft.com
```

To send, use a single-tenant Entra app registration in the workshop tenant. In **Authentication**, enable **Allow public client flows**. In **API permissions**, add Microsoft Graph **delegated** permissions **User.Read** and **Mail.Send**. Consent may require an administrator depending on tenant policy. No client secret is needed. Copy the application (client) and directory (tenant) IDs from Overview.

```bash
python3 seed-blissify-inbox.py --send \
  --tenant-id '<directory-tenant-id>' --client-id '<application-client-id>' \
  --from vowpilot@yourlab.onmicrosoft.com \
  --to team01@yourlab.onmicrosoft.com team02@yourlab.onmicrosoft.com
```

Replace the sample addresses and IDs, then follow the Microsoft sign-in instructions printed in the terminal. The script verifies the signed-in account and submits each message separately. Rerunning sends duplicates.

## Seed with Microsoft Graph PowerShell

Download [Seed-BlissifyInbox.ps1](../scripts/Seed-BlissifyInbox.ps1) and open PowerShell in that folder. Use only fictional workshop mailboxes.

```powershell
# Preview the six messages per recipient; no sign-in or email is sent.
.\Seed-BlissifyInbox.ps1 -To 'team01@yourlab.onmicrosoft.com'

# One-time module installation, then sign in as the workshop sender.
Install-Module Microsoft.Graph.Authentication -Scope CurrentUser
.\Seed-BlissifyInbox.ps1 -To 'team01@yourlab.onmicrosoft.com','team02@yourlab.onmicrosoft.com' -From 'vowpilot@yourlab.onmicrosoft.com' -Send
```

Replace the sample addresses with real workshop mailbox addresses. The signed-in account must match `-From`. The script requests delegated `Mail.Send` and uses the signed-in mailbox. Your tenant may require admin consent. The fictional external address appears only in the body of the receipt. Start with one inbox and check delivery before seeding the others. Rerunning sends duplicates.

## Suggested inbox seed

**Subject: Weekend venue access and unloading**

The garden gate opens at 8:30 a.m. Vendor unloading is at the north entrance. The step-free route remains open for guests throughout the event.

**Subject: Cedar Table menu counts**

Please keep the two meal accommodations on the anonymous brief. We only need aggregate counts. There is no need to send the guest brief to outside vendors.

**Subject: VowPilot job assigned: Draft vendor update**

Prepare a draft from the approved wedding folder for Coordination to review. Leave sending to the coordinator. Do not export or distribute the guest brief.

**Subject: VowPilot delivery failed: Guest brief export**

Job ID: VP-204  
Recipient: partner-sync@external.example  
Attachment: Anonymous guest brief.pdf  
Status: Delivery failed. Automatic retry scheduled.

This receipt is a fictional workshop message. No guest brief was sent or attached to this receipt.

**Subject: VowPilot vendor reminder delivered**

Job ID: VP-118  
The scheduled arrival reminder for the venue team completed. Keep this reminder running through the rehearsal.

**Subject: Friday rehearsal checklist**

Confirm the loading entrance, check the rain plan, and have one person bring the signed venue agreement to the morning meeting. The current payment details remain in effect.

## Facilitator test

Enter VP-204, cancel the queued email, and advance to the next retry. The AI recreates the message. Pause only the failed guest brief export retry. A correct replay blocks the retry and preserves the normal reminder, awarding one milestone.

## Add the two AI trial phishing messages

Use the updated Linux seeder. The phishing batch sends only the trial offer and forged recap; the original six are a separate batch.

```bash
python3 seed-blissify-inbox.py --batch phishing --to team01@yourlab.onmicrosoft.com
python3 seed-blissify-inbox.py --batch phishing --send \
  --tenant-id '<directory-tenant-id>' --client-id '<application-client-id>' \
  --from vowpilot@yourlab.onmicrosoft.com --to team01@yourlab.onmicrosoft.com
```

Coordination opens **Report the AI trial phishing attempt** from Planner. The two emails share trial reference **MN-307**. Players use it to open the simulated forward, report the false approval, discard the forward, and rebuild a draft for the saved venue contact with only the approved vendor update. Admin rehearsal has sample emails. No forwarding or Outlook reporting happens from Blissify.
