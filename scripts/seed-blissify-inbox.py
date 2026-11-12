#!/usr/bin/env python3
"""Preview or seed the fictional Blissify Outlook inboxes."""

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

MESSAGES = [('Weekend venue access and unloading',
  'The garden gate opens at 8:30 a.m. Vendor unloading is at the north entrance. The step-free '
  'route remains open for guests throughout the event.'),
 ('Cedar Table menu counts',
  'Please keep the two meal accommodations on the anonymous brief. We only need aggregate '
  'counts. There is no need to send the guest brief to outside vendors.'),
 ('VowPilot job assigned: Draft vendor update',
  'Prepare a draft from the approved wedding folder for Coordination to review. Leave sending '
  'to the coordinator. Do not export or distribute the guest brief.'),
 ('VowPilot delivery failed: Guest brief export',
  'Job ID: VP-204\n'
  'Recipient: partner-sync@external.example\n'
  'Attachment: Anonymous guest brief.pdf\n'
  'Status: Delivery failed. Automatic retry scheduled.\n'
  '\n'
  'This receipt is a fictional workshop message. No guest brief was sent or attached to this '
  'receipt.'),
 ('VowPilot vendor reminder delivered',
  'Job ID: VP-118\n'
  'The scheduled arrival reminder for the venue team completed. Keep this reminder running '
  'through the rehearsal.'),
 ('Friday rehearsal checklist',
  'Confirm the loading entrance, check the rain plan, and have one person bring the signed '
  'venue agreement to the morning meeting. The current payment details remain in effect.')]

GRAPH = "https://graph.microsoft.com/v1.0"
SCOPES = "https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Send"


class RequestError(RuntimeError):
    def __init__(self, status, data):
        self.status = status
        error = data.get("error", "request_failed")
        self.code = error.get("code") if isinstance(error, dict) else error
        description = error.get("message") if isinstance(error, dict) else data.get("error_description")
        super().__init__(f"HTTP {status}: {description or self.code}")


def request(url, *, form=None, payload=None, token=None):
    headers = {"Accept": "application/json"}
    body = None
    if form is not None:
        body = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if payload is not None:
        body = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    try:
        with urllib.request.urlopen(urllib.request.Request(url, body, headers), timeout=30) as res:
            raw = res.read()
            return res.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        try:
            error = json.load(exc)
        except (ValueError, UnicodeError):
            error = {}
        raise RequestError(exc.code, error) from None


def login(tenant, client):
    base = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0"
    _, challenge = request(base + "/devicecode", form={"client_id": client, "scope": SCOPES})
    print(challenge["message"], flush=True)
    deadline = time.monotonic() + int(challenge["expires_in"])
    interval = max(1, int(challenge.get("interval", 5)))
    while deadline - time.monotonic() >= interval:
        time.sleep(interval)
        try:
            _, token = request(base + "/token", form={
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "client_id": client,
                "device_code": challenge["device_code"],
            })
            return token["access_token"]
        except RequestError as exc:
            if exc.code == "slow_down":
                interval += 5
            elif exc.code != "authorization_pending":
                raise
    raise RuntimeError("Sign-in code expired. Run the command again.")


def address(value):
    if not re.fullmatch(r"[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+", value):
        raise argparse.ArgumentTypeError(f"Expected one mailbox address: {value}")
    return value.lower()


def guid(value):
    try:
        return str(uuid.UUID(value))
    except ValueError:
        raise argparse.ArgumentTypeError("Expected an Entra ID GUID") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--to", required=True, nargs="+", type=address, metavar="MAILBOX")
    parser.add_argument("--from", dest="sender", type=address, help="expected sender sign-in address")
    parser.add_argument("--tenant-id", type=guid, help="Microsoft Entra directory (tenant) ID")
    parser.add_argument("--client-id", type=guid, help="Entra application (client) ID")
    parser.add_argument("--send", action="store_true", help="send the displayed batch")
    args = parser.parse_args()
    recipients = list(dict.fromkeys(args.to))
    for recipient in recipients:
        for subject, _ in MESSAGES:
            print(f"{recipient} <- {subject}")
    if not args.send:
        print(f"Preview only: {len(recipients) * len(MESSAGES)} messages; no sign-in or email.")
        return 0
    if not all((args.sender, args.tenant_id, args.client_id)):
        parser.error("--send requires --from, --tenant-id, and --client-id")

    submitted = 0
    try:
        token = login(args.tenant_id, args.client_id)
        _, profile = request(GRAPH + "/me?$select=userPrincipalName", token=token)
        actual = profile.get("userPrincipalName", "")
        if actual.casefold() != args.sender.casefold():
            raise RuntimeError(f"Signed in as {actual or 'an unknown account'}, expected {args.sender}.")
        for recipient in recipients:
            for subject, content in MESSAGES:
                status, _ = request(GRAPH + "/me/sendMail", token=token, payload={
                    "message": {
                        "subject": subject,
                        "body": {"contentType": "Text", "content": content},
                        "toRecipients": [{"emailAddress": {"address": recipient}}],
                    },
                    "saveToSentItems": True,
                })
                if status != 202:
                    raise RuntimeError(f"Unexpected response from Graph: HTTP {status}")
                submitted += 1
                print(f"Submitted to {recipient}: {subject}", flush=True)
    except (RuntimeError, urllib.error.URLError, TimeoutError, KeyboardInterrupt, KeyError, ValueError) as exc:
        print(f"Stopped after {submitted} accepted messages: {exc}", file=sys.stderr)
        if submitted:
            print("Check Sent Items before rerunning to avoid duplicates.", file=sys.stderr)
        return 1
    print(f"{submitted} messages accepted by Graph. Check Outlook for delivery.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
