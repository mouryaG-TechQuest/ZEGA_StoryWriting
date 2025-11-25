import sys
from pathlib import Path

# Add parent directory to Python path for module imports
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from core.model import ZegaModel
from core.model_v2 import ZegaModelV2
from core.memory import ZegaMemory
import os
import json
import asyncio
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

# Initialize V2 (Agentic AI with Ensemble)
USE_V2 = os.getenv("ZEGA_USE_V2", "true").lower() == "true"

if USE_V2:
    zega = ZegaModelV2(memory=memory)
    print("[API] 🚀 Using ZEGA v2.0 - Agentic AI with Ensemble")
else:
    zega = ZegaModel(memory=memory)
    print("[API] 📡 Using ZEGA v1.0 - Classic mode")

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

# V2-specific endpoints
if USE_V2:
    class PredictAgenticRequest(BaseModel):
        user_id: str
        context: str
        instruction: Optional[str] = None
        mode: str = "scene"
    
    @app.post("/predict/agentic")
    async def predict_agentic(request: PredictAgenticRequest):
        """Agentic prediction with planning and reflection."""
        try:
            result = await zega.predict_agentic(
                user_id=request.user_id,
                context=request.context,
                instruction=request.instruction,
                mode=request.mode
            )
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/user/{user_id}/training-stats")
    async def get_training_stats(user_id: str):
        """Get fine-tuning training statistics for user."""
        try:
            stats = zega.get_user_training_stats(user_id)
            return stats
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/user/{user_id}/trigger-finetuning")
    async def trigger_finetuning(user_id: str):
        """Manually trigger fine-tuning for user."""
        try:
            success = await zega.trigger_user_fine_tuning(user_id)
            if success:
                return {"status": "success", "message": f"Fine-tuned model 'zega-{user_id}' created"}
            else:
                return {"status": "failed", "message": "Fine-tuning failed. Check logs."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/models/available")
    async def get_available_models():
        """Get list of all available teacher models."""
        try:
            models = zega.ensemble.get_available_models()
            return {"models": models, "total": len(models)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    class AutoTrainRequest(BaseModel):
        user_id: str
        num_examples: int = 50
        genres: Optional[List[str]] = None
        store_in_memory: bool = False
        save_to_database: bool = False
    
    @app.post("/auto-train")
    async def auto_train(request: AutoTrainRequest):
        """
        Automatically generate training data for user model with ensemble voting.
        
        The AI automatically:
        - Generates stories using all 7 teacher models (Gemini, Groq, HuggingFace, Ollama)
        - Uses ensemble voting to select the best output from all models
        - Stores the best parameters and model settings for fine-tuning
        - Tracks which models perform best for different genres
        - Optionally saves high-quality stories (≥8.0/10) to database for user access
        
        Args:
            user_id: User identifier
            num_examples: Number of examples to generate (1-1000)
            genres: Optional list of specific genres from all 25 available genres
            store_in_memory: Whether to also store examples in RAG memory
            save_to_database: Whether to save high-quality stories to database (accessible to user)
            
        Returns:
            Training results including:
            - Success count and quality scores
            - Model performance metrics (which models performed best)
            - Stories saved to database count
            - Genre distribution
            - Fine-tuning readiness status
        """
        try:
            # Validate num_examples
            if not 1 <= request.num_examples <= 1000:
                raise HTTPException(
                    status_code=400, 
                    detail="num_examples must be between 1 and 1000"
                )
            
            result = await zega.auto_train(
                user_id=request.user_id,
                num_examples=request.num_examples,
                genres=request.genres,
                store_in_memory=request.store_in_memory,
                save_to_database=request.save_to_database
            )
            
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/auto-train-stream")
    async def auto_train_stream(request: AutoTrainRequest):
        """
        Auto-train with real-time progress streaming using Server-Sent Events (SSE).
        
        This endpoint streams progress updates as the training happens, allowing
        the frontend to display real-time progress information.
        """
        try:
            # Validate num_examples
            if not 1 <= request.num_examples <= 1000:
                raise HTTPException(
                    status_code=400, 
                    detail="num_examples must be between 1 and 1000"
                )
            
            async def generate_progress():
                """Generate SSE events for training progress."""
                progress_queue = asyncio.Queue()
                
                async def progress_callback(progress_data: Dict[str, Any]):
                    """Callback function to receive progress updates."""
                    await progress_queue.put(progress_data)
                
                # Start training in background
                training_task = asyncio.create_task(
                    zega.auto_train_with_progress(
                        user_id=request.user_id,
                        num_examples=request.num_examples,
                        genres=request.genres,
                        store_in_memory=request.store_in_memory,
                        save_to_database=request.save_to_database,
                        progress_callback=progress_callback
                    )
                )
                
                # Stream progress updates
                while not training_task.done():
                    try:
                        # Wait for progress update with timeout
                        progress_data = await asyncio.wait_for(
                            progress_queue.get(),
                            timeout=0.5
                        )
                        # Send SSE event
                        yield f"data: {json.dumps(progress_data)}\n\n"
                    except asyncio.TimeoutError:
                        # Send heartbeat to keep connection alive
                        yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.1)
                
                # Get final result
                result = await training_task
                
                # Send completion event
                yield f"data: {json.dumps({'type': 'complete', 'result': result})}\n\n"
            
            return StreamingResponse(
                generate_progress(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/training/genres")
    async def get_training_genres():
        """Get list of available genres for auto-training."""
        try:
            genres = zega.get_available_training_genres()
            return {
                "genres": genres,
                "total": len(genres),
                "description": "Available genres for automatic training data generation"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
