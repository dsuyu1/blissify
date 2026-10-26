# Planning assistant exercise

The chat layout uses a familiar conversation sidebar, welcome prompts, attachment picker, composer, and light/dark themes. It is an original Blissify interface guided by the supplied screenshot; the Figma community kit could not be retrieved because the connected Figma account reached its tool limit.

## Participant workflow
1. Mark unnecessary identifiers and individual guest details in Documents.
2. Apply redactions, preview the resulting copy, and save the prepared summary.
3. In Planning assistant, attach that summary, the catering quote, and anonymous guest requirements.
4. Ask for a complete budget with fees and remaining reserve.
5. Review the quoted inputs, service charge, accessibility and meal requirements; flag unrelated instructions in the supplier text.
6. Confirm the reviewed plan before joint final approval.

The assistant performs the arithmetic. Participants assess what information is necessary, whether its source is trustworthy, and whether the output preserves requirements. They do not have to redo every calculation.

## Implementation and limits
This is a deterministic local workshop simulator, explicitly labeled in the interface. It does not call an LLM, accept arbitrary uploads, or transmit files to an external AI. The prepared planning envelope only contains allowlisted totals and anonymous requirements. The original fictional document remains available in the exercise editor, but sensitive fields are excluded from the planning envelope.

Applying redaction differs from merely marking text. This editor handles structured fictional fields, not real PDF redaction. In real use, follow institutional data policy, choose an approved AI service, and verify the exported redacted file.

Expected calculation: catering 80 × $40 plus 20% service charge = $3,840; total $15,840; reserve $4,160. The venue deposit is included in the package, subject to contract review.
