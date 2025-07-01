from fastapi import FastAPI
from providers.gemini import query_brand

app = FastAPI()

@app.get("/search")
async def search(brand: str):
    return await query_brand(brand)

