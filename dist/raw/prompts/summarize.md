# Summarize text — Produce a tight, faithful summary of a body of text at a controllable length and altitude.

Prompt template. Recommended tier: T1 Flow (balanced).
Source: github.com/taskclan/achilleon/blob/main/prompts/summarize.yml

## Variables

- **{{text}}**: The source text to summarise.
- **{{length}}** (optional): Target length. One of "one sentence", "one paragraph", "bulleted", "5 bullets", "detailed". — default: `one paragraph`
- **{{audience}}** (optional): Who the summary is for. Shapes altitude and jargon level. E.g. "senior engineer", "non-technical exec", "10 year old". — default: `general reader`

## Template

```
Summarise the text below at length "{{length}}" for the audience "{{audience}}".

Rules:
- Faithful to the source. Do not add facts.
- Skip generic hedges like "in conclusion" or "overall".
- If the source is empty or too short to summarise, say so and stop.

--- SOURCE TEXT ---
{{text}}
--- END ---
```
