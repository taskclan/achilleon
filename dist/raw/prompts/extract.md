# Extract structured data — Pull structured fields out of unstructured text into a JSON object matching the shape you describe.

Prompt template. Recommended tier: T1 Flow (balanced).
Source: github.com/taskclan/achilleon/blob/main/prompts/extract.yml

## Variables

- **{{text}}**: Unstructured source text.
- **{{shape}}**: Description of the JSON shape you want out. For example a TypeScript-style type such as "name: string; email: string; company: string or null".

- **{{strict}}** (optional): If "true", missing fields become null. If "false", the model may infer plausible values from context. — default: `true`

## Template

```
Read the source text below and extract a JSON object matching this shape:

    {{shape}}

Rules:
- Output ONLY the JSON object. No prose, no code fences, no commentary.
- When strict={{strict}}: for missing fields, use null. Do not invent values.
- If a value cannot be represented in the given shape, omit the entire object and output {"_error": "reason"} instead.

--- SOURCE ---
{{text}}
--- END ---
```
