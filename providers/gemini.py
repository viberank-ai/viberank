import os
import httpx
from fastapi import HTTPException

GEMINI_URL = ("https://generativelanguage.googleapis.com/"
              "v1beta/models/gemini-2.5-flash:generateContent")

# Ensure API key is set at startup
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

async def query_brand(brand: str) -> dict:
    # Validate input
    if not brand or not brand.strip():
        raise HTTPException(status_code=400, detail="Brand name cannot be empty")
    
    # Sanitize brand name (limit length)
    brand = brand.strip()[:100]  # Limit to 100 characters
    
    payload = {
        "contents": [{"parts": [{"text": f"What do people say about {brand}?"}]}],
        "safetySettings": [{"category":"HARM_CATEGORY_HARASSMENT","threshold":"BLOCK_NONE"}],
    }
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Use headers instead of query parameter for API key (more secure)
            headers = {"x-goog-api-key": API_KEY}
            r = await client.post(GEMINI_URL, json=payload, headers=headers)
            
        if r.status_code != 200:
            # Don't expose detailed error messages to clients
            raise HTTPException(
                status_code=r.status_code, 
                detail="Failed to fetch brand information"
            )
            
        # Handle potential missing data in response
        try:
            response_data = r.json()
            out = response_data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError):
            raise HTTPException(
                status_code=500, 
                detail="Invalid response from AI service"
            )
            
        return {"provider": "gemini", "text": out}
        
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504, 
            detail="Request timeout while fetching brand information"
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=503, 
            detail="Service temporarily unavailable"
        )

