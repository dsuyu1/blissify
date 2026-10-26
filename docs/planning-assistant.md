# Planning assistant exercise

Participants apply redactions, preview and save the prepared copy, attach it alongside the quote and anonymous requirements, then ask the assistant to plan. The assistant does the arithmetic; people check the source inputs, fees and guest requirements before human approval.

Local rehearsal remains available by default. Optional live Gemini mode is enabled by the facilitator on each laptop. Live requests send minimized workshop data, the user message and bounded recent conversation to Gemini through a server endpoint; the key stays on Cloudflare. See [Gemini setup](gemini-setup.md) for secrets, configuration and limits, and [agent instructions](../server/planner-prompt.js) for the policy included on every request.

The document editor handles fictional structured fields, not real PDF files. Redaction must be applied, not merely marked. Server validation reconstructs the safe document independently of browser values. Prompt guidance supplements these controls; it does not guarantee model behavior or detect every type of sensitive free text.

The interface is an original Blissify layout guided by the supplied screenshot. Expected baseline: catering $3,840; total $15,840; reserve $4,160. The venue deposit is included in the package, subject to contract review. Outputs require source review before approval.
