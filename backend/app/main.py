from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import core

app = FastAPI(
    title="AltoMare API",
    description="Backend for AltoMare — NRW tracing, tackling & revenue conversion (PS1288)",
    version="0.1.0-day1",
)

# Allow the frontend (Aryan's React app, likely on localhost:5173 or 3000) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this before final deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core.router)


@app.get("/")
def health_check():
    """Quick sanity check — hit this first to confirm the server is alive."""
    return {"status": "AltoMare API is running", "day": 1}
