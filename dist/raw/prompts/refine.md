# Refine text with feedback — Rewrite a draft in response to specific feedback, preserving intent and unaffected sections.

Prompt template. Recommended tier: T1 Flow (balanced).
Source: github.com/taskclan/achilleon/blob/main/prompts/refine.yml

## Variables

- **{{draft}}**: The current text to refine.
- **{{feedback}}**: The specific changes to apply. Can be a bulleted list or a paragraph.
- **{{preserve}}** (optional): What must NOT change. E.g. "keep all code snippets exactly as-is", "keep the ending paragraph". — default: `keep everything not explicitly targeted by the feedback`

## Template

```
Refine the draft below by applying the feedback. Follow these rules:

1. Apply every piece of feedback that is actionable. If a feedback item
   is unclear, note it in a one-line "clarify:" comment at the end and
   skip it rather than guessing.
2. Preserve: {{preserve}}
3. Do not editorialise about the feedback. Output only the refined
   version, followed by any clarify: comments.

--- DRAFT ---
{{draft}}
--- END DRAFT ---

--- FEEDBACK ---
{{feedback}}
--- END FEEDBACK ---
```
