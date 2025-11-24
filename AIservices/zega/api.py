import sys
from pathlib import Path

# Add parent directory to Python path for module imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from core.model import ZegaModel
from core.memory import ZegaMemory
import os
from dotenv import load_dotenv

# Load environment variables from parent directory if not found in current
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="ZEGA - Self-Learning Model")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Components
memory = ZegaMemory(persistence_path="zega_store")
zega = ZegaModel(memory=memory)

class PredictRequest(BaseModel):
    user_id: str
    context: str
    instruction: Optional[str] = None
    mode: str = "continuation" # continuation, scene

class LearnRequest(BaseModel):
    user_id: str
    text: str
    rating: float

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        # zega.predict is now async
        result = await zega.predict(
            user_id=request.user_id,
            context=request.context,
            instruction=request.instruction,
            mode=request.mode
        )
        return {"content": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/learn")
async def learn(request: LearnRequest):
    try:
        zega.learn(
            user_id=request.user_id,
            text=request.text,
            feedback_score=request.rating
        )
        return {"status": "learned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ZEGA is active", "version": "0.1.0-MVP"}

@app.get("/metrics")
async def get_metrics():
    """Get training metrics and system stats."""
    try:
        model_metrics = zega.get_metrics()
        memory_stats = memory.get_stats()
        return {
            "model": model_metrics,
            "memory": memory_stats,
            "status": "healthy"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user's writing profile and statistics."""
    try:
        profile = memory.get_user_profile(user_id)
        if profile:
            return profile
        return {"message": "No profile found for this user", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
