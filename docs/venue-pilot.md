# Secure the venue playtest

Use a new room ID at `/venue-pilot.html?host`. This pilot uses the existing facilitator code and issues its own four station codes. Existing escape-room cards and progress do not carry over. Give one code per player. Open the same player sign-in URL on four separate devices or browser profiles. Start the default 12-minute clock once everyone has joined.

The win is to verify the legitimate deposit, stop the unauthorized export, and release a safe vendor packet. The first round splits evidence between Coordination and Finance, and between Privacy and Planning. The second round changes the handoff chain; all four stations must verify both rounds. Players can talk, type, or use an accessible equivalent to exchange their findings. Encourage them to say what the record proves as well as reading the reference. Do not project the facilitator’s station cards.

An explicit incorrect commit costs the team 30 seconds. After two incorrect commits in the same round, the station’s designated evidence partner must reopen the decision. Incomplete forms, unavailable actions, and failed connections cost no time. If the clock expires, select **Continue in debrief**; the outcome records that the team finished in debrief even if they later solve every decision.

## Run the pilot locally

Install the project dependencies with `npm ci`. In the worktree, create a local-only `.dev.vars` containing a `WORKSHOP_ACCESS_CODE` of at least 12 characters, then run `npm run dev`. Open `http://localhost:8787/venue-pilot.html?host` and use that code to create a room. Do not reuse the production facilitator code locally. For a same-computer playtest, use four independent tabs or browser profiles and keep the facilitator controls in a fifth tab.

## Microsoft 365 mode

The first round can use role-specific Microsoft 365 links. The second round uses built-in follow-up evidence in this pilot. Microsoft 365 sign-in and access control are handled by your tenant. Use fictional data, separate role access, and verify the links on each test account before the session. Do not share link tokens that bypass role access.

Set these four Worker variables before selecting **Microsoft 365 evidence links**. Create the evidence in your tenant first; the app does not upload content or send email.

| Variable | Facilitator preparation |
| --- | --- |
| `VENUE_COORDINATION_URL` | Outlook mailbox. Seed a routine receipt MAIL-41 and an urgent MAIL-58 message: redirect today’s $2,000 deposit to 7719 and skip the callback. Include the message references. |
| `VENUE_FINANCE_URL` | SharePoint library with a signed reception invoice GH-214 and a rehearsal dinner invoice GH-241. GH-214 is Maya and Alex’s $7,000 reception package; $2,000 deposit included; account ends 4821. |
| `VENUE_PRIVACY_URL` | Role-restricted SharePoint audit or short captioned recording. AUD-37 shows the assistant queued the full guest brief for an external forward when its assignment only allowed a draft for internal review. |
| `VENUE_PLANNING_URL` | Role-restricted venue walkthrough in SharePoint, with captions or transcript. WED-62 is the current reception, WED-26 is old, and the north entrance is step-free. |

To play immediately without tenant setup, select **Built-in evidence**. The same facts and decisions appear on each assigned station, without requiring Microsoft accounts.

## Watch during the first playtest

- Did each role get a reference from the right person? Did they explain what it proved, or only read a code?
- Where did someone wait after committing? Were they available to help another station?
- Did anyone reach for the wrong payment record or suppress legitimate work?
- Did the team understand what it had accomplished when the venue was secured?

The three-act redesign is still planned. This pilot tests the shared clock and four-role handoff before adding the full SharePoint containment and wedding release sequence.
