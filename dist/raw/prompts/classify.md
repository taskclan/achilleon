# Classify into a fixed set — Classify a piece of text into exactly one of a small set of labels. Returns just the label.

Prompt template. Recommended tier: T1 Core (fast).
Source: github.com/taskclan/achilleon/blob/main/prompts/classify.yml

## Variables

- **{{text}}**: The text to classify.
- **{{labels}}**: Comma-separated list of allowed labels. E.g. "billing, technical, refund, general".
- **{{unknown_label}}** (optional): The label to return when no other label fits. E.g. "other" or "unknown". — default: `unknown`

## Template

```
Classify the text below into EXACTLY ONE of these labels:
{{labels}}

If none fit, respond with: {{unknown_label}}

Rules:
- Output the single label, lowercase, and NOTHING else.
- No explanation, no punctuation, no code fences.

--- TEXT ---
{{text}}
--- END ---
```
