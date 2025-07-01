import os, httpx
from fastapi import HTTPException

GEMINI_URL = ("https://generativelanguage.googleapis.com/"
              "v1beta/models/gemini-2.5-flash:generateContent")
API_KEY = os.environ["GEMINI_API_KEY"]

async def query_brand(brand: str) -> dict:
    payload = {
        "contents": [{"parts": [{"text": f"What do people say about {brand}?"}]}],
        "safetySettings": [{"category":"HARM_CATEGORY_HARASSMENT","threshold":"BLOCK_NONE"}],
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(f"{GEMINI_URL}?key={API_KEY}", json=payload)
    if r.status_code != 200:
        raise HTTPException(r.status_code, r.text)
    out = r.json()["candidates"][0]["content"]["parts"][0]["text"]
    return {"provider":"gemini","text":out}

