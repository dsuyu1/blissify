# Live Gemini planning assistant

## Enable on Cloudflare
The existing `blissify` Worker now has a server entry point and static assets in `wrangler.jsonc`. Deploy the repository root with `npm ci` and `npm run deploy` (or use the connected Workers Git build). Do not deploy only `dist`: a static host cannot keep an API key secret or run this endpoint.

In Cloudflare, open Workers & Pages → blissify → Settings → Variables and Secrets. Add these as **Secrets**, not plain text variables:

- `GEMINI_API_KEY`: your Google AI Studio API key.
- `WORKSHOP_ACCESS_CODE`: a random shared code at least 12 characters long. Give it to the facilitator, not in the repository or printed puzzle answers.

Keep the Gemini key out of browser code, GitHub, chat messages, and screenshots. `GEMINI_MODEL` is a non-secret server variable; the configured default is `gemini-3.8-flash`. Change it to a supported model available to your key if necessary. Redeploy after configuration changes.

On each workshop laptop open Rehearsal controls, enter the shared workshop code, and select **Enable Gemini on this laptop**. The code stays in page memory; reloading returns to local rehearsal. Participants need no Google or LiteFoundry account. Live mode tells them their messages and minimized workshop data go to Gemini.

## Agent instructions
Edit `server/planner-prompt.js`. The Worker supplies `SYSTEM_INSTRUCTION` as Gemini's `systemInstruction` on **every** request, with bounded recent conversation and the current minimized document data. Updating the file and deploying changes the agent's behavior. Increment `PROMPT_VERSION` when changing the instructions.

The agent does useful planning, explains calculations with sources, asks for missing information, preserves accommodations, treats supplier instructions as untrusted, and leaves payments and final approval to people. It is not a general purpose agent and has no bank, browser, payment, or game-state tools.

## Enforcement outside the prompt
The endpoint requires a same-origin POST, shared workshop code, and Cloudflare rate limiter (10 requests/minute/IP/location). The code is a workshop gate, not individual identity or a replacement for Cloudflare Access. Rate limiting is approximate and is not a hard spending cap; set provider quotas for your workshop and rotate the code between sessions.

The server reconstructs the canonical fictional document from allowlisted field identifiers and rejects unredacted, partially applied, or over-redacted copies. It ignores submitted amounts or extra data. The calculator supplies baseline totals independent of Gemini. Obvious private identifiers in prompts/history are rejected; this is not comprehensive DLP. Only fictional workshop material belongs in this pilot. Review free-text messages before sending.

Provider errors, blocked responses, timeouts and truncated outputs are shown as errors, never silently replaced with a successful live answer. Select local rehearsal explicitly when offline. Model outputs are escaped as text and cannot mark puzzles complete or execute actions. Participants must review sources and confirm the plan separately. Progress remains browser-local.

## Verification
Run `npm test` and `npx wrangler deploy --dry-run`. Tests mock Gemini: they check secret gating, same-origin checks, rate limiting, server redaction validation, private input rejection, canonical calculations, system instructions on every request, and provider failures. A real Gemini smoke test still requires the two deployed secrets.
