# Translate text — Translate text into a target language, preserving tone, formatting, and code fences.

Prompt template. Recommended tier: T1 Flow (balanced).
Source: github.com/taskclan/achilleon/blob/main/prompts/translate.yml

## Variables

- **{{text}}**: Source text.
- **{{target_language}}**: The target language. E.g. "French", "Japanese", "Yoruba", "es-MX".
- **{{tone}}** (optional): Optional tone override. E.g. "formal", "conversational", "technical documentation". — default: `match the source tone`

## Template

```
Translate the text below into {{target_language}}. Preserve tone
("{{tone}}"), formatting, and any code fences exactly. Never translate
content inside code fences.

If a phrase has no faithful equivalent, translate for meaning and add
a one-line footnote at the very end explaining the choice.

--- SOURCE ---
{{text}}
--- END ---
```
