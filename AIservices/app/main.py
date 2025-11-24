from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import Character, SceneContext, GenerationResponse, FeedbackRequest
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Story AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Story AI Service is running. Use /predict endpoint for AI generation."}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Story AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
