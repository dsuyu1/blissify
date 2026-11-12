<#
.SYNOPSIS
Previews or sends the six fictional emails for the Blissify Outlook puzzle.
.EXAMPLE
.\Seed-BlissifyInbox.ps1 -To 'team01@yourlab.onmicrosoft.com'
.EXAMPLE
.\Seed-BlissifyInbox.ps1 -To 'team01@yourlab.onmicrosoft.com','team02@yourlab.onmicrosoft.com' -From 'vowpilot@yourlab.onmicrosoft.com' -Send
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string[]] $To,
    [string] $From,
    [switch] $Send
)
$ErrorActionPreference = 'Stop'
$recipients = @($To | ForEach-Object {
    $address = $_.Trim()
    if ($address -notmatch '^[^\s<>,;@]+@[^\s<>,;@]+\.[^\s<>,;@]+$') {
        throw "Provide a single mailbox address per entry: $address"
    }
    $address
} | Select-Object -Unique)
if ($recipients.Count -eq 0) { throw 'At least one workshop mailbox is required.' }

$messages = @(
    @{
        Subject = 'Weekend venue access and unloading'
        Body = 'The garden gate opens at 8:30 a.m. Vendor unloading is at the north entrance. The step-free route remains open for guests throughout the event.'
    }
    @{
        Subject = 'Cedar Table menu counts'
        Body = 'Please keep the two meal accommodations on the anonymous brief. We only need aggregate counts. There is no need to send the guest brief to outside vendors.'
    }
    @{
        Subject = 'VowPilot job assigned: Draft vendor update'
        Body = 'Prepare a draft from the approved wedding folder for Coordination to review. Leave sending to the coordinator. Do not export or distribute the guest brief.'
    }
    @{
        Subject = 'VowPilot delivery failed: Guest brief export'
        Body = @'
Job ID: VP-204
Intended recipient: partner-sync@external.example
Attachment named in the log: Anonymous guest brief.pdf
Status: Delivery failed. Automatic retry scheduled.

This receipt is a fictional workshop message. No guest brief was sent or attached to this receipt.
'@
    }
    @{
        Subject = 'VowPilot vendor reminder delivered'
        Body = @'
Job ID: VP-118
The scheduled arrival reminder for the venue team completed. Keep this reminder running through the rehearsal.
'@
    }
    @{
        Subject = 'Friday rehearsal checklist'
        Body = 'Confirm the loading entrance, check the rain plan, and have one person bring the signed venue agreement to the morning meeting. The current payment details remain in effect.'
    }
)

foreach ($address in $recipients) {
    foreach ($message in $messages) {
        Write-Host "$address <- $($message.Subject)"
    }
}
if (!$Send) {
    Write-Host 'Preview only. Run with -From and -Send to seed these inboxes.'
    return
}
if ([string]::IsNullOrWhiteSpace($From)) {
    throw 'Specify -From with the workshop sender sign-in address.'
}
if (!(Get-Module -ListAvailable -Name Microsoft.Graph.Authentication)) {
    throw 'Install the module first: Install-Module Microsoft.Graph.Authentication -Scope CurrentUser'
}
Import-Module Microsoft.Graph.Authentication
$connected = $false
try {
    Connect-MgGraph -Scopes 'Mail.Send' -ContextScope Process -NoWelcome | Out-Null
    $connected = $true
    $account = (Get-MgContext).Account
    if ($account -ine $From.Trim()) {
        throw "Signed in as $account. Expected $From. No mail was submitted."
    }
    foreach ($address in $recipients) {
        foreach ($item in $messages) {
            $payload = @{
                message = @{
                    subject = $item.Subject
                    body = @{ contentType = 'Text'; content = $item.Body }
                    toRecipients = @(@{ emailAddress = @{ address = $address } })
                }
            } | ConvertTo-Json -Depth 6 -Compress
            Invoke-MgGraphRequest -Method POST -Uri 'https://graph.microsoft.com/v1.0/me/sendMail' -Body $payload -ContentType 'application/json' | Out-Null
            Write-Host "Submitted to $address : $($item.Subject)"
        }
    }
    Write-Host 'Check Outlook for delivery. Rerunning with -Send submits a new copy.'
}
finally {
    if ($connected) { Disconnect-MgGraph | Out-Null }
}
