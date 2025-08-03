# main.py
from dotenv import load_dotenv
load_dotenv()                      # <<< MUST be first

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from providers.gemini import query_brand
import time
from collections import defaultdict

app = FastAPI(
    title="VibeRank API",
    description="Brand sentiment analysis API",
    version="1.0.0",
    docs_url=None,  # Disable automatic docs in production
    redoc_url=None  # Disable automatic redoc in production
)

# Security: Add CORS middleware with restricted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Only allow frontend origin
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Simple in-memory rate limiting
rate_limit_storage = defaultdict(list)
RATE_LIMIT = 10  # requests per minute

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    now = time.time()
    
    # Clean old entries
    rate_limit_storage[client_ip] = [
        timestamp for timestamp in rate_limit_storage[client_ip] 
        if now - timestamp < 60
    ]
    
    # Check rate limit
    if len(rate_limit_storage[client_ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Try again later."}
        )
    
    # Record this request
    rate_limit_storage[client_ip].append(now)
    
    # Add security headers
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

@app.get("/search")
async def search(brand: str):
    """Search for brand sentiment information."""
    return await query_brand(brand)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
