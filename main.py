# main.py
from dotenv import load_dotenv
load_dotenv()                      # <<< MUST be first

from fastapi import FastAPI
from providers.gemini import query_brand

app = FastAPI()

@app.get("/search")
async def search(brand: str):
    return await query_brand(brand)
