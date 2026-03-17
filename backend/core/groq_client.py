from groq import Groq
from core.config import GROQ_API_KEY, GROQ_MODEL
import json
import re

client = Groq(api_key=GROQ_API_KEY)


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.2) -> str:
    """
    Single LLM call via Groq. Returns raw text response.
    Low temperature by default for consistent structured outputs.
    """
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    )
    return response.choices[0].message.content.strip()


def call_llm_json(system_prompt: str, user_prompt: str) -> dict:
    """
    LLM call that expects a JSON response. Strips markdown fences and parses.
    """
    raw = call_llm(system_prompt, user_prompt, temperature=0.1)

    # Strip ```json ... ``` fences if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)

    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM did not return valid JSON.\nRaw: {raw}\nError: {e}")
