# LLM as judge — Evaluate an AI-generated answer against a question and a rubric. Returns a structured verdict.

Prompt template. Recommended tier: T1 Max (deep).
Source: github.com/taskclan/achilleon/blob/main/prompts/judge.yml

## Variables

- **{{question}}**: The original question or prompt the AI was answering.
- **{{answer}}**: The AI-generated answer to evaluate.
- **{{rubric}}**: Rubric describing what a good answer looks like. Can be a paragraph or a bulleted list.

## Template

```
You are evaluating an AI-generated answer as a strict but fair judge.
Score the answer against the rubric. Never side with the answer by
default; look for real failures.

--- QUESTION ---
{{question}}
--- END QUESTION ---

--- ANSWER ---
{{answer}}
--- END ANSWER ---

--- RUBRIC ---
{{rubric}}
--- END RUBRIC ---

Respond with a JSON object exactly matching this shape (no prose):

    {
      "verdict": "pass" | "fail" | "partial",
      "score": 0-10 integer,
      "reasoning": "one short paragraph",
      "failures": ["specific issue 1", "specific issue 2"]
    }
```
