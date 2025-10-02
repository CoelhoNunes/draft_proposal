from __future__ import annotations
import os
from typing import List, Dict
import httpx
from dotenv import load_dotenv

load_dotenv()

class LLMAdapter:
    """Minimal OpenAI-only chat adapter using `OPENAI_KEY`.

    Usage:
        llm = LLMAdapter()
        text = llm.chat([{"role":"system","content":"..."},{"role":"user","content":"..."}])
    """

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_KEY", "")
        self.openai_model = os.getenv("OPENAI_MODEL", os.getenv("MODEL_NAME", "gpt-4o"))

    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.2, max_tokens: int = 1200) -> str:
        if self.openai_key:
            headers = {
                "Authorization": f"Bearer {self.openai_key}",
                "Content-Type": "application/json",
            }
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": self.openai_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            async with httpx.AsyncClient(timeout=60) as client:
                r = await client.post(url, headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
                return data["choices"][0]["message"]["content"].strip()

        return "[MOCK OUTPUT]\nSet OPENAI_KEY in .env to enable generation."
